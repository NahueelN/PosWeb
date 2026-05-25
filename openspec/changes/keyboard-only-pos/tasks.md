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

- [x] 1.1 Add `medioRefs` array ref for payment method buttons
- [x] 1.2 Add `onKeyDown` handler on each medio button: ArrowLeft/Right moves between buttons, Enter/Space selects

## Phase 2: Auto-focus Management

- [x] 2.1 Add `recibioInputRef` for the "Recibió" input
- [x] 2.2 Auto-focus "Recibió" input when `selectedMedio` changes and `pagaVuelto` is true (useEffect + setTimeout)

## Phase 3: Escape Key Handling

- [x] 3.1 Add Escape handler on the venta section div: close suggestions OR clear selectedMedio (in that priority)
- [x] 3.2 When Escape clears selection, return focus to search input

## Phase 4: Focus Indicators

- [x] 4.1 Add `focus:ring-2 focus:ring-indigo-500/30` to payment method buttons
- [x] 4.2 Add `focus:ring-2 focus:ring-indigo-500` to confirm button
- [x] 4.3 Add focus ring classes to item remove (X) buttons
- [x] 4.4 Add focus ring classes to quantity +/- buttons
- [x] 4.5 Add `onKeyDown={e => e.key === 'Enter' && nuevaVenta()}` to "Nueva venta" button

## Phase 5: Tab Order Verification

- [x] 5.1 Verify Tab flows from search → items → payments → confirm naturally
- [x] 5.2 Verify Shift+Tab reverses correctly
- [x] 5.3 Verify confirm button is reachable via Tab when enabled

## Phase 6: Verification

- [x] 6.1 Run `npx tsc -b` — verify no TypeScript errors
- [x] 6.2 Run `npx vite build` — verify production build
- [x] 6.3 Manual test: complete a sale using ONLY keyboard — no mouse
