# Exploration: Global Keyboard Shortcuts

## Problem

Even with keyboard-only navigation within VentasPage (arrows, tab, escape), the user still needs the mouse (or touch) to switch between sections: Ventas, Caja, Stock, Productos, Clientes. In a POS desktop app, every mouse interaction is friction.

## Solution

Global F-key shortcuts that navigate between routes. Since this is a Tauri desktop app, F-keys aren't captured by the browser — we have full control.

## Existing Navigation

The Layout component has a sidebar with NavLinks to:
- `/ventas` → VentasPage
- `/caja` → CajaPage
- `/stock` → StockPage
- `/productos` → ProductosPage
- `/clientes` → ClientesPage
- `/historial` → HistorialVentasPage
- `/sucursales` → SucursalesPage

## Approach

Add a `keydown` listener on `window` in the Layout component. Map F1-F5 to the main POS sections. F11 for fullscreen.
