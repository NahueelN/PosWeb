# Delta: purchases-ux — useReducer → useCart

## Modified Requirement: State Management Implementation

**Original** (specs/purchases-ux/spec.md, "Three-Step Navigation"): "The system MUST use a `useReducer`-based state machine with three steps: `scan`, `confirm`, `done`."

**Delta**: La implementación de estado del carrito DEBE usar `useCart<T>` en lugar de `useReducer` directo. El hook `useCart` puede internamente usar `useReducer` o `useState` — es detalle de implementación. El contrato de comportamiento (tres pasos, persistencia entre transiciones, misma UX) se mantiene sin cambios.

**Razón**: Unificar la lógica de carrito con VentasPage mediante un hook compartido, eliminando duplicación y facilitando testing.

**Escenarios afectados**: Ninguno. Todos los escenarios de `purchases-ux` siguen siendo válidos ya que describen comportamiento UX, no mecanismo interno de estado.
