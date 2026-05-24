# Spec: Venta UX — Multipago, Keyboard Nav, Sticky Bar

## REQ-01: Multipago

The sales screen MUST allow adding multiple payment methods to a single sale.

- **Scenario 1.1**: User selects "Efectivo", enters $500, adds it → payment appears in "Pagos agregados" list
- **Scenario 1.2**: User then selects "Tarjeta Débito", enters $300, adds it → both payments tracked
- **Scenario 1.3**: Total paid updates in real time; remaining balance shown in amber warning
- **Scenario 1.4**: User removes a payment via X button → remaining balance recalculated
- **Scenario 1.5**: Payment method already used is disabled in the selector grid ("ya agregado")

## REQ-02: Pago con cambio (vuelto)

When a payment method has `pagaVuelto: true` (e.g., Efectivo), the user MAY enter how much they received to compute cambio.

- **Scenario 2.1**: User selects Efectivo, enters monto $500, enters "Recibió" $1000 → displayed as "(recibió $1000, vuelto $500)"
- **Scenario 2.2**: User selects Efectivo, enters monto $500, leaves "Recibió" empty → normal payment, no cambio displayed

## REQ-03: Suggestions keyboard navigation

Product suggestions dropdown MUST support keyboard navigation with ArrowUp, ArrowDown, and Enter.

- **Scenario 3.1**: User types "pan" → suggestions appear; pressing ArrowDown highlights first suggestion, then second, etc.
- **Scenario 3.2**: With a suggestion highlighted, pressing Enter adds that product to the sale
- **Scenario 3.3**: ArrowUp from first suggestion does nothing (stays at index 0)
- **Scenario 3.4**: ArrowDown past last suggestion does nothing (stays at last index)
- **Scenario 3.5**: Highlighted item has visible ring/bg to indicate focus

## REQ-04: Sticky total bar

A fixed bottom bar MUST show sale totals and the confirm button.

- **Scenario 4.1**: Bar shows item count, total, paid amount (if any), remaining balance (if any), and confirm button
- **Scenario 4.2**: Confirm button text changes: "Sin caja abierta" when no active caja, "Faltan $X" when payments incomplete, "Confirmar venta" when ready
- **Scenario 4.3**: Bar is `fixed bottom-0` and does not scroll with content

## REQ-05: Result screen with payment breakdown

After a successful sale, the result screen MUST show each payment method and amount.

- **Scenario 5.1**: Result shows total, sale ID, date, and list of `(medioPagoNombre, monto)` pairs
- **Scenario 5.2**: If cambio > 0, show "Vuelto" line in green
