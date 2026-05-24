# Proposal: Sales UX Multipago + Keyboard Navigation

## Intent

Improve the sales screen UX to support real-world POS workflows: split payments, keyboard-first product search, and clear payment progress feedback.

## Scope

**In scope:**
- Multipago: select payment methods, enter amounts, add/remove payments until total is covered
- Keyboard navigation: ArrowUp/Down/Enter for product suggestions with visual highlight
- Sticky total bar: fixed bottom bar showing item count, total, paid amount, remaining balance, and confirm button
- Result screen: show payment method breakdown with cambio/vuelto
- Pago con cambio: when using a method that returns change (e.g., Efectivo), show "recibió" field and compute vuelto

**Out of scope:**
- Backend changes (multipago already supported)
- Database schema changes
- Tests (no frontend test framework)
- Other pages or navigation

## Approach

One-file rewrite of `frontend/src/pages/VentasPage.tsx`:

1. Replace single `medioPagoId` selection with `PaymentEntry[]` array
2. Add medio selector grid (disabled after use), monto input, "recibió" field for cambio methods
3. Track `total`, `totalPagado`, `restante` as computed values
4. Disable "Confirmar venta" until `restante <= 0 && paymentEntries.length > 0`
5. Add `highlightIdx` state + ArrowUp/Down/Enter handlers for suggestions
6. Move total + confirm button to `fixed bottom-0` bar
7. Show payment breakdown in result screen

## Risks

- Low — single file, no API changes, minimal blast radius
- Edge case: user adds payment > restante — prevented by `max={restante}` input validation
- Edge case: same payment method used twice — prevented by `yaUsado` disabled state
