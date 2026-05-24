# Proposal: Keyboard-Only POS Operation

## Intent

Make the entire sales flow operable with keyboard alone — no mouse required. Cashiers should go from "first search" to "sale confirmed" using only Tab, Enter, Arrow keys, and Escape.

## Scope

**In scope:**
- Tab order that flows naturally: search → items → payments → confirm
- Arrow key navigation of payment method grid (left/right/up/down)
- Auto-focus monto input when a payment method is selected
- Enter to add a payment (already works on the input, formalize it)
- Escape to close suggestions dropdown or cancel payment selection
- Enter to confirm sale (form onSubmit already exists — make it always reachable)
- Visible focus indicators (ring styles) on ALL interactive elements
- Focus trap / management: after adding a payment, focus returns to the medio grid or next logical element
- After sale result, Enter/Space triggers "Nueva venta"

**Out of scope:**
- Global keyboard shortcuts (Ctrl+N for new sale, etc.) — defer to a future change
- Touch/gesture improvements
- Other pages (only VentasPage)
- Mouse support removal — keep it working for fallback

## Approach

All changes are in `frontend/src/pages/VentasPage.tsx`. Add:

1. **Payment grid keyboard nav**: ArrowLeft/Right/Up/Down to move between `mediosPago` buttons, Enter/Space to select
2. **Auto-focus monto**: when `selectedMedio` changes, auto-focus `pagoMontoRef.current` using a `useEffect`
3. **Escape handling**: close suggestions (`setMostrarSugerencias(false)`), or clear `selectedMedio` if payment section is active
4. **Focus after add**: after `agregarPago()`, if `restante > 0` focus the first available medio button; if `restante <= 0` focus the confirm button
5. **Tab order**: ensure `tabIndex` flows search → items → payments → confirm. Use semantic form structure.
6. **Focus indicators**: add `focus:ring-2 focus:ring-indigo-500/50` to all buttons and inputs that lack it
7. **Confirm with Enter**: the form already has `onSubmit={handleConfirmar}` — ensure the confirm button is reachable via Tab and activates on Enter/Space
8. **Nueva venta with Enter**: make the result screen's "Nueva venta" button respond to Enter key
9. **Close suggestions with Escape**: add `onKeyDown` handler on search input
10. **Item row keyboard ops**: Tab into quantity input, or remove with Delete key when row is "focused"

## Risks

- Low — single file, no API/backend changes
- Tab order changes might feel different for existing mouse users — mitigated by keeping mouse fully functional
- Focus management after adding a payment requires careful ref handling — need to create refs for medio buttons
