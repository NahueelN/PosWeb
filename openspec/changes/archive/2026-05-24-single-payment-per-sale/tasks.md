# Tasks: Single Payment Per Sale

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~110 net (−140 removed, +30 modified) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: State & Computed Cleanup

- [x] 1.1 Remove `PaymentEntry` interface (lines 11–17)
- [x] 1.2 Remove `paymentEntries` state + imports (line 41, cleanup `useState`)
- [x] 1.3 Remove `totalPagado` computed (line 59)
- [x] 1.4 Remove `restante` computed (line 60)
- [x] 1.5 Remove `agregarPago()` function (lines 177–201)
- [x] 1.6 Remove `quitarPago()` function (lines 203–205)
- [x] 1.7 Simplify `handlePagoKeyDown()` — Enter calls `confirmarVenta()` directly (lines 207–216)
- [x] 1.8 Simplify `getPagosDto()` — inline from `selectedMedio`, returns `[dto]` (lines 218–229)
- [x] 1.9 Simplify `esPagoCompleto()` — return `selectedMedio !== null && monto > 0` (lines 231–233)
- [x] 1.10 Remove `pagoMontoRef` (line 55, update `selectMedio` to not focus it)

## Phase 2: Payment UI Simplification

- [x] 2.1 Remove "Pagos agregados" list JSX block (lines 526–550)
- [x] 2.2 Remove `yaUsado` / `disabled` logic on medio grid buttons (lines 559–581, all buttons always clickable)
- [x] 2.3 Remove "ya agregado" label span inside medio buttons (line 577)
- [x] 2.4 Simplify `selectMedio(mp)` — set `pagoMonto = total.toFixed(2)`, no `restante` ref (line 170–175)
- [x] 2.5 Hide monto input for non-`pagaVuelto` medios; show medio name + "Monto: $total" text
- [x] 2.6 For `pagaVuelto` medios: show Recibió input only (no monto input), keep existing vuelto logic
- [x] 2.7 Remove "Agregar" button inside medio panel (lines 612–619)
- [x] 2.8 Remove "Falta agregar" amber warning block (lines 626–631)
- [x] 2.9 Remove `restante > 0` gate on medio selector visibility (line 553) — show when `items.length > 0`

## Phase 3: Confirm Flow & Sticky Bar

- [x] 3.1 Simplify `confirmarVenta()` — validate `!selectedMedio`, build single pago inline, reset only `selectedMedio`/`pagoMonto`/`pagoConCambio` (lines 235–273)
- [x] 3.2 Simplify `nuevaVenta()` — remove `setPaymentEntries` (lines 280–290)
- [x] 3.3 Update sticky bar — remove `totalPagado` / restante / "Faltan" / "Cubierto" display (lines 655–665)
- [x] 3.4 Show selected medio name + amount in sticky bar when set
- [x] 3.5 Update confirm button text/disabled: `!cajaActiva ? "Sin caja abierta" : !selectedMedio ? "Seleccioná un medio de pago" : "Confirmar venta"` (lines 667–681)

## Phase 4: Verification

- [x] 4.1 Run `npx tsc -b` — verify zero TypeScript errors
- [x] 4.2 Run `npx vite build` — verify production build succeeds
- [ ] 4.3 Manual: complete sale with Efectivo (vuelto flow) — select medio, auto-fill total, enter Recibió, confirm, verify cambio in result
- [ ] 4.4 Manual: complete sale with Tarjeta (no vuelto) — select medio, confirm, verify single payment in result
