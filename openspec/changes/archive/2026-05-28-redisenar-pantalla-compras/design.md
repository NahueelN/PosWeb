# Design: Redesign Purchases Screen

## Technical Approach

Replace the current all-in-one product grid + carrito flow with an item-by-item scan-resolve pipeline. Backend: merge `NuevosProductoDto` into `CompraItemDto` and add price/cost update logic. Frontend: rewrite `CompraPage.tsx` to remove the product grid and implement a three-phase flow (scan → resolve → confirm). Existing search endpoints (`GET /api/productos/barra/{codigo}`, `GET /api/productos/buscar?q=`) are reused — no new backend endpoints needed.

## Architecture Decisions

### Decision: Unified CompraItemDto with optional creation fields

**Choice**: Merge `CompraItemDto` and `NuevoProductoDto` into a single DTO carrying both purchase and optional creation/update fields.
**Alternatives**: Keep separate arrays (current design), use a discriminated union type.
**Rationale**: Single array simplifies the frontend state (no dual list management), reduces API surface, and makes the request JSON flatter. The `productoId == 0` sentinel distinguishes inline creation from existing product reference — same contract the current code already uses.

### Decision: Price/cost update via Producto domain methods

**Choice**: Call `producto.CambiarPrecio()` / `producto.CambiarCosto()` when the request provides different values.
**Alternatives**: Delegate to `ProductoService.Modificar()`, update raw properties in the service.
**Rationale**: Existing domain methods already enforce validation (positive precio, non-negative costo). Calling them directly avoids adding a dependency on `ProductoService` and keeps the change local to `CompraService`. The current `CompraService` already creates products inline — this extends the same pattern.

### Decision: Frontend as a single component with clear phases

**Choice**: Keep `CompraPage.tsx` as a single component, restructured into three render phases (scan, confirm, done).
**Alternatives**: Split into multiple sub-components (`BarcodeScanner`, `ProductResolveForm`, `PurchaseConfirm`).
**Rationale**: The existing codebase uses single-file pages. Given the moderate complexity and team conventions, a well-organized single component with clear section comments reduces cognitive overhead. If the component grows beyond ~400 lines in practice, extraction is straightforward.

### Decision: Reuse existing product search endpoints (no new backend endpoints)

**Choice**: Frontend calls `GET /api/productos/barra/{codigo}` for exact barcode match, falls back to `GET /api/productos/buscar?q=` for name search.
**Alternatives**: Add a dedicated "lookup" endpoint to CompraController.
**Rationale**: Existing endpoints work. No need to couple the search logic with the purchase flow. The barcode endpoint returns 404 for unknown codes, which is the correct signal for showing the creation form.

## Data Flow

```
User types/scan in input
    │
    ▼
GET /api/productos/barra/{codigo}
    │
    ├── 200 → Product found → Show edit form (precio/costo/cantidad editable)
    │                               │
    │                               ▼ User clicks "Agregar"
    │                               │
    │                               └──→ Item added to unified list
    │
    └── 404 → GET /api/productos/buscar?q=
                │
                ├── ≥1 result → Show picker → Edit form → Add to list
                │
                └── 0 results → Show creation form (pre-filled barcode)
                                    │
                                    ▼ User fills fields + "Agregar"
                                    │
                                    └──→ Item added to unified list
                                            │
                                            ▼
                                    User clicks "Ver resumen"
                                            │
                                            ▼
                                    Confirm step (verification checkbox)
                                            │
                                            ▼
                                    POST /api/compras/crear (unified items)
                                            │
                                            ▼
                                   Success → Receipt view
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `PosWeb.Contracts/CompraRequestDto.cs` | Modify | Remove `NuevosProductos`, add optional creation fields to `CompraItemDto` |
| `PosWeb/Application/Compras/CompraService.cs` | Modify | Handle unified items: inline create, price/cost update, remove `NuevosProductos` loop |
| `PosWeb/Controllers/CompraController.cs` | Modify | Add validation for inline creation missing fields returning 400 |
| `PosWeb.Application.Test/CompraServiceTest.cs` | Modify | Adapt existing tests, add price/cost update + inline creation via unified items |
| `frontend/src/types/index.ts` | Modify | Update `CompraItemDto` with optional fields, remove `NuevosProductoDto` from `CompraRequestDto` |
| `frontend/src/pages/CompraPage.tsx` | Rewrite | Full scan-resolve-confirm flow, no product grid, no `nuevosProductos` state |
| `frontend/src/pages/CompraPage.css` | Modify | Minor style adjustments for new layout (if needed) |

## Interfaces / Contracts

### New CompraItemDto (C#)

```csharp
public class CompraItemDto
{
    public int ProductoId { get; set; }          // 0 → create new product
    public int Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }    // Cost per unit for THIS purchase

    // Inline creation fields (required when ProductoId == 0)
    public string? CodigoBarra { get; set; }
    public string? Nombre { get; set; }
    public decimal Precio { get; set; }           // Product sale price
    public decimal? Costo { get; set; }            // Product cost price (optional)
    public string? Tamano { get; set; }
}
```

### CompraRequestDto (C#) — modified

```csharp
public class CompraRequestDto
{
    public int SucursalId { get; set; }
    public List<CompraItemDto> Items { get; set; } = new();
    // NuevosProductos removed
}
```

### CompraItemDto (TypeScript) — modified

```typescript
export interface CompraItemDto {
  productoId: number
  cantidad: number
  costoUnitario: number
  // Optional — for inline creation or price/cost update
  codigoBarra?: string
  nombre?: string
  precio?: number
  costo?: number
  tamano?: string
}

export interface CompraRequestDto {
  sucursalId: number
  items: CompraItemDto[]
  // nuevosProductos removed
}
```

## Testing Strategy

| Layer | What | How |
|-------|------|-----|
| Unit | Existing purchase with valid items creates Gasto and updates stock | Modify existing test — remove `NuevosProductos`, use unified item |
| Unit | Purchase with inline-created products | Adapt `CrearCompra_ConNuevosProductos_CreaProductosAtomicos` — inline creation via unified item with `productoId=0` |
| Unit | Duplicate barcode in inline creation returns 409 | Adapt existing duplicate test — use unified item with inline data |
| Unit | Price/cost update on existing product | New test — item references `productoId` with different `precio`/`costo`, verify product updated |
| Unit | Price/cost unchanged on existing product | New test — item references `productoId` with same `precio`/`costo`, verify no update |
| Unit | Empty items returns 400 | Existing test unchanged |
| Unit | Missing inline fields returns 400 | New test — item with `productoId=0` missing `nombre` or `codigoBarra` |

## Migration / Rollout

No migration required. The `CompraRequestDto` shape changes — old `NuevosProductos` field is removed. No existing purchase data is affected (purchases are not stored with the DTO shape, only the resulting Gasto + StockSucursal records). Rollback: `git checkout HEAD --` the affected files per proposal.

## Decisions Made

- **Costo explícito y opcional**: En creación inline, `Costo` es un campo separado y nullable. Si no se provee, el producto se crea con `Costo = 0`. No toma por defecto el `CostoUnitario` del item.
