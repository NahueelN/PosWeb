---
name: cart-popup
description: "Trigger: carrito, cart popup, pedido, alta con productos, recibir pedido. Build PosWeb two-panel cart dialogs with the required keyboard and edit behaviors."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

# Cart Popup

## Activation Contract

Use when implementing or changing a PosWeb popup that selects products into a cart: orders, combos, purchases, receipts, quotes, or similar flows.

## Hard Rules

- Read `docs/knowledge/projects/posweb/PAT-cart-flow.md` before implementation.
- Use `Dialog` with `width="2xl"` and `fillHeight` for a desktop cart popup.
- Keep selection/catalog controls on the left and `CarritoPopup` on the right.
- Filter catalog rows already present in the cart; removing an item makes it available again.
- Do not expose purchase cost as "sale price". A receipt sale-price field must update `Producto.PRECIO`; purchase cost remains internal for `RenglonCompra` and expense calculation.
- Disable backdrop and Escape closing when accidental loss would discard an order draft.

## Decision Gates

| Situation | Required behavior |
|---|---|
| Existing catalog product | Click or Enter adds it with the suggested quantity. |
| Free-text product | First Enter warns inline; confirm button or second Enter adds it as a free item. |
| Product search arrows | Up/Down highlights and scrolls the catalog row; Enter adds that row. |
| Search Tab | Focus the last cart quantity when items exist; otherwise focus expected date. |
| Quantity Enter | Return focus to product search. |
| Date/notes Tab | Date -> notes -> Close -> confirm action. |
| Create mode | Show only Close and Create/Save. |
| Edit mode | Put Share, Receive, and destructive Cancel in the footer; keep Cancel at the far left. |

## Execution Steps

1. Reuse `CarritoPopup`, `ProveedorAltaCruzada`, `Button`, and `CompartirMenu` when applicable.
2. Keep cart item controls in the right panel: quantity, remove, clear, and summary.
3. For receiving, use the same `Dialog` visual language, footer actions, and product rows. Preset sale price from the current product price.
4. Keep receipt request fields semantically distinct: internal purchase cost and visible `PrecioVenta`.
5. Run `npm run build`; build affected .NET projects when contracts or services change.

## Output Contract

Report the affected popup behavior, keyboard flow, and verification. Propose PKS updates instead of modifying PKS knowledge items automatically.

## References

- `docs/knowledge/projects/posweb/PAT-cart-flow.md`
- `frontend/src/components/shared/CarritoPopup.tsx`
- `frontend/src/components/shared/ProveedorAltaCruzada.tsx`
- `frontend/src/pages/PedidosPage.tsx`
