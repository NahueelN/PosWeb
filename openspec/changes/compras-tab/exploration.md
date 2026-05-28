## Exploration: Compras Tab (Purchases)

### Current State

**Stock Management:**
- `StockSucursal` entity (ProductoId + SucursalId composite key) with domain methods `AumentarStock()`, `DescontarStock()`, `AjustarStock()`
- `StockSucursalService.AjustarStock(productoId, sucursalId, nuevoStock)` — sets stock to absolute value (not an increment)
- No endpoint exists for a purchase flow (stock increase + gasto recording in one transaction)
- `GET /api/stock?sucursalId=N` returns full catalog with per-branch stock

**Caja & Gastos:**
- `Caja` entity has `MONTO_GASTOS` (decimal) — set only at close time via `Caja.Cerrar(gastos)`
- `CerrarCajaRequest` has a `Gastos` decimal — manually typed by the operator during cierre
- No itemized gasto records, no link between gastos and products
- `CierrePreviewDto` has no gastos field — preview doesn't reflect any purchases
- `CajaService.ObtenerPreviewCierre()` doesn't aggregate gastos from anywhere

**Product Management:**
- `POST /api/productos` creates via `ProductoUpsertDto` (codigoBarra, nombre, precio, costo, tamano)
- `ProductoUpsertDto` has Costo field (currently unused in purchase context)
- CodigoBarra has unique constraint

**Frontend Pattern (VentasPage):**
- Full-width search grid with `ProductCardPanel` reusable component
- Right panel: cart with quantity controls
- Bottom bar: payment methods + confirm button
- Heavy keyboard navigation (arrows for grid, Tab for flow, Enter to confirm)
- Products loaded client-side from `api.productos.listar()`
- Caja check before confirming (must have open caja)

**Frontend Layout:**
- Layout.tsx has hardcoded nav links array — no `/compras` route exists
- Keyboard shortcuts: F1=Ventas, F2=Caja, F3=Stock, F4=Productos, F5=Clientes, F11=Fullscreen
- No shortcut available for Compras (F6 is free)

### Affected Areas

**Backend (New):**
- `PosWeb/Controllers/ComprasController.cs` — new endpoint `POST /api/compras`
- `PosWeb/Application/Compras/CompraService.cs` — new service for purchase orchestration
- `PosWeb.Domain/Gasto.cs` — new entity for itemized gasto records (if approach requires it)
- `PosWeb.Contracts/CompraRequestDto.cs` — new DTOs for purchase request/response
- `PosWeb.Contracts/CompraItemDto.cs` — line item DTO

**Backend (Modified):**
- `PosWeb/Data/PosDbContext.cs` — add `DbSet<Gasto>` if new entity created
- `PosWeb/Data/PosDbContext.cs` — add entity configuration for Gasto
- `PosWeb.Domain/Caja.cs` — optional: add `AgregarGasto()` domain method for real-time gasto accumulation
- `PosWeb.Contracts/CierrePreviewDto.cs` — add Gastos summary to preview
- `PosWeb/Application/Cajas/CajaService.cs` — update `ObtenerPreviewCierre()` to include purchase gastos
- `PosWeb.Application/Ventas/VentaService.cs` — reference pattern (not directly modified)

**Frontend (New):**
- `frontend/src/pages/ComprasPage.tsx` — new page (search grid + cart + confirm)
- `frontend/src/api/client.ts` — add `api.compras.crear()` method

**Frontend (Modified):**
- `frontend/src/App.tsx` — add `/compras` route
- `frontend/src/components/Layout.tsx` — add nav link + keyboard shortcut (F6)
- `frontend/src/types/index.ts` — add CompraRequest/CompraResponse DTOs

### Approaches

1. **Single CompraController with in-transaction stock+gasto (Recommended)**

   One endpoint `POST /api/compras` that accepts `{ sucursalId, items: [{ productoId, cantidad, costoUnitario }], nuevosProductos?: [{ codigoBarra, nombre, precio, costo, tamano }] }`.

   Inside a single DB transaction:
   - If `nuevosProductos` provided, create products first
   - For each item: `StockSucursal.AumentarStock(cantidad)` (upsert if no row exists)
   - For each item: create a `Gasto` record linked to the active caja
   - Return the purchase result

   Gastos are tracked via a new `Gasto` entity (`ID_GASTO, ID_CAJA, ID_PRODUCTO, CANTIDAD, COSTO_UNITARIO, TOTAL, FECHA, ID_USUARIO`). At cierre time, `Caja.MONTO_GASTOS` is either:
   - **Option A**: Computed from `SUM(Gasto.TOTAL) WHERE ID_CAJA = X` — auto-populated in the close form
   - **Option B**: Keep manual entry but show accumulated purchases as a reference

   - Pros: Single atomic operation, full audit trail, clean separation of concerns, backward-compatible with existing cierre flow
   - Cons: New entity + migration required, cierre flow needs slight modification to read gastos
   - Effort: Medium

2. **Lightweight: Stock increment endpoint + separate gasto tracking**

   Two separate concerns:
   - `POST /api/stock/aumentar` — increments stock for a product in a sucursal (new method: `StockSucursalService.AumentarStock(productoId, sucursalId, cantidad)`)
   - Frontend calls stock increase + keeps gasto info locally
   - At cierre time, operator manually enters aggregated gastos as today

   - Pros: Minimal backend changes, no new entity, existing cierre flow untouched
   - Cons: No audit trail of purchases, no itemization, operator must manually remember/type gastos, no link between stock increase and expense
   - Effort: Low

3. **Full gasto entity with real-time caja update**

   Like approach 1 but also updates `Caja.MONTO_GASTOS` in real-time after each purchase:
   - New domain method `Caja.AgregarGasto(decimal monto)`
   - `MONTO_GASTOS` accumulates live during the day
   - At cierre preview, gastos are already reflected
   - At cierre, the accumulated gastos are used directly

   - Pros: Real-time caja state, cierre is one less field to fill, always accurate
   - Cons: Higher complexity, Caja entity becomes mutable during the day (currently write-once at close), potential for discrepancies if compras are deleted/rolled back
   - Effort: High

### Recommendation

**Approach 1 (Single CompraController with in-transaction stock+gasto), Option A (gastos computed at cierre from Gasto table).**

Rationale:
1. **Atomicity** — stock increase and gasto recording happen together. No partial states.
2. **Audit trail** — every purchase is recorded with product, quantity, cost, user, and timestamp. Essential for accounting.
3. **Backward compatibility** — existing cierre flow still works. The `CierrePreviewDto` gets a new `totalGastos` field (sum of Gasto records), and the close form can pre-populate the Gastos input with this value. Operator can still override.
4. **Reuses existing domain methods** — `StockSucursal.AumentarStock()` already exists, `StockSucursalService` already handles upsert logic.
5. **Follows existing patterns** — mirrors `VentaService.CrearVenta()` (which also does stock changes + record creation in a service method).
6. **The Costo field already exists** on `ProductoDto` and `ProductoUpsertDto` — it's just unused in purchases today.

Key design decisions:
- **Gasto entity** lives in the Domain layer, with its own EF config
- **CompraService** takes `PosDbContext` and creates Gasto records directly (like VentaService creates PagoVenta)
- **Stock increase** uses `StockSucursalService.AumentarStock()` or direct `StockSucursal.AumentarStock()` via context
- **Caja link**: each Gasto references `ID_CAJA` (the active caja at time of purchase)
- **Cierre integration**: `CajaService.ObtenerPreviewCierre()` adds a `TotalGastos` from `_context.Gastos.Where(g => g.ID_CAJA == cajaId).Sum(g => g.TOTAL)`. The frontend CajaPage pre-fills the gastos input.
- **Product quick-create**: if a product doesn't exist (by barcode search), the endpoint accepts `nuevosProductos` array to create them in the same transaction.

### Risks

1. **Transaction scope**: Purchase operations span StockSucursal + Gasto + possibly Producto creation. Must use `DbContext.Database.CreateExecutionStrategy()` or explicit transaction to ensure atomicity.
2. **Active caja requirement**: Purchases should only be allowed when a caja is open (for gasto tracking). Need to handle the "no active caja" edge case — should purchases be blocked, or allowed without gasto tracking?
3. **Stock upsert for uninitialized products**: If a product has no `StockSucursal` row for the given sucursal, `AumentarStock()` won't work (it's an increment, not a set). The service must upsert (create row with stock=cantidad, or find+increment).
4. **Gasto retro-compatibility**: Existing cierres won't have Gasto records. The cierre UI must handle both: if Gasto records exist, pre-fill; if not, allow manual entry as before.
5. **Product cost tracking**: The `costoUnitario` in the purchase might differ from `Producto.COSTO`. Should we update `Producto.COSTO` on each purchase? That's a separate decision. For MVP, just record the purchase cost in the Gasto record without updating the product master cost.
6. **Frontend complexity**: The compras page needs product quick-create UI (a modal or inline form when barcode not found), which adds UX complexity vs. just searching.

### Ready for Proposal
Yes — all code patterns exist in the codebase to be replicated, and the domain entities have the required methods already (AumentarStock, Costo field, etc.).
