# Tasks: Historial de Ventas

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~520 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Backend) → PR 2 (Frontend) |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

```
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium
```

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend: DTOs + Service + Controller | PR 1 | Testable via Swagger independently |
| 2 | Frontend: Types + API + Page + Nav + Route | PR 2 | Depends on PR 1 backend being merged |

---

## Phase 1: DTOs — Backend Contracts

- [x] 1.1 Create `PosWeb.Contracts/PagedResult.cs` — generic `PagedResult<T>` with `Items`, `TotalCount`, `Page`, `PageSize`, computed `TotalPages`
- [x] 1.2 Create `PosWeb.Contracts/VentaHistorialDto.cs` — `VentaId`, `Fecha`, `SucursalNombre`, `Total`, `CantidadItems`
- [x] 1.3 Create `PosWeb.Contracts/RenglonHistorialDto.cs` — `ProductoId`, `ProductoNombre`, `CodigoBarra`, `Cantidad`, `PrecioUnitario`, `Subtotal`
- [x] 1.4 Create `PosWeb.Contracts/VentaDetalleDto.cs` — `VentaId`, `Fecha`, `SucursalId`, `SucursalNombre`, `Total`, `List<RenglonHistorialDto> Items`
- [x] 1.5 Create `PosWeb.Contracts/VentaHistorialFiltro.cs` — `FechaDesde?`, `FechaHasta?`, `SucursalId?`, `Page`, `PageSize` (defaults: Page=1, PageSize=20)

## Phase 2: Backend Core — Service + Controller

- [x] 2.1 Add `ObtenerHistorial(VentaHistorialFiltro)` and `ObtenerDetalle(int)` to `PosWeb/Application/Ventas/VentaService.cs` — manual LINQ joins (VENTAS ⨝ SUCURSALES, RENGLONES_VENTA ⨝ PRODUCTOS), optional sucursalId filter, `.Count()/.Skip()/.Take()/.OrderByDescending(FECHA)`, return `PagedResult<VentaHistorialDto>` and `VentaDetalleDto?`
- [x] 2.2 Add `GET /api/ventas` to `PosWeb/Controllers/VentasController.cs` — query params `fechaDesde`, `fechaHasta`, `sucursalId`, `page`, `pageSize`; defaults (30-day range); validation (400 on `fechaDesde > fechaHasta`, 400 on invalid `sucursalId`); delegates to service
- [x] 2.3 Add `GET /api/ventas/{id}` to `PosWeb/Controllers/VentasController.cs` — returns 200 with `VentaDetalleDto` or 404
- [x] 2.4 Verify `ObtenerHistorial` date boundary — `fechaHasta` uses `DateTime.Today.AddDays(1)` for inclusive end-of-day in controller

## Phase 3: Frontend Types + API Layer

- [x] 3.1 Add `VentaHistorialDto`, `VentaDetalleDto`, `RenglonHistorialDto`, `PagedResult<T>`, `VentaHistorialParams` interfaces to `frontend/src/types/index.ts`
- [x] 3.2 Add `ventas.historial(params)` and `ventas.detalle(id)` to `frontend/src/api/client.ts` — `historial` serializes query params via `URLSearchParams`, skips undefined/empty; `detalle` is simple GET

## Phase 4: Frontend Page — HistorialVentasPage

- [x] 4.1 Create `frontend/src/pages/HistorialVentasPage.tsx` — filter bar (date from/to, sucursal dropdown from `api.sucursales.listar()`, Buscar button), loading/error/empty states (per StockPage pattern), table with columns (N° Venta, Fecha, Sucursal, Items, Total, expand chevron), expandable inline detail lazy-loaded from `api.ventas.detalle(id)`, pagination controls (Anterior/Siguiente with disabled states, "Página X de Y")

## Phase 5: Navigation + Routing

- [x] 5.1 Add `{ to: '/historial', label: 'Historial', icon: '📋' }` to `frontend/src/components/Layout.tsx` links array between Ventas and Productos
- [x] 5.2 Add `<Route path="/historial" element={<HistorialVentasPage />} />` to `frontend/src/App.tsx` and import

## Phase 6: Testing

- [ ] 6.1 Unit test: `VentaService.ObtenerHistorial` with date range filter returns filtered paginated results (scenarios S1, S2, S5)
- [ ] 6.2 Unit test: `VentaService.ObtenerDetalle` with existing/non-existing ventaId (scenarios S6, S7)
- [ ] 6.3 Integration test: `GET /api/ventas` with invalid `fechaDesde > fechaHasta` returns 400 (scenario S3)
- [ ] 6.4 Integration test: `GET /api/ventas` with invalid `sucursalId` returns 400 (scenario S4)
- [ ] 6.5 Integration test: `GET /api/ventas/{id}` for non-existing id returns 404 (scenario S7)
- [ ] 6.6 Verify existing `POST /api/ventas` unchanged (spec R1 — no regression)

**Test approach**: If test infra exists (xUnit), use in-memory SQLite or mocked DbContext for service tests. If not, manual via Swagger + browser.
