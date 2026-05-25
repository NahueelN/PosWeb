# Spec: Two-Column POS Layout

## REQ-01: Two-Column Layout on Desktop

On screens wider than 1024px, the sales screen MUST show two side-by-side panels: product browser (left) and cart (right).

- **Scenario 1.1**: Screen ≥ 1024px → flex-row with left panel (50-60% width) and right panel (40-50% width)
- **Scenario 1.2**: Screen < 1024px → single column, product browser above cart

## REQ-02: Product Grid

The left panel MUST show all active products in a responsive grid of cards.

- **Scenario 2.1**: Products load from `GET /api/productos` on mount
- **Scenario 2.2**: Each card shows: product name, price, stock badge
- **Scenario 2.3**: Clicking a card adds 1 unit of that product to the cart
- **Scenario 2.4**: Grid uses 2-4 columns based on available width

## REQ-03: Search Filters Grid

The search bar MUST filter the product grid in real-time as the user types.

- **Scenario 3.1**: Typing filters products by name or barcode (client-side filter)
- **Scenario 3.2**: Empty search shows all products
- **Scenario 3.3**: No results shows "Sin resultados" message

## REQ-04: Cart Panel (Always Visible)

The right panel MUST show the current sale cart and payment section, always visible without scrolling.

- **Scenario 4.1**: Empty cart shows "Agregá productos para armar la venta"
- **Scenario 4.2**: Cart with items shows: product name, price, quantity, subtotal, +/- buttons, remove
- **Scenario 4.3**: Total is prominently displayed at the bottom of the cart
- **Scenario 4.4**: Payment method selector is below the cart items, above the confirm button

## REQ-05: Quick Quantity

The cart MUST allow quick quantity changes.

- **Scenario 5.1**: Clicking + increments quantity by 1
- **Scenario 5.2**: Clicking - decrements quantity by 1 (removes item if quantity reaches 0)
- **Scenario 5.3**: Clicking the remove (X) button removes the item entirely
- **Scenario 5.4**: User can type a number directly in the quantity input

## REQ-06: Confirm Sale (Unchanged flow)

The confirm flow MUST work the same as the current implementation.

- **Scenario 6.1**: Select a payment method, confirm button enables
- **Scenario 6.2**: Confirm calls `POST /api/ventas` with the sale data
- **Scenario 6.3**: On success, show result screen with sale summary

## REQ-07: Responsive

On mobile/small screens, the layout MUST stack vertically.

- **Scenario 7.1**: Screen < 1024px → product browser above cart in single column
- **Scenario 7.2**: Cart panel has a sticky bottom bar with total and confirm
