# Tasks: Redesign Purchases Screen (redisenar-pantalla-compras)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~530 |
| 800-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

## Phase 1: Backend Foundation

- [x] 1.1 `CompraRequestDto.cs` — Remove `NuevosProductos`, add optional creation fields (`CodigoBarra`, `Nombre`, `Precio`, `Costo`, `Tamano`) to `CompraItemDto`
- [x] 1.2 `CompraService.cs` — Unify items loop: if `ProductoId == 0` create product inline; if `precio`/`costo` differ call `CambiarPrecio`/`CambiarCosto`; remove `nuevosProductos` loop
- [x] 1.3 `CompraController.cs` — Add validation: item with `ProductoId == 0` missing `codigoBarra` or `nombre` returns 400

## Phase 2: Backend Testing

- [x] 2.1 Adapt "existing items purchase" test — replace `NuevosProductos` with unified `Items`, verify stock + Gasto
- [x] 2.2 Adapt "inline creation" test — item with `ProductoId == 0` + inline fields creates product atomically
- [x] 2.3 Adapt "duplicate barcode" test — inline creation with existing barcode returns 409
- [x] 2.4 New test: price/cost update — item with different `precio`/`costo` triggers domain methods
- [x] 2.5 New test: price/cost unchanged — matching values skip product update
- [x] 2.6 New test: inline creation missing required fields returns 400
- [x] 2.7 Verify empty items still returns 400 (existing test unchanged)

## Phase 3: Frontend Types + API Client

- [x] 3.1 `frontend/src/types/index.ts` — Update `CompraItemDto` with optional fields, remove `nuevosProductos` from `CompraRequestDto`
- [x] 3.2 `frontend/src/api/client.ts` — Remove `nuevosProductos` from `compras.crear` call (no change needed — client passes DTO as-is)

## Phase 4: Frontend UI

- [x] 4.1 `CompraPage.tsx` — Rewrite: barcode search → resolve (edit/creation form) → add to unified list → confirm with verification checkbox → submit
- [x] 4.2 `CompraPage.css` — Adjust styles for new layout (scan input row, item list rows, confirm panel) — existing print styles suffice, all layout uses Tailwind utilities

## Phase 5: Cleanup

- [x] 5.1 Verify `dotnet build` compiles backend without errors
- [x] 5.2 Verify `npx tsc -b` compiles frontend without TS errors
- [x] 5.3 Run `dotnet test` — all tests pass (40 application tests, 39 domain tests — 0 failures)
