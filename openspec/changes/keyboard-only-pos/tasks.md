# Tasks: Keyboard-Only POS Operation

Decision needed before apply: No
Chained PRs recommended: No
400-line budget risk: Low

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~100-150 (modifications to VentasPage.tsx only) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | single-pr |

## Phase 1: Payment Grid Keyboard Navigation

- [ ] 1.1 Add `medioHighlightIdx` state and `medioRefs` array ref
- [ ] 1.2 Add `GRID_COLS` constant (matches CSS `grid-cols-3` for desktop, `grid-cols-2` for mobile)
- [ ] 1.3 Implement `handleMedioGridKeyDown` with ArrowLeft/Right/Up/Down and Enter/Space
- [ ] 1.4 Wire handler to medio buttons, skip `yaUsado` entries in arrow navigation

## Phase 2: Auto-focus Management

- [ ] 2.1 Add `useEffect` that auto-focuses `pagoMontoRef.current` when `selectedMedio` changes
- [ ] 2.2 In `agregarPago()`, after adding: if `restante > 0` focus first available medio button; if `restante <= 0` focus confirm button
- [ ] 2.3 In `agregarPago()`, after adding: if payment complete, also enable the confirm button's Tab reachability

## Phase 3: Escape Key Handling

- [ ] 3.1 Add `handleEscape()` logic: close suggestions → clear payment selection → noop (in that priority)
- [ ] 3.2 Add `onKeyDown` on the venta outer container (or document-level listener) for Escape
- [ ] 3.3 When Escape clears payment selection, focus returns to search input

## Phase 4: Focus Indicators

- [ ] 4.1 Add focus ring classes to payment method buttons (`focus:ring-2 focus:ring-indigo-500/30`)
- [ ] 4.2 Add focus ring classes to "Agregar pago" button
- [ ] 4.3 Add focus ring classes to confirm button
- [ ] 4.4 Add focus ring classes to item remove (X) buttons
- [ ] 4.5 Add focus ring classes to quantity +/- buttons
- [ ] 4.6 Add `onKeyDown={e => e.key === 'Enter' && nuevaVenta()}` to "Nueva venta" button

## Phase 5: Tab Order Verification

- [ ] 5.1 Verify Tab flows from search → items → payments → confirm naturally (no explicit tabIndex needed)
- [ ] 5.2 Verify Shift+Tab reverses correctly
- [ ] 5.3 Verify disabled/hidden elements are skipped

## Phase 6: Verification

- [ ] 6.1 Run `npx tsc -b` — verify no TypeScript errors
- [ ] 6.2 Run `npx vite build` — verify production build
- [ ] 6.3 Manual test: complete a sale using ONLY keyboard — no mouse
