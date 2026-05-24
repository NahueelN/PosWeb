# Tasks: Separate Catalog from Stock — Slice 1

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: Low

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~260-340 for PR 1; ~700-900 total across chain |
| 400-line budget risk | Low for PR 1 / High for full change |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 catalog-write split -> PR 2 branch stock read model -> PR 3 sales lookup cleanup |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Catalog-only product writes + stock-init CTA | PR 1 | Base = tracker branch; verifies `producto-catalogo` only |
| 2 | Full-catalog branch stock grid + missing-row init | PR 2 | Base = PR 1 branch; verifies `stock-sucursal` scenarios |
| 3 | Branch-aware sales lookup + remove global stock hint | PR 3 | Base = PR 2 branch; verifies `venta` display truth |

## Phase 1: Contracts + Backend foundation

- [x] 1.1 Create `PosWeb.Contracts/ProductoUpsertDto.cs` with `CodigoBarra`, `Nombre`, `Precio`, `Costo`; keep stock out of product write payloads.
- [x] 1.2 Modify `PosWeb/Application/Productos/ProductoService.cs` so `Crear`/`Modificar` accept `ProductoUpsertDto`; remove `CambiarStock()` from edit flow and preserve legacy `Producto.STOCK` as compatibility-only.
- [x] 1.3 Modify `PosWeb/Controllers/ProductosController.cs` so `POST`/`PUT` bind `ProductoUpsertDto` while `GET`/`buscar` still return `ProductoDto` for read compatibility.

## Phase 2: Product UI slice

- [x] 2.1 Modify `frontend/src/types/index.ts` and `frontend/src/api/client.ts` to add a product upsert type and use it for `api.productos.crear/actualizar`.
- [x] 2.2 Modify `frontend/src/pages/ProductosPage.tsx` to remove create/edit stock input and stock column badges from catalog maintenance UI.
- [x] 2.3 In `frontend/src/pages/ProductosPage.tsx`, after successful create, show a clear next step linking to `/stock` with the created product context for intentional branch-stock initialization.

## Phase 3: Verification

- [x] 3.1 Extend `PosWeb.Application.Test/ProductoServiceTest.cs` for spec scenarios “Create product without stock” and “Edit product without changing stock”, asserting edits no longer reset legacy stock.
- [x] 3.2 Run `dotnet test` for backend regressions around product create/edit/search flows.
- [x] 3.3 Run `npx tsc -b` and confirm the product page compiles with the new write contract and CTA wiring.

## Phase 4: Next slice handoff

- [x] 4.1 Before PR 2, implement `PosWeb/Application/StockSucursal/StockSucursalService.cs`, `PosWeb/Controllers/StockController.cs`, and `frontend/src/pages/StockPage.tsx` full-catalog/uninitialized flow as the next autonomous slice.

## Phase 5: Sales branch-aware search (PR 3 / Slice 3)

- [x] 5.1 Add `BuscarParaVenta` to `ProductoService` that searches by name AND barcode, and returns branch stock from `StockSucursal` instead of global `PRODUCTOS.STOCK`.
- [x] 5.2 Add `GET /api/productos/buscar-venta` endpoint accepting `q` and `sucursalId`.
- [x] 5.3 Add `api.productos.buscarParaVenta` method in the frontend client.
- [x] 5.4 Update `VentasPage` search to use the branch-aware endpoint with `ctxSucursal.id`.
- [x] 5.5 Update sales suggestion stock badge: show `0` → "sin stock" in red, low stock → amber, ok → green.
- [x] 5.6 Run `dotnet build` and `npx tsc -b` to verify.
- [x] 5.7 Run `dotnet test` to confirm no regressions.
