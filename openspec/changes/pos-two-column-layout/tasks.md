# Tasks: Two-Column POS Layout

Decision needed before apply: No
Chained PRs recommended: No
400-line budget risk: High (estimated ~300-400 lines)

## Phase 1: Product Grid — Load and Display

- [x] 1.1 Add `productos` and `productosLoading` state, fetch on mount from `api.productos.listar()`
- [x] 1.2 Add `searchQuery` state, client-side filter by name or barcode
- [x] 1.3 Build product card component: name, price, stock badge, click handler
- [x] 1.4 Build product grid: responsive columns, scrollable list

## Phase 2: Two-Column Layout

- [x] 2.1 Wrap venta step in flex container: left panel (product browser) + right panel (cart)
- [x] 2.2 Left panel: search + product grid, scrollable
- [x] 2.3 Right panel: cart items + payment + total, sticky on desktop
- [x] 2.4 Responsive: stack on screens < 1024px

## Phase 3: Cart Panel Refinements

- [x] 3.1 Cart empty state: "Agregá productos para armar la venta"
- [x] 3.2 Cart items: name, price, qty, subtotal, +/- buttons, remove
- [x] 3.3 Total always visible at bottom of cart
- [x] 3.4 Quick quantity via input or +/- buttons

## Phase 4: Keyboard & Payment Integration

- [x] 4.1 Keep existing keyboard nav (ArrowLeft/Right on medios, Escape, autofocus)
- [x] 4.2 Keep existing payment flow (select medio + confirm)
- [x] 4.3 Keep existing result screen
- [x] 4.4 Remove old single-column layout code

## Phase 5: Verification

- [x] 5.1 Run `npx tsc -b` — verify TypeScript
- [x] 5.2 Run `npx vite build` — verify production build
- [ ] 5.3 Manual: load products, add to cart, change quantities, confirm sale
