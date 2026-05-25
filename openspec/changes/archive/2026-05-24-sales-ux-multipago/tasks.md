# Tasks: Sales UX Multipago

Decision needed before apply: No
Chained PRs recommended: No
400-line budget risk: Low

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~484 (274 insertions, 210 deletions) |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Delivery strategy | single-pr |

## Phase 1: State & Types

- [x] 1.1 Add `PaymentEntry` interface with `medioPagoId`, `medioPagoNombre`, `monto`, `conCambio?`, `pagaVuelto`
- [x] 1.2 Add state: `paymentEntries`, `selectedMedio`, `pagoMonto`, `pagoConCambio`, `highlightIdx`
- [x] 1.3 Add computed values: `total`, `cantidadTotal`, `totalPagado`, `restante`, `esPagoCompleto`
- [x] 1.4 Add refs: `pagoMontoRef`, `searchInputRef`, `confirmBtnRef`, `sugerenciasRef`

## Phase 2: Payment UI

- [x] 2.1 Add medio selector grid (2/3 cols) with `yaUsado` disabled state
- [x] 2.2 Add monto input with `max={restante}` and auto-fill to restante
- [x] 2.3 Add "Recibió" input for `pagaVuelto` medios
- [x] 2.4 Add "Agregar pago" button + Enter key handler
- [x] 2.5 Add "Pagos agregados" list with remove button per entry
- [x] 2.6 Add remaining balance warning (`<div className="bg-amber-50...">`)

## Phase 3: Sticky Total Bar

- [x] 3.1 Create fixed bottom bar with item count, total, paid, remaining, confirm button
- [x] 3.2 Dynamic button text based on state (caja, payment completeness)
- [x] 3.3 Disable confirm when payments incomplete or no caja

## Phase 4: Keyboard Navigation

- [x] 4.1 Add `SUGGESTION_KEYS` constant with ArrowDown, ArrowUp, Enter
- [x] 4.2 Implement `handleSearchKeyDown` with highlightIdx state
- [x] 4.3 Add visual highlight class to suggestion items based on highlightIdx
- [x] 4.4 Reset highlightIdx when suggestions change (useEffect)

## Phase 5: Result Screen

- [x] 5.1 Show payment method breakdown in sale result (nombre + monto per payment)
- [x] 5.2 Show "Vuelto" line when cambio > 0
- [x] 5.3 Reset all payment state on "Nueva venta"

## Phase 6: Verification

- [x] 6.1 Run `npx tsc -b` — verify no TypeScript errors
- [x] 6.2 Run `npx vite build` — verify production build
