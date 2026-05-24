## Exploration: separate-catalog-from-stock

### Current State
Product creation is still catalog+global-stock coupled end to end. `frontend/src/pages/ProductosPage.tsx` requires a `Stock` input on create, sends it to `api.productos.crear`, and `PosWeb/Application/Productos/ProductoService.cs` persists that value into `Producto.STOCK`. The same service also returns `ProductoDto.Stock = p.STOCK` for list/search/barcode flows, so the product catalog API is currently the source for every stock badge shown outside the dedicated stock page.

Per-branch stock already exists separately in `StockSucursal`. `PosWeb/Application/StockSucursal/StockSucursalService.cs` reads and writes `STOCK_POR_SUCURSAL`, and `frontend/src/pages/StockPage.tsx` edits those records through `PUT /api/stock/ajustar`. Sales depend on branch stock, not on `Producto.STOCK`: `PosWeb/Application/Ventas/VentaService.cs` loads `StockSucursal` by `(productoId, sucursalId)`, rejects the sale when no row exists or stock is insufficient, and deducts only `stockSuc.Stock`. However, the sales search UI in `frontend/src/pages/VentasPage.tsx` still shows `p.stock` from `ProductoDto`, so the user sees global/catalog stock while the backend validates branch stock.

There is also an important drift bug already in the code: product edit requests from `ProductosPage` omit `stock`, but `ProductoService.Modificar` still executes `producto.CambiarStock(dto.Stock)`, which means editing name/price/cost can reset `Producto.STOCK` to `0`.

### Affected Areas
- `PosWeb.Domain/Producto.cs` — still models global stock as part of the catalog entity and exposes stock mutation behavior.
- `PosWeb.Contracts/ProductoDto.cs` — mixes catalog fields with stock, so every product API payload carries operational stock.
- `PosWeb/Application/Productos/ProductoService.cs` — create/list/search/update all read or write `Producto.STOCK`.
- `PosWeb/Controllers/ProductosController.cs` — product endpoints currently accept/return the mixed DTO.
- `frontend/src/pages/ProductosPage.tsx` — product creation requires stock; product list renders global stock badges; edit flow accidentally zeroes stock.
- `PosWeb.Domain/StockSucursal.cs` — current branch stock aggregate used by stock adjustments and sales validation.
- `PosWeb/Application/StockSucursal/StockSucursalService.cs` — stock page query is anchored on existing `StockSucursal` rows, so products with zero/uninitialized branch stock are invisible.
- `PosWeb/Controllers/StockController.cs` — current API exposes stock only for rows that already exist.
- `frontend/src/pages/StockPage.tsx` — shows only products returned by `GET /api/stock`; empty/uninitialized catalog products are not discoverable.
- `PosWeb/Application/Ventas/VentaService.cs` — sales correctness already depends on branch stock presence and quantity.
- `frontend/src/pages/VentasPage.tsx` — suggestion badges display `ProductoDto.stock`, which does not match sale validation rules.
- `frontend/src/types/index.ts` and `frontend/src/api/client.ts` — shared frontend contracts assume product payloads include stock.

### Approaches
1. **Compatibility-first split** — make product create/edit catalog-only, keep `Producto.STOCK` temporarily in storage for compatibility, and move operational UI/behavior to branch stock flows.
   - Pros: Smallest first slice, aligns UX with real sales rules, limits blast radius, and fits chained delivery well.
   - Cons: Leaves a temporary duplicate field in the database/domain until a later cleanup change.
   - Effort: Medium

2. **Hard split now** — remove `Producto.STOCK` from domain/contracts/UI in the same change and fully migrate every caller to branch or derived stock.
   - Pros: Cleaner end state immediately, no ambiguous legacy field left behind.
   - Cons: Higher migration risk, broader API/frontend/test churn, and more likely to exceed a safe review slice.
   - Effort: High

### Recommendation
Choose **Approach 1** for the first implementation slice.

The first slice should do four things only: (1) remove stock capture from product creation/edit so products become catalog-only, (2) stop using `ProductoDto.stock` in product and sales UX where it implies operational availability, (3) make the stock page branch-centric over the full active catalog so missing `StockSucursal` rows appear as `0`/"not initialized" and can be assigned inline, and (4) keep sale validation on `StockSucursal` exactly as it already works. This fixes the user-facing lie WITHOUT forcing an immediate schema purge.

Recommended boundaries for slice 1:
- In scope: product create/edit payload changes, stock-page query/model changes to include active products without rows, sales search/display change to show selected-branch stock (or no stock badge until branch-aware data is available), and regression tests around these flows.
- Out of scope: deleting the `PRODUCTOS.STOCK` column, stock transfer workflows, receiving/purchase flows, aggregate inventory reporting, and historical reconciliation of global stock values.

### Risks
- `ProductoDto` is shared across list/search/create/update; changing it can break multiple frontend screens at once unless request/response contracts are split carefully.
- Existing data likely has products with meaningful values in `PRODUCTOS.STOCK` but missing `STOCK_POR_SUCURSAL` rows. After the split, those products will be unsellable until branch stock is initialized.
- The current product edit bug can silently zero global stock today, so any migration/backfill that trusts `PRODUCTOS.STOCK` as a source of truth is unsafe.
- `StockSucursalService.ListarPorSucursal()` currently starts from `_context.StockSucursales`; changing visibility to full catalog likely requires a left join/projection redesign and careful filtering for inactive products.
- `VentasPage` currently calls `api.productos.buscar()` without branch context. Showing truthful stock in suggestions may require a branch-aware search/read model instead of reusing the catalog endpoint.
- Existing OpenSpec `venta` spec still describes dual deduction of `Producto.STOCK` and `StockSucursal`, but the current implementation only deducts `StockSucursal`. Proposal/spec work must reconcile that inconsistency before apply.

### Ready for Proposal
Yes — propose a compatibility-first change that separates catalog creation from operational stock assignment, makes zero/uninitialized branch stock visible and editable, and aligns sales/product UX with branch stock as the real availability source.
