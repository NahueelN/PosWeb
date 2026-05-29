# Proposal: Global Keyboard Shortcuts (F-keys)

## Intent

Add F-key shortcuts for the main POS screens so the entire app is navigable without a mouse.

## Scope

**In scope:**
- F1 → Ventas (home screen)
- F2 → Caja
- F3 → Stock
- F4 → Productos
- F5 → Clientes
- F11 → Fullscreen toggle (Tauri)

**Out of scope:**
- Page-specific shortcuts (F6 search, F7 confirm, etc.) — defer
- Ctrl/Cmd combinations
- Customizable shortcuts

## Approach

Single `useEffect` in `Layout.tsx` that adds a `keydown` listener. Uses `useNavigate()` to change routes. Prevents default browser behavior for F-keys.
