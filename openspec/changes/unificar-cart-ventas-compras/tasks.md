# Tasks: Unificar Carrito — Ventas y Compras

## Review Workload Forecast

| Métrica | Estimado |
|---------|----------|
| Archivos nuevos | 7 (~600 líneas) |
| Archivos modificados | 4 (~900 líneas cambiadas) |
| Archivos eliminados | 0 |
| **Total líneas cambiadas** | **~1500** |
| **400-line budget risk** | **Alto** |
| **Chained PRs recommended** | **Sí** |
| **Decision needed before apply** | **Sí (size:exception requerido para single PR)** |

## Task List

### Fase 0 — Infraestructura de Testing

| ID | Tarea | Archivos | Líneas | Depende |
|----|-------|----------|--------|---------|
| T0.1 | Instalar vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom | `package.json` | +5 | - |
| T0.2 | Configurar vitest en `vite.config.ts` (environment: jsdom, globals, setupFiles) | `vite.config.ts` | +15 | T0.1 |
| T0.3 | Crear `src/test-setup.ts` con import de @testing-library/jest-dom | `src/test-setup.ts` | +1 | T0.1 |
| T0.4 | Crear `src/test-utils.tsx` con mocks: useOutletContext, api, useNotification, storage | `src/test-utils.tsx` | ~150 | T0.1 |
| T0.5 | Agregar script `"test": "vitest run"` y `"test:watch": "vitest"` a package.json | `package.json` | +2 | T0.2 |
| T0.6 | Verificar: `npx vitest run` ejecuta sin errores (0 tests es ok) | - | - | T0.5 |

### Fase 1 — useCart<T> Hook

| ID | Tarea | Archivos | Líneas | Depende |
|----|-------|----------|--------|---------|
| T1.1 | Extraer funciones puras a `src/cart/cart-logic.ts`: addItem, removeItem, updateQuantity, calcTotal | `src/cart/cart-logic.ts` | ~80 | - |
| T1.2 | Tests de lógica pura (~12 tests): add, remove, update, total, edge cases | `src/cart/__tests__/cart-logic.test.ts` | ~150 | T1.1, T0.4 |
| T1.3 | Tests de regresión (~6 tests): combo doble, stock insuficiente, auto-combo, focus, 401 redirect, desborde cantidad | `src/cart/__tests__/regression.test.ts` | ~100 | T1.1, T0.4 |
| T1.4 | Crear `src/hooks/useCart.ts` — hook genérico `<T extends CartItem>` | `src/hooks/useCart.ts` | ~100 | T1.1 |
| T1.5 | Tests del hook con renderHook (~8 tests): init, add, remove, update, clear, persist, total, storage switch | `src/hooks/__tests__/useCart.test.ts` | ~150 | T1.4, T0.4 |
| T1.6 | Migrar VentasPage a useCart: reemplazar useState + sessionStorage por hook | `src/pages/VentasPage.tsx` | ~-150/+80 | T1.4, T1.5 |
| T1.7 | Migrar CompraPage a useCart: reemplazar useReducer + localStorage por hook | `src/pages/CompraPage.tsx` | ~-120/+60 | T1.4, T1.5 |
| T1.8 | Smoke test: VentasPage y CompraPage renderizan sin crash | `src/pages/__tests__/` | ~80 | T1.6, T1.7 |

### Fase 3 — CartHost

| ID | Tarea | Archivos | Líneas | Depende |
|----|-------|----------|--------|---------|
| T3.1 | Crear `src/components/hosts/CartHost.tsx` — compone useCart + CartPanel + PaymentFooter + MontoInput | `src/components/hosts/CartHost.tsx` | ~150 | T1.4 |
| T3.2 | Tests de integración de CartHost (~6 tests): renderiza, slots, interacción +/-, confirm, estado vacío | `src/components/hosts/__tests__/CartHost.test.tsx` | ~150 | T3.1, T0.4 |
| T3.3 | Migrar VentasPage a CartHost: children + paymentSlot + onConfirm | `src/pages/VentasPage.tsx` | ~-300/+80 | T3.1, T3.2, T1.6 |
| T3.4 | Migrar CompraPage a CartHost + agregar PageShell | `src/pages/CompraPage.tsx` | ~-200/+100 | T3.1, T3.2, T1.7 |
| T3.5 | Verificar visualmente: misma posición, atajos de teclado, persistencia, comportamiento | - | - | T3.3, T3.4 |

### Verificación Final

| ID | Tarea | Depende |
|----|-------|---------|
| V.1 | `npm test` — todos los tests en verde (≥30 tests) | T1.8, T3.2 |
| V.2 | `npm run build` — sin errores ni warnings | T3.5 |
| V.3 | `npm run lint` — sin errores | T3.5 |
| V.4 | Validar: PageShell visible en CompraPage | T3.4 |
| V.5 | Validar: bugs previos no regresan (combo doble, stock, auto-combo, focus, 401) | T1.3, T3.5 |

## Orden de Ejecución

```
T0.1 → T0.2 → T0.3 → T0.4 → T0.5 → T0.6
                                        ↓
T1.1 → T1.2 ─────────────────────────────┐
  ↓      ↓                               │
  │   T1.3                               │
  ↓                                      │
T1.4 → T1.5                              │
  ↓                                      │
T1.6 → T1.7 → T1.8                       │
  ↓      ↓                               │
  └──────┴────── T3.1 → T3.2             │
                   ↓                     │
              T3.3 → T3.4 → T3.5         │
                   ↓                     │
              V.1 → V.2 → V.3 → V.4 → V.5
```

## Work Unit Commits Sugeridos

| Commit | Tareas | Mensaje |
|--------|--------|---------|
| 1 | T0.1-T0.6 | `test: add vitest + testing-library infrastructure` |
| 2 | T1.1, T1.2 | `feat(cart): extract pure cart logic with tests` |
| 3 | T1.4, T1.5 | `feat(cart): add useCart generic hook with tests` |
| 4 | T1.6 | `refactor(ventas): migrate to useCart hook` |
| 5 | T1.7 | `refactor(compras): migrate to useCart hook` |
| 6 | T1.3, T1.8 | `test: add regression tests and page smoke tests` |
| 7 | T3.1, T3.2 | `feat(cart): add CartHost component with integration tests` |
| 8 | T3.3 | `refactor(ventas): migrate to CartHost` |
| 9 | T3.4, T3.5 | `refactor(compras): migrate to CartHost + add PageShell` |
