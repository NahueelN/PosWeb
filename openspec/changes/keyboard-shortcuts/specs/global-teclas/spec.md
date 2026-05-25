# Spec: Global F-key Navigation

## REQ-01: F1 → Ventas

Pressing F1 from any screen MUST navigate to `/ventas`.

- **Scenario 1.1**: User is on Caja page, presses F1 → navigates to Ventas page
- **Scenario 1.2**: User is already on Ventas page, presses F1 → stays on Ventas (noop)

## REQ-02: F2 → Caja

Pressing F2 from any screen MUST navigate to `/caja`.

## REQ-03: F3 → Stock

Pressing F3 from any screen MUST navigate to `/stock`.

## REQ-04: F4 → Productos

Pressing F4 from any screen MUST navigate to `/productos`.

## REQ-05: F5 → Clientes

Pressing F5 from any screen MUST navigate to `/clientes`.

## REQ-06: F11 → Fullscreen

Pressing F11 MUST toggle fullscreen mode via the Fullscreen API.

- **Scenario 6.1**: Not fullscreen → F11 enters fullscreen
- **Scenario 6.2**: Fullscreen → F11 exits fullscreen

## REQ-07: No Browser Defaults

All F-key events MUST call `e.preventDefault()` to prevent the browser from intercepting them (e.g., F5 refresh, F11 fullscreen default).

## REQ-08: Ignored When Typing

F-key shortcuts MUST NOT fire when the user is typing in an input, textarea, or contenteditable element. Check `document.activeElement?.tagName` before acting.
