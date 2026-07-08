# PAT-frontend-testing — Frontend Testing Setup Pattern

## Metadata

```yaml
ID: PAT-frontend-testing
Type: Pattern
Name: Frontend Testing Setup (vitest + testing-library)
Status: Draft
Priority: High
Level: Project
Sources:
  - frontend/package.json
  - frontend/vite.config.ts
  - frontend/src/test-setup.ts
  - frontend/src/test-utils.tsx
  - frontend/src/pages/__tests__/smoke.test.tsx
  - frontend/src/hooks/__tests__/useCart.test.ts
  - frontend/src/cart/__tests__/cart-logic.test.ts
  - frontend/src/components/hosts/__tests__/CartHost.test.tsx
Template: pattern-v1
Created: 2026-07-08
Updated: 2026-07-08
Tags:
  - POS
  - Ventas
  - Compras
```

---

## Overview

Stack de testing frontend basado en vitest + @testing-library/react + jsdom, con mocks reutilizables compartidos en `test-utils.tsx`. Cubre la validación de componentes React, hooks, lógica pura de carrito y smoke tests de páginas.

Este patrón existe para que cualquier test nuevo en el frontend siga la misma configuración, use los mismos mocks y no requiera reinventar infraestructura de testing.

---

## Stack

| Capa | Tecnología | Propósito |
|---|---|---|
| Test runner | vitest | Ejecución de tests, compatible con Vite |
| DOM environment | jsdom | Simula el DOM en Node.js |
| Component testing | @testing-library/react | Renderizado y queries |
| User interaction | @testing-library/user-event | Simulación de clicks/teclado |
| Matchers | @testing-library/jest-dom | `toBeInTheDocument()`, `toHaveClass()`, etc. |
| Test utilities | `test-utils.tsx` | Mocks compartidos (API, storage, notification, outlet context) |

---

## Cuándo usar

- Nuevos tests de componentes React
- Nuevos tests de hooks (useCart, useItemSnapshot, etc.)
- Nuevos tests de lógica pura (cart-logic, formatCurrency, etc.)
- Smoke tests de páginas

---

## Cuándo NO usar

- Tests e2e que requieren un navegador real → esos van con Playwright o Cypress, no con vitest + jsdom.
- Tests de integración con Tauri APIs nativas → jsdom no tiene acceso a las APIs de Tauri.

---

## Dónde se implementa actualmente

- `frontend/src/cart/__tests__/cart-logic.test.ts` — lógica pura del carrito (addItem, removeItem, updateQuantity, calcTotal)
- `frontend/src/hooks/__tests__/useCart.test.ts` — hook useCart con storage mockeado
- `frontend/src/components/hosts/__tests__/CartHost.test.tsx` — renderizado de CartHost con items
- `frontend/src/pages/__tests__/smoke.test.tsx` — smoke tests de páginas principales

---

## Cómo implementarlo

1. **package.json** — Asegurar que estén instalados: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`.

2. **vite.config.ts** — Agregar bloque `test` con `environment: 'jsdom'`, `globals: true`, `setupFiles: ['./src/test-setup.ts']`.

3. **test-setup.ts** — Importar `@testing-library/jest-dom` para extender matchers.

4. **test-utils.tsx** — Exportar factories de mocks:
   - `createMockApi()` — mock tipado del cliente API (productos, ventas, compras, cajas, etc.)
   - `createMockStorage()` — mock de Storage API (getItem, setItem, removeItem, clear, key, length)
   - `mockUseNotification()` — mock con `notifyError`, `notifySuccess`, `notifyInfo`, `dismiss`
   - `mockProducto()` / `mockSucursal()` — factories de datos de prueba

5. **Estructura de tests** — Colocar archivos `*.test.ts(x)` en `__tests__/` junto al código que testean.

---

## Errores comunes

- **No importar `@testing-library/jest-dom` en test-setup.ts** → matchers como `toBeInTheDocument()` no existen y los tests fallan con errores confusos.
- **No configurar `jsdom` como environment** → vitest usa `node` por defecto y `document` / `window` no existen.
- **Usar `fireEvent` en lugar de `userEvent`** → `userEvent` simula interacciones reales de usuario (focus, blur, secuencia de teclas). Siempre preferir `@testing-library/user-event`.

---

## Relaciones

```yaml
RELATIONS:
  - type: USES
    target: SERVICE-api-client
  - type: RELATED
    target: PAT-cart-flow
```

---

## Historial

| Fecha | Cambio |
|---|---|
| 2026-07-08 | Pattern created — vitest + testing-library stack installed and configured |

(End of file - total 97 lines)
