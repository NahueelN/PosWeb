# Design: Keyboard-Only POS Operation

## Technical Approach

All changes in `frontend/src/pages/VentasPage.tsx`. No backend changes. No new components — all within the existing single-file component.

## Key Mechanisms

### 1. Payment Grid Arrow Navigation

Use a `medioHighlightIdx` state (separate from `highlightIdx` for suggestions) to track which medio button is focused via keyboard.

```typescript
const [medioHighlightIdx, setMedioHighlightIdx] = useState(-1)
const GRID_COLS = 3  // grid-cols-3 on desktop

const medioRefs = useRef<(HTMLButtonElement | null)[]>([])

function handleMedioGridKeyDown(e: React.KeyboardEvent, currentIdx: number) {
  let nextIdx = currentIdx
  switch (e.key) {
    case 'ArrowRight': nextIdx = Math.min(currentIdx + 1, mediosPago.length - 1); break
    case 'ArrowLeft':  nextIdx = Math.max(currentIdx - 1, 0); break
    case 'ArrowDown':  nextIdx = Math.min(currentIdx + GRID_COLS, mediosPago.length - 1); break
    case 'ArrowUp':    nextIdx = Math.max(currentIdx - GRID_COLS, 0); break
    case 'Enter':
    case ' ':
      e.preventDefault()
      selectMedio(mediosPago[currentIdx])
      return
    default: return
  }
  // Skip disabled medios (yaUsado)
  while (nextIdx !== currentIdx && mediosPago[nextIdx] && yaUsado(nextIdx)) {
    nextIdx += (nextIdx > currentIdx ? 1 : -1)
  }
  setMedioHighlightIdx(nextIdx)
  medioRefs.current[nextIdx]?.focus()
}
```

When `selectedMedio` is set and monto input appears, standard Tab takes the user to the monto input.

### 2. Auto-focus Monto Input

```typescript
useEffect(() => {
  if (selectedMedio) {
    setTimeout(() => pagoMontoRef.current?.focus(), 50)
  }
}, [selectedMedio])
```

Already partially implemented (the current code has this in `selectMedio` via `setTimeout`). Formalize in a dedicated `useEffect`.

### 3. Focus After Add Payment

```typescript
function agregarPago() {
  // ... existing logic ...
  if (restanteAfter > 0) {
    // Focus first available medio
    const firstAvailable = paymentEntriesAfter.length > 0
      ? paymentEntriesAfter.length  // next medio after used ones
      : 0
    medioRefs.current[firstAvailable]?.focus()
  } else {
    // Focus confirm button
    confirmBtnRef.current?.focus()
  }
}
```

### 4. Escape Handler

```typescript
function handleGlobalKeyDown(e: React.KeyboardEvent) {
  if (e.key === 'Escape') {
    if (mostrarSugerencias) {
      setMostrarSugerencias(false)
      searchInputRef.current?.focus()
    } else if (selectedMedio) {
      setSelectedMedio(null)
      setMedioHighlightIdx(-1)
      searchInputRef.current?.focus()
    }
  }
}
```

Attach to the outermost `<div>` of the venta step.

### 5. Tab Order

Natural DOM order + explicit `tabIndex` where needed:

```
search input (tabIndex={0})
  → items table rows (tabIndex={1} per row)
    → quantity input (tabIndex={1} inside row)
    → remove button (tabIndex={1} inside row)
  → payment method grid (tabIndex={2})
    → monto input (tabIndex={3}, visible when selectedMedio)
    → "Recibió" input (tabIndex={4}, visible when pagaVuelto)
    → "Agregar" button (tabIndex={5})
  → remaining balance warning (non-interactive)
  → confirm button (tabIndex={6})
```

Actually, using explicit tabIndex is fragile. Better to use semantic HTML form structure and let the browser handle natural Tab order. The form already wraps the payment section. Use proper `<form>` nesting.

### 6. Focus Indicators

Add Tailwind focus ring classes to all interactive elements that lack them:

| Element | Current | Should Add |
|---------|---------|------------|
| Medio buttons | `hover:*` only | `focus:ring-2 focus:ring-indigo-500/30` |
| Monto input | Already has `focus:ring-2` | ✅ Already done |
| "Agregar" button | None | `focus:ring-2 focus:ring-indigo-500/30` |
| Confirm button | None | `focus:ring-2 focus:ring-indigo-500` |
| Remove item X | None | `focus:ring-2 focus:ring-red-500/30` |
| Quantity +/- buttons | None | `focus:ring-2 focus:ring-gray-400/30` |
| "Nueva venta" result button | None | `focus:ring-2 focus:ring-indigo-500` |

### 7. Confirm on Enter

The form wrapper already has `onSubmit={handleConfirmar}`. The disabled attribute on the button prevents submission when not ready. This should work with Tab + Enter out of the box — verify and fix if the button is not reachable via Tab.

### 8. Nueva Venta with Enter

Add `onKeyDown` handler to the "Nueva venta" button:

```tsx
<button onClick={nuevaVenta} onKeyDown={(e) => { if (e.key === 'Enter') nuevaVenta() }} ...>
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/pages/VentasPage.tsx` | Modify | Add arrow key nav for payment grid, Escape handler, focus management, focus indicators |

## Testing Strategy

- `npx tsc -b` — TypeScript compilation
- `npx vite build` — production build
- Manual: walk through full sale flow using ONLY keyboard (Tab, Enter, Arrow keys, Escape) — no mouse touches
