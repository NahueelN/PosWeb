# Design: Global Keyboard Shortcuts

## Technical Approach

Single `useEffect` in `Layout.tsx`. A `Map<number, () => void>` maps key codes to actions. The effect adds a `keydown` listener on mount and removes it on unmount.

## Implementation

```typescript
const KEY_ACTIONS = new Map([
  ['F1', () => navigate('/ventas')],
  ['F2', () => navigate('/caja')],
  ['F3', () => navigate('/stock')],
  ['F4', () => navigate('/productos')],
  ['F5', () => navigate('/clientes')],
  ['F11', () => toggleFullscreen()],
])

function isTyping(element: Element | null): boolean {
  if (!element) return false
  const tag = element.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || (element as HTMLElement).isContentEditable
}

useEffect(() => {
  function handleKeyDown(e: KeyboardEvent) {
    if (isTyping(document.activeElement)) return
    const action = KEY_ACTIONS.get(e.code)
    if (action) {
      e.preventDefault()
      action()
    }
  }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [navigate])
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/components/Layout.tsx` | Modify | Add `useEffect` with global keyboard shortcuts |

## Testing Strategy

- Run `npx tsc -b` to verify TypeScript
- Manual: press each F-key and verify navigation
