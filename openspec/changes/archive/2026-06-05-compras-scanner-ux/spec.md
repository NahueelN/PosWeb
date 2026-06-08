# Spec: Compras Scanner UX

## Requirements

### Requirement: Scanner-First Search Input

The system MUST provide a text input at the top of the CompraPage that is:

- **Auto-focused** when the component mounts (and after every successful product add)
- **Cleared** after a successful add, ready for the next scan
- **Searchable**: as the user types, the product grid filters in real time (by `codigoBarra` or `nombre`)
- **Scanner-aware**: when the input receives an Enter keydown AND the current value matches a product barcode exactly, the matching product is added to the cart immediately (without requiring a button click)

#### Scenario: Scanning a barcode adds the product to cart

- GIVEN the CompraPage is open
- AND the search input is focused
- WHEN a barcode scanner sends "7790890000012" followed by Enter
- AND that barcode matches an existing product
- THEN one unit (or the current quantity value) of that product is added to the cart
- AND the input is cleared
- AND the input remains focused for the next scan

#### Scenario: Manual search filters products

- GIVEN the CompraPage is open
- WHEN the user types "coca" in the search input
- THEN the product grid filters to only show products whose name or barcode contains "coca"
- AND the filter updates on every keystroke (debounced by 150ms)

#### Scenario: Enter on partial text does NOT add to cart

- GIVEN the search input contains a partial text match (no exact barcode)
- WHEN the user presses Enter
- THEN no product is added to the cart
- AND the input retains focus

### Requirement: Inline Quantity Specification

The system MUST provide a numeric input adjacent to the search field where the user can specify the quantity to add. The quantity defaults to 1 and is used the next time a product is added (via scan Enter or grid click).

#### Scenario: Scanning with custom quantity

- GIVEN the quantity input shows "24"
- WHEN the user scans a product barcode
- THEN 24 units of that product are added to the cart
- AND the quantity resets to 1

### Requirement: Three-Step Navigation

The system MUST use a step state machine with three steps: `scan`, `confirm`, `done`. Only one step is visible at a time. The cart state persists across step transitions.

#### Step: SCAN

Visible components:
- Search input (focused)
- Quantity input
- Product grid (filtered or full)
- Cart panel with current items (quantities, subtotals, total)
- "Ver resumen" button (enabled when cart has items)
- "Seguir escaneando" button when returning from confirm

#### Scenario: Adding products during scan step

- GIVEN the CompraPage is in the `scan` step
- WHEN products are added via barcode or manual click
- THEN the cart panel updates live
- AND "Ver resumen" becomes enabled
- AND the user can continue scanning additional products

#### Step: CONFIRM

Visible components:
- Invoice-style table listing all cart items (see Requirement: Confirmación Estilo Boleta)
- Checkbox: "He verificado que las cantidades y precios coinciden con la boleta física"
- "Confirmar compra" button (disabled until checkbox is checked)
- "Volver a editar" button → returns to scan step with cart intact

#### Scenario: Confirming a purchase

- GIVEN the CompraPage is in the `confirm` step
- AND the cart has items
- AND the verification checkbox is checked
- WHEN the user clicks "Confirmar compra"
- THEN the system calls `POST /api/compras/crear`
- AND transitions to the `done` step on success
- AND shows the receipt/comprobante

#### Scenario: Confirming without verification

- GIVEN the CompraPage is in the `confirm` step
- AND the verification checkbox is NOT checked
- WHEN the user tries to click "Confirmar compra"
- THEN the button is disabled
- AND no API call is made

#### Scenario: Returning to edit from confirm

- GIVEN the CompraPage is in the `confirm` step
- WHEN the user clicks "Volver a editar"
- THEN the page returns to the `scan` step
- AND all cart items are preserved

#### Step: DONE

Visible components:
- Success badge
- Receipt-style comprobante (see Requirement: Comprobante Final Estilo Ticket)
- "🔄 Nueva compra" button → resets cart and returns to scan step
- "❌ Cerrar" button → navigates to the previous page
- "🖨️ Imprimir" button → opens `window.print()` with receipt-specific CSS

#### Scenario: New purchase after success

- GIVEN the CompraPage is in the `done` step
- WHEN the user clicks "Nueva compra"
- THEN the cart is cleared
- AND the page returns to the `scan` step with the search input focused

### Requirement: Confirmación Estilo Boleta

The confirmation step MUST display a table styled as an invoice/boleta that includes:

- Header with date and sucursal name
- Table columns: Código (barcode), Producto, Cantidad, Costo Unitario, Subtotal
- Footer row with total gasto
- Checkbox for physical verification

The table MUST be designed to be visually clear and printable (using `@media print` CSS).

#### Scenario: Invoice table shows correct data

- GIVEN 3 products in the cart
- WHEN the user transitions to the `confirm` step
- THEN a table shows all 3 products with their quantities, costs, and subtotals
- AND the total matches the sum of all subtotals
- AND each row shows the product's barcode

### Requirement: Comprobante Final Estilo Ticket

After a successful purchase, the system MUST display a receipt/comprobante styled as a thermal ticket that includes:

- Store name: "PosWeb — Punto de Venta"
- Comprobante number: `C-{fecha}-{gastoId}`
- Date and sucursal
- Line items: Producto, Cantidad, Costo Unitario, Subtotal
- Total gasto
- Total units count
- Success indicator (checkmark or green badge)

#### Scenario: Receipt shows after successful purchase

- GIVEN the CompraPage is in the `confirm` step
- WHEN the POST to `/api/compras/crear` succeeds
- THEN the `done` step shows the receipt with the response data
- AND the comprobante number uses the `gastoId` from the response
- AND the total matches `totalGasto` from the response

### Requirement: Error Handling

The system MUST handle API errors gracefully without losing cart data.

#### Scenario: API error during confirm

- GIVEN the CompraPage is in the `confirm` step
- WHEN the POST to `/api/compras/crear` fails (network error, 400, 401, 409)
- THEN an error message is displayed inline on the confirm step
- AND the cart items are preserved
- AND the user can correct and retry

#### Scenario: Empty cart cannot proceed to confirm

- GIVEN the cart is empty
- WHEN viewing the `scan` step
- THEN the "Ver resumen" button is disabled
- AND a helper message shows "Agregue productos al carrito para continuar"

### Requirement: Keyboard Navigation

The entire flow MUST be operable without a mouse.

| Key | Context | Action |
|-----|---------|--------|
| Enter | search input (exact barcode) | Add product to cart |
| Enter | search input (partial text) | No action |
| Escape | scan step | Clear search input |
| Tab | after quantity input | Focus search input (for scanner flow) |
| Enter | confirm step (checkbox checked) | Confirm purchase |
| Escape | confirm step | Return to scan |
| Escape | done step | Close / navigate back |

### Requirement: Debounce Scanner Input

To prevent duplicate adds when a scanner sends Enter twice, the system MUST ignore repeated identical scans within 500ms. Track the last scanned barcode and timestamp; if the same barcode arrives within 500ms, skip.

#### Scenario: Duplicate scan ignored

- GIVEN a valid barcode was just added to the cart
- WHEN the same barcode is received within 500ms
- THEN the product is NOT added again
- AND no error is shown
