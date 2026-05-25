# Spec: Venta UX — Single Payment, Keyboard Nav, Sticky Bar

## REQ-01: Single payment per sale

The sales screen MUST allow selecting exactly ONE payment method per sale. Amount auto-fills to the sale total. No "Agregar pago" step, no "Pagos agregados" list, and no "ya agregado" disabled state SHALL exist.
(Previously: allowed adding multiple payment methods per sale with intermediate "Agregar pago" flow)

#### Scenario 1.1: Cash with optional vuelto

- GIVEN sale total is $1000
- WHEN user selects "Efectivo" (pagaVuelto) from payment grid
- THEN amount auto-fills to $1000
- AND optional "Recibió" input appears for cambio calculation
- AND confirm button becomes enabled

#### Scenario 1.2: Card without vuelto

- GIVEN sale total is $1000
- WHEN user selects "Tarjeta Débito" (no pagaVuelto) from payment grid
- THEN amount auto-fills to $1000
- AND no "Recibió" input appears
- AND confirm button becomes enabled

#### Scenario 1.3: Cambio computed from Recibió

- GIVEN user selected "Efectivo" with total $1000
- WHEN user enters "Recibió" $1500
- THEN the system computes vuelto as $500

#### Scenario 1.4: Recibió left empty

- GIVEN user selected "Efectivo" with total $1000
- WHEN user leaves "Recibió" empty
- THEN payment amount remains $1000
- AND no vuelto is computed
- AND confirm button remains enabled

#### Scenario 1.5: Switch payment method

- GIVEN user has selected "Efectivo"
- WHEN user taps a different medio (e.g., "Tarjeta Débito")
- THEN selection switches to the new medio
- AND amount re-fills to sale total
- AND confirm button remains enabled

#### Scenario 1.6: No medio selected

- GIVEN no payment method is selected
- WHEN viewing the confirm button
- THEN button is disabled
- AND button text indicates "Seleccionar medio"

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

A fixed bottom bar MUST show sale total, selected medio name, and confirm button. Paid amount and remaining balance SHALL NOT be shown.
(Previously: showed paid amount and remaining balance alongside total)

#### Scenario 4.1: Bar displays content

- GIVEN a sale in progress with items and a selected medio
- WHEN viewing the sticky bar
- THEN it shows item count, total amount, selected medio name, and confirm button

#### Scenario 4.2: Confirm button states

- GIVEN the sticky bar is visible
- WHEN no caja is open → button shows "Sin caja abierta" (disabled)
- WHEN caja is open but no medio selected → button shows "Seleccionar medio" (disabled)
- WHEN caja is open and medio is selected → button shows "Confirmar venta" (enabled)

#### Scenario 4.3: Fixed position

- GIVEN page content overflows viewport height
- WHEN user scrolls the page
- THEN sticky bar remains fixed at `bottom-0` and does not scroll with content

## REQ-05: Result screen with payment breakdown

After a successful sale, the result screen MUST show each payment method and amount.

- **Scenario 5.1**: Result shows total, sale ID, date, and list of `(medioPagoNombre, monto)` pairs
- **Scenario 5.2**: If cambio > 0, show "Vuelto" line in green
