# Tasks: Stock por Sucursal

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~620 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1: Domain + DTO + DbConfig + Migration → PR 2: Service + Controller + Venta modify → PR 3: Frontend |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain + DB foundation | PR 1 | Entity, DTO, exceptions, DbContext, migration. No runtime logic yet. |
| 2 | Backend services | PR 2 | Service, controller, VentaService modification, DI. Builds on PR 1 |
| 3 | Frontend | PR 3 | StockPage, API client, types, routing. Independent of PR 2 logic. |

## Phase 1: Foundation (Domain + DTO + Exceptions)

- [ ] 1.1 Create `PosWeb.Domain/StockSucursal.cs` — entity with DescontarStock(), AumentarStock(), AjustarStock() matching Producto pattern; domain validation (stock >= 0)
- [ ] 1.2 Create `PosWeb.Contracts/StockSucursalDto.cs` — DTO with JsonPropertyName (productoId, productoNombre, codigoBarra, sucursalId, stock)
- [ ] 1.3 Create `PosWeb/Exceptions/StockSucursalNoExisteException.cs` — ServiceException for missing (productoId, sucursalId) combo
- [ ] 1.4 Modify `PosWeb.Domain/Exceptions/StockInsuficienteException.cs` — add `IdSucursal` property, update message with sucursal context

## Phase 2: Database (DbContext + Migration)

- [ ] 2.1 Modify `PosWeb/Data/PosDbContext.cs` — add `DbSet<StockSucursal> StockSucursales`, Fluent config: table `STOCK_POR_SUCURSAL`, composite unique index on (ID_PRODUCTO, ID_SUCURSAL), FKs to Producto and Sucursal
- [ ] 2.2 Run `dotnet ef migrations add AddStockPorSucursal` and verify generated migration creates `STOCK_POR_SUCURSAL` correctly

## Phase 3: Backend Services (Service + Controller + Venta Modify + DI)

- [x] 3.1 Create `PosWeb/Application/StockSucursal/StockSucursalService.cs` — ListarPorSucursal(), Obtener(), AjustarStock(), ListarBajoStock() with .Include(s => s.Producto) for DTO projection
- [x] 3.2 Create `PosWeb/Controllers/StockController.cs` — GET /api/stock, GET /api/stock/bajo, PUT /api/stock/ajustar using StockSucursalService
- [x] 3.3 Modify `PosWeb/Application/Ventas/VentaService.cs` — inject StockSucursalService, before each venta.AgregarRenglon(): load StockSucursal by (productoId, sucursalId), validate stock >= cantidad, call stockSuc.DescontarStock()
- [x] 3.4 Modify `PosWeb/Program.cs` — register `StockSucursalService` as scoped, add using for namespace

## Phase 4: Frontend (Types + API + Page + Routing)

- [x] 4.1 Modify `frontend/src/types/index.ts` — add `StockSucursalDto` and `AjustarStockDto` interfaces
- [x] 4.2 Modify `frontend/src/api/client.ts` — add `api.stock` object with listar(), bajoStock(), ajustar() methods
- [x] 4.3 Create `frontend/src/pages/StockPage.tsx` — sucursal selector (dropdown), editable stock table with inline input, low-stock rows (bg-amber-50 when stock <= 5), empty state
- [x] 4.4 Modify `frontend/src/App.tsx` — add `<Route path="/stock" element={<StockPage />} />`
- [x] 4.5 Modify `frontend/src/components/Layout.tsx` — add `{ to: '/stock', label: 'Stock' }` to links array

## Phase 5: Verification

- [ ] 5.1 Verify `dotnet test` passes — existing tests must not break
- [ ] 5.2 Verify `npx tsc -b` passes — frontend type-checks cleanly
- [ ] 5.3 Manual smoke test: create stock via PUT /api/stock/ajustar, sell via POST /api/ventas, verify per-sucursal deduction
