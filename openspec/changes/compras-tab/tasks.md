# Tasks: Compras Tab

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~700-900 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (within 800-line budget) |
| Delivery strategy | exception-ok |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

## Phase 1: Foundation (Backend)

- [ ] 1.1 Create `PosWeb.Domain/Gasto.cs` entity with ID_GASTO, ID_CAJA, MONTO, FECHA, DETALLE
- [ ] 1.2 Add `DbSet<Gasto>` and inline EF config in `PosWeb/Data/PosDbContext.cs`
- [ ] 1.3 Create EF migration `AddGasto` for GASTOS table
- [ ] 1.4 Create `PosWeb.Contracts/CompraRequestDto.cs` (CompraRequestDto, CompraItemDto, NuevoProductoDto)
- [ ] 1.5 Create `PosWeb.Contracts/CompraResponseDto.cs` (CompraResponseDto, CompraItemResultDto)
- [ ] 1.6 Create `PosWeb/Application/Compras/CompraService.cs` with atomic transaction (validate caja → create productos → upsert stock → create Gasto → commit)
- [ ] 1.7 Create `PosWeb/Controllers/CompraController.cs` with `POST /api/compras/crear`
- [ ] 1.8 Add `TotalGastos` property to `PosWeb.Contracts/CierrePreviewDto`
- [ ] 1.9 Update `CajaService.ObtenerPreviewCierre()` to `SUM(Gasto.MONTO)` per active caja

## Phase 2: Core Implementation (Frontend)

- [ ] 2.1 Add `CompraItemDto`, `CompraRequestDto`, `CompraResponseDto`, `NuevoProductoDto` to `frontend/src/types/index.ts`
- [ ] 2.2 Add `api.compras.crear(dto)` method to `frontend/src/api/client.ts`
- [ ] 2.3 Create `frontend/src/pages/CompraPage.tsx` with product search grid, cart panel with costo inputs, confirm button
- [ ] 2.4 Add `<Route path="/compras" element={<CompraPage />} />` to `frontend/src/App.tsx`
- [ ] 2.5 Add `/compras` nav link and `['F6', () => navigate('/compras')]` to `frontend/src/components/Layout.tsx`

## Phase 3: Testing

- [ ] 3.1 Write `CompraServiceTest` happy path — creates Gasto + increases stock atomically
- [ ] 3.2 Test no active caja → throws `CompraSinCajaActivaException` (400)
- [ ] 3.3 Test empty items → validation error
- [ ] 3.4 Test `nuevosProductos` creates products atomically
- [ ] 3.5 Test duplicate barcode in `nuevosProductos` → 409 Conflict
- [ ] 3.6 Test stock upsert for uninitialized product/sucursal pair
