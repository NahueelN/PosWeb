# Tasks: Global Keyboard Shortcuts

Decision needed before apply: No
Chained PRs recommended: No
400-line budget risk: Low

## Phase 1: Global F-key Navigation

- [x] 1.1 Add `KEY_ACTIONS` map in Layout.tsx: F1→/ventas, F2→/caja, F3→/stock, F4→/productos, F5→/clientes
- [x] 1.2 Add `isTyping()` guard to skip when focus is on input/textarea
- [x] 1.3 Add `useEffect` with `keydown` listener, `e.preventDefault()`, cleanup on unmount
- [x] 1.4 Add F11 fullscreen toggle

## Phase 2: Verification

- [x] 2.1 Run `npx tsc -b` — verify no TypeScript errors
- [x] 2.2 Run `npx vite build` — verify production build
