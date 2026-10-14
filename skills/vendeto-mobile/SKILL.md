---
name: vendeto-mobile
description: "Trigger: Vendeto mobile, ConsultaProducto, product ABM, mobile sales. Build the mobile client bundled with the PosWeb installer."
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

# Vendeto Mobile

## Activation Contract

Use this skill for the mobile client bundled with Vendeto: its Python HTTP sidecar, its Tauri lifecycle, and the mobile Products and Sales interfaces.

## Hard Rules

- PosWeb is the functional source of truth. Reuse its API contracts, business rules, validation, and errors. Do not change the .NET backend for this client.
- Keep all source in this repository and bundle it in the existing Vendeto Tauri installer. Tauri must supervise both `posweb-backend` and the packaged Python mobile sidecar.
- Authenticate exactly as PosWeb: user/email, password, and branch. Do not expose registration.
- Use Vendeto assets from `C:\Dev\PosWeb2\Logos`, cropped to their real content. The color wordmark is invisible on dark backgrounds; use the white variant. Never use product images.
- The mobile drawer mirrors PosWeb and contains only Productos, Ventas, and logout, each with an icon. Products is the post-login route. Do not show user or branch details. The branch is resolved internally, not chosen by the user.
- Use Material Symbols Outlined for icons, self-hosted as a subset in `static/assets`. Never link Google Fonts: the app must work on the local network without Internet. The subset has no GSUB/liga dependency: use `<span class="msi i-name"></span>` with a verified PUA CSS rule, never text ligatures or emojis. An inline SVG is acceptable when a font glyph is visually ambiguous at mobile size (the destructive trash icon). Label icon-only buttons with `aria-label`.
- Keep the UI system dependency-free: reuse the CSS variants `primary`, `secondary`, `danger`, `ghost`, and `icon`, plus the shared field, dialog, focus, and touch-target styles. Do not add a UI library solely for cosmetic consistency.
- Treat screen density as a hard requirement, not a preference. The default mobile shell is `padding:12px 14px 24px`; the sticky search is `padding:7px 14px 8px`; list cards are `margin:6px 0` and `padding:11px 12px`. Sales results use two rows (name+price, then brand/code) with `min-height:64px`; cart rows use two rows (name+subtotal, then metadata/actions) with `padding:9px 11px`. Stock is shown **only on cart rows** (`precio c/u · Stock: N`, amber via `.stock-warning` when the quantity exceeds it, never with a `Supera stock` label); product catalog cards and Ventas product cards must not display stock. When something "takes too much space", tighten padding, margin, radius, and font size. Keep search, navigation, primary buttons, and checkout confirmation at 44px or more; clustered quantity and remove controls may use 34–38px when labeled with `aria-label`.
- Fixed bottom chrome must stay accounted for. `.sale-summary` is anchored at `bottom:calc(60px + env(safe-area-inset-bottom))` above `.sale-tabs`, `#cartToast` sits at `calc(66px + env(safe-area-inset-bottom))`, and checkout uses `.checkout-footer` fixed to `bottom:0` because tabs are hidden there. Scroll reserves must match: `#saleCartPanel { padding-bottom:176px }`, `#ventas { padding-bottom:72px }`, and `#saleCheckoutPanel { padding-bottom:calc(78px + env(safe-area-inset-bottom)) }`. Any footer-height change requires updating its reservation in the same edit, or the last control/error renders underneath the footer.
- Never define the same selector twice in the stylesheet. A later duplicate silently overrides the earlier rule; that is how `.btns` previously reverted the editor footer margin after a compaction pass.
- Keep `[hidden] { display:none !important }` at the top of the stylesheet. An author rule with `display` beats the UA `[hidden]` rule, so `element.hidden = true` silently does nothing for `.sale-tabs`, `.cash-shortcuts`, and `.sale-summary`.
- Never rewrite `static/index.html` with PowerShell `Get-Content`/`Set-Content`; it misreads UTF-8 as ANSI and corrupts accents and glyphs. Use the edit tools or `[System.IO.File]` with a UTF-8 encoder.
- Serve HTTPS with a self-signed certificate so the phone camera works. The mobile proxy forwards only allowlisted API prefixes (`sucursales`, `auth/login`, `productos`, `categorias`, `unidades-medida`, `medios-pago`, `cajas`, `ventas`, `stock`, `clientes`) and rejects everything else with `404`; authenticated routes require a valid JWT.
- The scanner needs two matching reads and a cooldown. Prefer native `BarcodeDetector`; fall back to the bundled ZXing.

## Products Behavior

- Scope: list/search, create, edit, and logical deactivation. Exclude imports, bulk changes, and configuration.
- Load 20 results first and progressively load more while scrolling. Search by name, barcode, and internal code.
- Paste triggers lookup. Enter with a valid EAN triggers lookup. The scanner button opens the phone camera.
- Existing EAN opens the editor immediately. Unknown codes follow PosWeb catalog lookup; prefill when data exists, otherwise create with the scanned code.
- Reuse one editor for create and edit. Require backend-only fields: name, price above zero, and barcode or custom internal code. Cost starts at zero; remaining product attributes are optional.
- Mirror the PosWeb product editor layout: one card, Nombre first, then EAN and Código interno, two-column rows for precio/costo, marca/contenido and categoría/unidad, then Seguir stock and Seguir vencimientos with their inline controls, a collapsible advanced section, and Cancelar/Borrar/Guardar in the fixed footer. Do not place a Cerrar action in the editor header; its title is informational only.
- Seguir stock reveals a branch-stock field; adjusting it uses `PUT /api/stock/ajustar`, which requires an Admin role. Seguir vencimientos reveals up to 3 editable dates that travel with the product upsert.
- Confirm before logical deactivation; deactivated products remain recoverable through PosWeb behavior.
- The EAN scanner button is hidden while editing an existing product; it stays available on creation. Rely on `[hidden]` with `!important`, because the `.icon` rule would otherwise keep it visible.

## Sales Behavior

- Load products with `sucursalId` so stock belongs to the branch. Searching or scanning adds to the cart; it never opens the editor.
- Use a fixed internal bottom navigation with only Productos and Carrito. Do not add Clientes unless the user explicitly expands scope.
- Productos shows the initial catalog, search, and scanner; Carrito owns quantity changes, item removal, clear cart, and the total summary. Checkout is a separate reversible view for payment method, amount, payment summary, and confirmation. Keep payment controls structurally stable: choosing a method changes labels, enabled state, and summary, but must not make the amount panel, quick amounts, or summary appear/disappear. Leaving and returning to Ventas must resume the in-memory draft (cart, active sales tab, selected method, and open checkout); reset `montoRecibido` to the current total through `presetCheckoutAmount()` on every checkout entry/resume so a prior quick amount is never carried forward. Only first entry and post-sale confirmation call a real `loadSales()` refresh.
- Adding a product must give visible feedback: show the `#cartToast` notice with the product name and resulting quantity, including EAN/code additions. On scanner success, close the camera, call `consumeLayer()` to balance its history entry, and delay the toast about 180ms so it renders after the native camera overlay disappears. PosWeb has no equivalent toast; on mobile the cart badge alone is too easy to miss. It belongs only to the Productos sales tab: `setSaleTab('cart')` must close it before showing Carrito. The toast lives inside `<section id="ventas">` so switching views hides it, and `pushLayer()` closes it whenever an overlay opens so it never floats above the scrim.
- Confirmations are centered `.confirm-dialog` popups over the current screen, never full-screen `.sheet` views. Apply this to `#clearCartConfirm`, `#stockConfirm`, and `#debtConfirm`; preserve their `pushLayer`/Back/`consumeLayer` behavior. Cart keeps editable quantities, per-line subtotal and total. `Vaciar carrito` is destructive: the popup shows the number of items that will be removed and requires explicit `Vaciar carrito`; Cancelar or Back must preserve the cart and balance the history layer.
- Respect PosWeb sales rules: the cash register must be open, a payment method is required, and one method is used per sale.
- Payment methods use a compact three-column grid (`min-height:48px`, 11px labels), not tall cards. The payment-details panel stays visible: before a method is selected, its amount controls are disabled and the summary shows the total pending; after selection, controls enable. The amount field has two external buttons: `#totalAmountRecibido` (`Total`, primary blue) that fills the field with `moneyInput(total())`, and `#clearMontoRecibido` (`Limpiar`, outline: its own border, transparent background) that clears the amount. Both disable when no method is selected. For touch, clear during `pointerdown` before the button can take focus; never focus the amount input (no keyboard takeover). Handle `click` too for keyboard and assistive technology. The `#montoRecibidoLabel` label and the `#efectivoAyuda` helper below the field must share identical typography: 12px, `#c7d3e6`, weight 400. The quick controls are additions, not presets: `+$100`, `+$500`, `+$1.000`, `+$2.000`, `+$10.000`, `+$20.000` add to the parsed current amount. Compute one signed payment difference (`received - total`): if it is below `-0.005`, show an amber `Falta` summary with the absolute shortfall for every method; otherwise a cash method shows `Vuelto`, and a non-cash method shows `Pago completo`. Never clamp a negative difference to `$0,00`. Quick increments remain available for every selected method because the partial-payment flow is supported with a client.
- The interface displays ARS using `es-AR`; cash input must accept the same local notation. Reuse `parseMoney()` and `roundMoney()` for cash validation and change: accept `2200`, `2.200`, `2200,00`, and `2.200,00`; never use raw `Number(input.value)` for user-entered money.
- Confirm with `POST /api/ventas` and show the returned result as a ticket. Surface backend errors, such as insufficient stock, unchanged.
- Replicate the PosWeb confirmation order exactly, not only its payload: re-check the register with `GET /api/cajas/activa` right before confirming; block on insufficient stock with a `#stockConfirm` popup that requires `Cancelar` or `Vender igual`; require a payment method; parse the amount with `parseMoney()`; and, when payment is below the total, open a `#debtConfirm` popup **only after Confirmar venta is pressed**. Never reveal the debt warning while the user types. The popup must show the pending amount, require a client, and require an explicit `Registrar deuda` action before sending `clienteId`.
- Send `{ sucursalId, items, pagos:[{ medioPagoId, monto: min(recibido, total), conCambio }], clienteId?, allowSinStock }`. Set `conCambio` only when the method pays change and `recibido > total`, sending the full banknote, exactly as PosWeb's `ejecutarVenta` does.
- `allowSinStock` is a one-shot permission: reset it when the checkout opens and whenever the cart changes (`renderVenta`), so every cart change demands an explicit confirmation again.
- Cache the client list behind a state machine (`idle | loading | done | error`) instead of fetching on every keystroke, and retry on selector focus when the last attempt failed. Treat `pendingDebtApproval` like `pendingAllowSinStock`: it is an explicit, one-shot permission and must reset when the cart, payment method, or payment amount changes, and in the request `finally`.
- Clients come from `/api/clientes`, which requires an Admin or SuperAdmin role. A `403` must surface as a readable message in the client selector, never as a silent empty list.

## Decision Gates

| Situation | Required behavior |
| --- | --- |
| PosWeb behavior is unclear | Read its PKS and source before implementing. |
| Mobile UX differs | Preserve the business result and document the UX adaptation. |
| Feature is outside normal ABM | Ask before adding it. |
| Sales begins | Reuse login, branch, search, scanner, and mobile API infrastructure. |
| Any work unit finishes | Update `mobile-client/cerebro_tecnico_mobile.md` and this skill when the change alters architecture, behavior, or gotchas. |

## Output Contract

Report the reused PosWeb rule, the mobile adaptation, touched files, verification evidence, and whether the technical brain or this skill were updated.
