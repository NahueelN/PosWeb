# Purchases UX Specification

## Purpose

Define the frontend purchase flow: a scanner-first, three-step experience (scan → confirm → receipt) for creating purchases efficiently with keyboard-driven operation.

## Requirements

### Requirement: Scanner-First Search Input

The system MUST provide a text input at the top of the CompraPage that is auto-focused when the component mounts and after every successful product add. The input clears after each add and accepts barcode scans via Enter key.

The system MUST call the backend to look up the product. If found, an editable form is shown with the product's current values. If not found, an inline creation form is shown pre-filled with the scanned barcode. Real-time autocomplete suggestions appear after 2+ characters typed (debounced 300ms).

#### Scenario: Scanning a barcode adds the product to cart

- GIVEN the CompraPage is open and the search input is focused
- WHEN a barcode scanner sends a code followed by Enter
- AND that barcode matches an existing product with costo > 0
- THEN the product is added to the cart with the current quantity
- AND the input clears and remains focused

#### Scenario: Manual search shows autocomplete

- GIVEN the CompraPage is open
- WHEN the user types 2+ characters in the search input
- THEN autocomplete suggestions appear from API search
- AND the user can navigate with arrow keys and select with Enter

#### Scenario: Unknown barcode shows creation form

- GIVEN no product matches the scanned barcode
- WHEN the user scans or enters the value and presses Enter
- THEN an inline creation form is shown pre-filled with the barcode
- AND the user can enter nombre, precio, costo, talle, and cantidad

### Requirement: Inline Quantity Specification

The system MUST provide a numeric input adjacent to the search field where the user can specify the quantity to add. The quantity defaults to 1, is used on the next add, and resets to 1 after each add.

#### Scenario: Scanning with custom quantity

- GIVEN the quantity input shows "24"
- WHEN the user scans a product barcode
- THEN 24 units are added to the cart
- AND the quantity resets to 1

### Requirement: Inline Product Updating

When an existing product is found, the user MUST be able to modify precio and costo for this purchase. These changes update both the product record and the purchase item on submit.

#### Scenario: Modifying price and cost

- GIVEN an existing product is resolved and shown in the edit form
- WHEN the user changes precio or costo and confirms
- THEN the item is added to the list with the modified values
- AND the backend updates the product's price and cost atomically on final submit

### Requirement: Unified Item List

The system MUST display all added items in a single list regardless of origin (newly created or existing product). Each item row shows nombre, codigoBarra, cantidad, subtotal, with inline quantity editing and delete.

#### Scenario: Mixed items display together

- GIVEN items from both newly created and existing products
- WHEN viewing the item list
- THEN all items appear in the same list with a "nuevo" badge for inline-created items

### Requirement: Three-Step Navigation (State Machine)

The system MUST use a `useReducer`-based state machine with three steps: `scan`, `confirm`, `done`. Only one step is visible at a time. The cart state persists across all step transitions.

#### Step SCAN

Visible components: search input (focused), quantity input, product autocomplete/grid, cart panel with items/subtotals/total, "Ver resumen" button (enabled when cart has items).

#### Step CONFIRM

Visible components: invoice-style table with monospace font listing all cart items (Codigo, Producto, Cant, Costo, Subtotal), verification checkbox ("He verificado..."), "Confirmar compra" button (disabled until checkbox checked), "Volver a editar" button.

#### Step DONE

Visible components: green success badge, receipt-style comprobante (store name, comprobante number, date, sucursal, itemized table, total, units count), "Nueva compra" (resets to scan), "Cerrar" (navigates back), "Imprimir" (window.print()).

### Requirement: Confirm Purchase

The system MUST require explicit verification before submitting. The confirm button MUST be disabled until the user checks the verification checkbox.

#### Scenario: Verification checkbox enables submit

- GIVEN items are added to the cart and the user is in the confirm step
- WHEN the user checks "He verificado..." and clicks "Confirmar compra"
- THEN the POST request is sent to `/api/compras/crear`
- AND on success transitions to the done step with the receipt

#### Scenario: Backend error shows feedback

- GIVEN the user confirms the purchase
- WHEN the backend returns an error (400, 409)
- THEN the error message is displayed inline on the confirm step
- AND the cart items are preserved for retry

### Requirement: Comprobante Final Estilo Ticket

After a successful purchase, the system MUST display a receipt styled as a thermal ticket (80mm width, monospace font) with `@media print` CSS that hides UI chrome and formats the receipt for printing.

The receipt includes: store name "PosWeb — Punto de Venta", comprobante number `C-{fecha}-{compraId}`, date, sucursal, line items (Producto, Cant, Costo, Subtotal), total gasto, and total units count.

### Requirement: Proveedor Selector

The frontend compra form MUST provide a searchable proveedor selector populated from `GET /api/proveedores`, replacing the free-text proveedor input. The selector appears in the confirm step and sends `proveedorId` (int) instead of `proveedor` (string).

#### Scenario: Selector sends proveedorId

- GIVEN a proveedor is selected from the dropdown
- WHEN the form is submitted
- THEN the request includes `proveedorId` (int)

### Requirement: Keyboard Navigation

The entire flow MUST be operable without a mouse.

| Key | Context | Action |
|-----|---------|--------|
| Enter | search input (exact barcode) | Add product to cart |
| Enter | search input (partial text) | No action |
| Escape | scan step | Clear search input |
| Escape | confirm step | Return to scan |
| Escape | done step | Navigate back / close |
| Arrow keys | autocomplete dropdown | Navigate suggestions |

### Requirement: Debounce Scanner Input

To prevent duplicate adds when a scanner sends Enter twice, the system MUST ignore repeated identical scans within 500ms.

### Requirement: Unsaved Changes Warning

The system MUST show a browser `beforeunload` warning when the cart has items, preventing accidental navigation away from an active purchase.
