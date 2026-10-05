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
- Never rewrite `static/index.html` with PowerShell `Get-Content`/`Set-Content`; it misreads UTF-8 as ANSI and corrupts accents and glyphs. Use the edit tools or `[System.IO.File]` with a UTF-8 encoder.
- Serve HTTPS with a self-signed certificate so the phone camera works. The mobile proxy must allow only `sucursales`, `auth/login`, and `productos`; authenticated product routes require a valid JWT.
- The scanner needs two matching reads and a cooldown. Prefer native `BarcodeDetector`; fall back to the bundled ZXing.

## Products Behavior

- Scope: list/search, create, edit, and logical deactivation. Exclude imports, bulk changes, and configuration.
- Load 20 results first and progressively load more while scrolling. Search by name, barcode, and internal code.
- Paste triggers lookup. Enter with a valid EAN triggers lookup. The scanner button opens the phone camera.
- Existing EAN opens the editor immediately. Unknown codes follow PosWeb catalog lookup; prefill when data exists, otherwise create with the scanned code.
- Reuse one editor for create and edit. Require backend-only fields: name, price above zero, and barcode or custom internal code. Cost starts at zero; remaining product attributes are optional.
- Mirror the PosWeb product editor layout: one card, Nombre first, then EAN and Código interno, two-column rows for precio/costo, marca/contenido and categoría/unidad, then Seguir stock and Seguir vencimientos with their inline controls, a collapsible advanced section, and Guardar/Desactivar side by side at the end.
- Seguir stock reveals a branch-stock field; adjusting it uses `PUT /api/stock/ajustar`, which requires an Admin role. Seguir vencimientos reveals up to 3 editable dates that travel with the product upsert.
- Confirm before logical deactivation; deactivated products remain recoverable through PosWeb behavior.

## Sales Behavior

- Load products with `sucursalId` so stock belongs to the branch. Searching or scanning adds to the cart; it never opens the editor.
- Cart keeps editable quantities, per-line subtotal and total.
- Respect PosWeb sales rules: the cash register must be open, a payment method is required, and one method is used per sale.
- When the method pays change, ask for the received amount and compute the change; otherwise charge the total.
- Confirm with `POST /api/ventas` and show the returned result as a ticket. Surface backend errors, such as insufficient stock, unchanged.

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
