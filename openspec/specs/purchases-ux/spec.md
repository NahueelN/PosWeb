# Purchases UX Specification

## Purpose

Define the frontend purchase flow for scanning and resolving products one by one before confirming the purchase.

## Requirements

### Requirement: Barcode Search

The system MUST allow the user to search for a product by scanning or typing a barcode or product name.

The system MUST call the backend to look up the product. If found, an editable form is shown with the product's current values. If not found, an inline creation form is shown pre-filled with the scanned barcode.

#### Scenario: Existing product shows edit form

- GIVEN a product exists with the scanned barcode
- WHEN the user scans or types the barcode and presses Enter
- THEN the product's current datos are displayed with editable precio, costo, and cantidad fields

#### Scenario: Unknown barcode shows creation form

- GIVEN no product matches the scanned barcode or typed name
- WHEN the user scans or enters the value and presses Enter
- THEN an inline creation form is shown pre-filled with the barcode
- AND the user can enter nombre, precio, costo, talle, and cantidad

### Requirement: Inline Product Updating

When an existing product is found, the user MUST be able to modify precio and costo for this purchase. These changes update both the product record and the purchase item on submit.

#### Scenario: Modifying price and cost

- GIVEN an existing product is resolved and shown in the edit form
- WHEN the user changes precio or costo and confirms
- THEN the item is added to the list with the modified values
- AND the backend updates the product's price and cost atomically on final submit

### Requirement: Unified Item List

The system MUST display all added items in a single list regardless of origin (newly created or existing product).

Each item row MUST show nombre, cantidad, precio, costo, and subtotal.

#### Scenario: Mixed items display together

- GIVEN items from both newly created and existing products
- WHEN viewing the item list
- THEN all items appear in the same list without visual distinction

### Requirement: Confirm Purchase

The system MUST require explicit confirmation before submitting. The submit button MUST be disabled until the user verifies the purchase.

#### Scenario: Verification checkbox enables submit

- GIVEN items are added to the list
- WHEN the user checks "Verificar compra" and clicks "Confirmar compra"
- THEN the POST request is sent to `/api/compras/crear`
- AND on success the list is cleared and a success message is shown

#### Scenario: Backend error shows feedback

- GIVEN the user confirms the purchase
- WHEN the backend returns an error (400, 409)
- THEN the error message is displayed
- AND the item list is preserved for retry

### Requirement: Keyboard Navigation

The system SHOULD support keyboard navigation through the flow.

#### Scenario: Enter triggers current action

- GIVEN focus is on the barcode input
- WHEN the user presses Enter
- THEN the system resolves the barcode or triggers search

#### Scenario: Escape cancels current action

- GIVEN an inline creation form or item edit is open
- WHEN the user presses Escape
- THEN the form is dismissed and focus returns to the barcode input
