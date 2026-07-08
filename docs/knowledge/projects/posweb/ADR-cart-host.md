# ADR-cart-host — The CartHost Architectural Decision

## Metadata

```yaml
ID: ADR-cart-host
Type: ADR
Name: CartHost as Mediator for Cart-Based Screens
Status: Active
Priority: Critical
Level: Project
Sources:
  - frontend/src/components/hosts/CartHost.tsx
  - frontend/src/pages/VentasPage.tsx
  - frontend/src/pages/CompraPage.tsx
Template: adr-v1
Created: 2026-06-30
Updated: 2026-06-30
Tags:
  - Ventas
  - Compras
  - Keyboard
  - UX
```

---

## Context

PosWeb has multiple screens that follow the same structural pattern: a product grid on the left, a cart panel on the right, and a payment footer at the bottom. Sales and Purchases were the first two. Both independently implemented the same composition of shared primitives — cart panel, item list, payment footer, amount input — plus identical keyboard orchestration (Escape to search, Enter focus chain).

Without an architectural decision, every future cart screen would reimplement this composition independently. Layout, keyboard behavior, and component wiring would diverge across screens. A layout change would require touching N pages.

---

## Decision

**Cart-based screens are built using a Mediator component (CartHost) that composes shared primitives and orchestrates keyboard flow, receiving all domain state and behavior through dependency injection and slots.**

The Host owns layout composition and keyboard orchestration. It never owns domain state. Domain-specific content (payment controls, product grids, confirmation logic) is injected through slots and callbacks.

---

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| **Each page composes primitives independently** | This was the initial state. It caused layout duplication, keyboard behavior divergence, and maintenance cost proportional to the number of cart screens. |
| **Shared hook for cart layout logic** | A hook cannot render conditional JSX (optional shell wrapper, confirm overrides). Layout structure belongs in the component tree, not in state logic. |
| **Higher-Order Component** | HOCs complicate multiple slot injection and generic typing. Props + children composition is more readable and better typed. |
| **Render props** | Requires the consumer to write the structure. The goal was precisely the opposite: the consumer should NOT write the structure. |
| **Monolithic non-generic component** | Would work for one domain only. Loses the reusability that justified the extraction. |

---

## Consequences

### What this enables

- **New cart screens in ~80 lines** of domain logic plus slot injection, instead of ~800 lines of duplicated composition.
- **Guaranteed keyboard consistency** across all cart screens. Escape, Enter chain, and focus management behave identically.
- **Single point of change** for layout modifications. Moving the footer or changing the panel ratio is one edit.
- **Testable architecture.** The Host receives cart state as a prop. Domain logic is tested independently.

### What this limits

- **The two-panel layout is fixed.** A screen needing three panels or a bottom-sheet cart requires a different Host. This is intentional — each Host owns a single layout responsibility.
- **The item contract is `{ cantidad: number }`.** A future flow with non-quantity items (e.g., file selection) cannot reuse this Host.

### What this obliges

- **Every new cart-based screen must use CartHost.** Creating a parallel implementation requires explicit architectural justification.
- **Future Hosts must follow the same contract.** The `hosts/` directory is an architectural category, not a utility folder. Any new Host must: not own domain state, expose slots for domain injection, and own its keyboard orchestration.

---

## When to Revisit

This ADR should be reconsidered when:

- A new screen type appears that is structurally cart-like but doesn't fit the two-panel layout (e.g., a wizard-like cart, a bottom-sheet cart on mobile).
- CartHost accumulates more than 30 props, indicating the slot surface has become unmanageable.
- A new cart screen is built without CartHost and the alternative proves simpler or more maintainable.
- The keyboard orchestration logic grows complex enough to warrant extraction into a separate system.

---

## Relations

```yaml
RELATIONS:
  - type: RELATED
    target: PAT-cart-flow
  - type: RELATED
    target: ADR-db-hybrid
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-06-30 | ADR created |
