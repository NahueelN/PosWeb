# Proposal: Unificar Carrito — Ventas y Compras

## Intent

Eliminar ~800 líneas de lógica de carrito duplicada entre VentasPage y CompraPage mediante un hook `useCart<T>` genérico y un componente `CartHost`, garantizando cero regresiones con tests automatizados. Agregar PageShell a CompraPage.

## Scope

### In Scope
- Instalar vitest + testing-library + jsdom (Fase 0)
- Extraer lógica pura a `src/cart/cart-logic.ts`
- Crear `src/hooks/useCart.ts` — hook genérico tipado con persistencia configurable
- Tests unitarios: lógica pura (~12), regresión bugs conocidos (~6), hook (~8)
- Crear `src/components/hosts/CartHost.tsx` + tests integración (~6)
- Migrar VentasPage y CompraPage a `useCart` + `CartHost`
- Agregar `PageShell` a CompraPage (actualmente ausente)
- Comportamiento idéntico post-migración

### Out of Scope
- Fases 2, 4, 5, 6 de propuestaUnificacion.md (useCrud, CrudHost, resto ABMs)
- Backend

## Capabilities

### New Capabilities
- `cart-logic`: Funciones puras (addItem, removeItem, updateQuantity, calcTotal)
- `use-cart-hook`: Hook `useCart<T>` con persistencia configurable (sessionStorage/localStorage)
- `cart-host`: Componente que compone useCart + CartPanel + PaymentFooter + MontoInput
- `frontend-testing`: Infraestructura (vitest, testing-library, test-utils, mocks)

### Modified Capabilities
- `purchases-ux`: Reemplazar implementación `useReducer` por `useCart` — preserva mismo comportamiento UX, cambia mecanismo interno de estado

## Approach

**Testing-first**: infraestructura → tests lógica pura → tests hook → tests integración → migración páginas. Cada migración conserva misma UX, atajos de teclado, persistencia y validaciones.

## Affected Areas

| Area | Impacto | Descripción |
|------|---------|-------------|
| `frontend/package.json` | Modificado | Agregar vitest, testing-library, jsdom |
| `frontend/vite.config.ts` | Modificado | Configurar test environment |
| `frontend/src/cart/` | Nuevo | cart-logic.ts |
| `frontend/src/hooks/useCart.ts` | Nuevo | Hook genérico |
| `frontend/src/components/hosts/` | Nuevo | CartHost.tsx |
| `frontend/src/pages/VentasPage.tsx` | Modificado | Migrar a useCart + CartHost |
| `frontend/src/pages/CompraPage.tsx` | Modificado | Migrar a useCart + CartHost + PageShell |

## Riesgos

| Riesgo | Prob. | Mitigación |
|--------|-------|------------|
| Compatibilidad vitest con Vite 8 / React 19 / TS 6 | Media | Probar install primero; evaluar alternativas si falla |
| Interfaces Item distintas (Ventas vs Compras) | Alta | Hook genérico con `T extends CartItem`; adapter por página |
| Regresión bugs arreglados (combo doble, stock, auto-combo, focus) | Alta | Tests de regresión antes de migrar |
| Persistencia diferente (sessionStorage vs localStorage) | Media | Hook acepta `storage` configurable |

## Rollback

Revertir commits. Componentes originales no se eliminan hasta verificar tests en verde. Cada fase es independiente: testing no rompe nada; useCart coexiste con código actual hasta migración completa.

## Dependencies

Ninguna externa. vitest y testing-library son devDependencies.

## Success Criteria
- [ ] ≥30 tests en verde (lógica pura + hook + integración + regresión)
- [ ] VentasPage y CompraPage funcionan idéntico visual y funcionalmente
- [ ] `npm run build` sin errores
- [ ] PageShell visible en CompraPage
- [ ] Cada página reduce ≥40% líneas duplicadas de carrito
