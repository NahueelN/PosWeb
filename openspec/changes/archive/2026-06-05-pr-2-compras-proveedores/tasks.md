# Tasks: PR 2 — Compras & Proveedores

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~690 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr-default |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

## Phase 1: Backend — Proveedor CRUD

- [x] 1.1 Create `ProveedorDto.cs` + `CrearProveedorRequestDto.cs` in PosWeb.Contracts
- [x] 1.2 Create `ProveedorService.cs` in PosWeb.Application with `Listar(search?)`, `Crear(dto)`, `ObtenerPorId(id)` — auto-generate COD_PROVEEDOR from NOMBRE
- [x] 1.3 Create `ProveedoresController.cs` (GET /api/proveedores?search=, POST /api/proveedores, GET /api/proveedores/{id}) + register `ProveedorService` in Program.cs DI

## Phase 2: Backend — CompraService Atomic Rewrite

- [x] 2.1 Modify `CompraRequestDto.cs`: `Proveedor` → `ProveedorId: int`, add `UserId: int?`. Modify `CompraResponseDto.cs`: add `CompraId: int`, remove `Proveedor`
- [x] 2.2 Rewrite `CompraService.CrearCompra` with new signature `(sucursalId, proveedorId, userId, items, fechaCompra?)` in `IDbContextTransaction`: create Compra → RenglonCompra per item → update stock → create Gasto with ID_COMPRA → assign ID_GASTO to Compra. Old method → `[Obsolete]` wrapper
- [x] 2.3 Update `CompraController.cs` — extract userId via `GetUserId()`, pass `proveedorId` and `userId` to new service method
- [x] 2.4 Write `ProveedorServiceTest` — Listar search filter, Crear auto-code, ObtenerPorId throws on non-existent
- [x] 2.5 Write `CompraServiceTest` — atomicity (all entities persisted after commit, none after rollback), validation (no items, no caja, invalid proveedorId)

## Phase 3: Frontend — Types & API Client

- [x] 3.1 Update `frontend/src/types/index.ts`: `CompraRequestDto.proveedor` → `proveedorId: number`; `CompraResponseDto` add `compraId`; add `ProveedorDto`
- [x] 3.2 Add `api.proveedores.listar(search?)`, `.obtener(id)`, `.crear(dto)` + update `api.compras.crear` DTO in `frontend/src/api/client.ts`

## Phase 4: Frontend — CompraPage Proveedor Selector

- [x] 4.1 Replace free-text proveedor input with searchable dropdown in `CompraPage.tsx` — fetch from `GET /api/proveedores`, send `proveedorId` on submit, display `compraId` in receipt

## Phase 5: Final Verification

- [x] 5.1 Run `dotnet build PosWeb.sln` — 0 errors, 0 warnings
- [x] 5.2 Run `dotnet test PosWeb.sln` — 55/55 tests pass (32 Domain + 55 Application)
- [x] 5.3 Run `npx tsc -b` from frontend/ — 0 errors
- [x] 5.4 Run `npm run lint` — only pre-existing lint issues, none introduced by this PR
