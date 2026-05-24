# Spec: Venta Full Keyboard Operation

## REQ-01: Tab Order Flow

The sales screen MUST have a logical Tab order: search input → items table → payment section → confirm button.

- **Scenario 1.1**: Pressing Tab from search input moves to first item quantity input (if items exist), or to the payment method grid
- **Scenario 1.2**: Tab order skips disabled/hidden elements
- **Scenario 1.3**: Shift+Tab moves backward through the same chain

## REQ-02: Payment Grid Arrow Navigation

The payment method selector grid MUST support arrow key navigation.

- **Scenario 2.1**: ArrowRight moves selection to the next medio button in row
- **Scenario 2.2**: ArrowLeft moves to the previous medio button
- **Scenario 2.3**: ArrowDown moves to the medio button in the next row (same column)
- **Scenario 2.4**: ArrowUp moves to the medio button in the previous row
- **Scenario 2.5**: Enter or Space selects the highlighted medio button
- **Scenario 2.6**: Already-used medios (`yaUsado`) are skipped in arrow navigation

## REQ-03: Auto-focus Monto Input

When a payment method is selected, the monto input MUST receive focus automatically.

- **Scenario 3.1**: User presses Enter on a medio button → monto input is focused immediately
- **Scenario 3.2**: User clicks a medio button → monto input is focused (same behavior for both input methods)

## REQ-04: Escape Key

Escape MUST dismiss the current popup/selection and return focus to the search input.

- **Scenario 4.1**: Suggestions dropdown visible → Escape closes suggestions, returns focus to search
- **Scenario 4.2**: Payment method selected (monto input visible with medio highlighted) → Escape clears selection, returns focus to search
- **Scenario 4.3**: Neither suggestions nor payment selection active → Escape does nothing (noop)

## REQ-05: Enter to Add Payment

When the monto input is focused and has a valid value, Enter MUST add the payment.

- **Scenario 5.1**: Focus on monto input, valid amount → Enter triggers `agregarPago()`
- **Scenario 5.2**: After adding, if `restante > 0` → focus moves to first available medio button
- **Scenario 5.3**: After adding, if `restante <= 0` → focus moves to confirm button

## REQ-06: Enter to Confirm Sale

When focus is on the confirm button, Enter MUST submit the sale.

- **Scenario 6.1**: Confirm button focused, Enter pressed → `confirmarVenta()` called
- **Scenario 6.2**: Confirm button disabled (no caja or incomplete payment) → Enter does nothing

## REQ-07: Enter on "Nueva Venta" Result Button

The "Nueva venta" button on the result screen MUST respond to Enter key.

- **Scenario 7.1**: Result screen visible, "Nueva venta" button focused → Enter triggers `nuevaVenta()`

## REQ-08: Focus Indicators

All interactive elements MUST show a visible focus ring.

- **Scenario 8.1**: Each medio button has `focus:ring-2 focus:ring-indigo-500/50` or equivalent
- **Scenario 8.2**: The confirm button has `focus:ring-2 focus:ring-indigo-500` or equivalent
- **Scenario 8.3**: Item quantity inputs have visible focus style
- **Scenario 8.4**: "Remove item" buttons have visible focus style
- **Scenario 8.5**: "Agregar" payment button has visible focus style
