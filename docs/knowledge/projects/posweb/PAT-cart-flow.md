# PAT-cart-flow — Canonical Cart Flow Pattern

## Metadata

```yaml
ID: PAT-cart-flow
Type: Pattern
Name: Cart Flow Pattern
Status: Canonical
Priority: Critical
Level: Project
Sources:
  - frontend/src/components/hosts/CartHost.tsx
  - frontend/src/hooks/useCart.ts
  - frontend/src/cart/cart-logic.ts
  - frontend/src/hooks/useItemSnapshot.ts
  - frontend/src/components/shared/PaymentFooter.tsx
  - frontend/src/components/shared/CartPanel.tsx
  - frontend/src/components/shared/CartItemRow.tsx
  - frontend/src/components/shared/CartItemList.tsx
  - frontend/src/components/shared/MontoInput.tsx
  - frontend/src/pages/VentasPage.tsx
  - frontend/src/pages/CompraPage.tsx
Template: pattern-v1
Created: 2026-06-30
Updated: 2026-07-01
Tags:
  - Ventas
  - Compras
  - Keyboard
  - UX
```

---

## Overview

The Cart Flow Pattern defines the canonical architecture for any two-panel cart-based workflow in PosWeb — sales, purchases, quotes, returns, and any future operation that involves selecting items into a cart and confirming the operation with payment.

It exists because the same compositional structure appeared independently in VentasPage and CompraPage (~150 lines of identical layout and keyboard orchestration each), and would have continued to duplicate in every future cart screen.

---

## Origin

VentasPage and CompraPage were built separately over time. Both needed the same structural skeleton: a product grid on the left, a cart panel on the right with a payment footer, and full keyboard navigation for fast operators.

The duplication was fragile. A layout change meant touching two pages. A keyboard flow fix meant testing two pages. A new cart screen (like Quotes) would have meant copying ~150 lines of composition for a third time.

CartHost was extracted as the single source of truth for cart layout composition. The term "Host" was chosen deliberately — it hosts shared primitives without owning domain state, following the Mediator pattern.

The cost of not having this pattern: every new cart screen would independently wire up CartPanel, PaymentFooter, MontoInput, keyboard handlers, and the Escape-to-search chain. Inconsistencies between screens would accumulate.

---

## Problem It Solves

**Duplication of cart screen composition.** Without this pattern, every two-panel cart screen reimplements the same layout, the same keyboard flow, and the same primitive wiring. The pattern provides a single generic Host that any cart screen composes through dependency injection and slots.

---

## When to Use

- Any new screen that involves: selecting items from a catalog into a cart, reviewing/modifying the cart, and confirming the operation with a payment or action footer.
- Examples: Sales, Purchases, Quotes, Returns, Order Fulfillment.

## When NOT to Use

- Single-panel operations (e.g., a simple product lookup or settings page).
- Operations that don't have a cart concept (e.g., dashboards, reports).
- Wizards with multi-step flows that don't fit the two-panel cart layout (use PAT-wizard instead, when it exists).

---

## Architecture

The pattern separates three layers with strict boundaries:

```
Page (domain logic, useCart, handlers, getItemProps)
  └── CartHost (layout composition, keyboard flow, slot wiring)
        └── Shared primitives (CartPanel, PaymentFooter, CartItemRow, etc.)
```

CartHost acts as a Mediator: it composes shared primitives and orchestrates keyboard flow without owning domain state. The architectural decision behind this choice — including alternatives evaluated and trade-offs accepted — is documented in `ADR-cart-host`.

### Key Design Properties

1. **The Host receives cart state via dependency injection.** The Page owns `useCart` and passes the result as a prop. This keeps domain-specific choices (storage strategy, item identity) in the Page and makes the Host testable with a mock.

2. **The Host is generic over item type.** The Page provides accessors (`getId`, `getPrecioUnitario`, `getItemProps`). The Host never knows what a cart item looks like.

3. **Customization uses slots, not configuration.** Seven ReactNode slots allow domain injection without subclassing or complex config objects.

4. **Keyboard ownership is centralized.** The Escape-to-search chain and Enter focus progression live in the Host. Pages provide ref targets, not keyboard handlers.

5. **Cart logic is pure and framework-agnostic.** Functions in `cart-logic.ts` handle mutations and calculations. They are testable without a DOM.

---

## Implementation Contracts

These are technical constraints that every cart operation must respect. They are not business rules — they are contracts of the cart system.

### Item Identity Contract

Cart operations identify items using the accessor provided to `useCart`:

```
getId(item) = item.comboId ?? item.productoId ?? item.producto.id
```

All operations — updateQuantity, removeItem, useItemSnapshot, inputRef registration — must use this same key. Using a different key (e.g., `producto.id` for a combo item where `producto.id === 0`) silently breaks cart behavior.

This contract exists because the cart system is generic over item type. Different domains provide different item shapes. Ventas uses `{ producto: { id }, comboId? }`. Compras uses `{ productoId, costoUnitario }`. The `getId` accessor bridges domain-specific shapes to a stable identity key. Any new cart domain must define its own `getId` that returns a unique stable identifier.

---

## Invariants

These must never be broken:

1. **The Host does not call `useCart`.** It receives the cart state as a prop. Breaking this couples the Host to a specific hook and prevents testing.

2. **Escape always returns to the search input**, UNLESS a dialog is open or focus is on a cart quantity input. Breaking this causes modal dialogs to close unexpectedly or interferes with quantity editing.

3. **Item identity is defined by the Page**, not the Host, through `getId` and `getItemProps`. Breaking this makes the Host domain-aware.

4. **Storage strategy is a Page decision.** Sales uses sessionStorage (cart dies with tab). Purchases uses localStorage (cart survives refresh). The Host does not know or care.

5. **Payment and confirmation are slots.** Never hardcode a payment method or confirm label into the Host. Every cart screen has different payment semantics.

---

## Implementation Guide

To create a new cart screen using this pattern:

1. **Define your item type** extending `CartItemBase` (`{ cantidad: number }`).
2. **Call `useCart<YourItem>({ storageKey, storage, getId, getPrecioUnitario })`** in your Page.
3. **Define `getItemProps`** that maps your item → `CartItemRowProps` (name, price display, quantity controls, optional badges).
4. **Render `<CartHost>`** passing: `cart`, `getItemProps`, `confirmLabel`, `onConfirm`, and domain-specific slots (`paymentSlot`, `children` for the left panel).
5. **Handle `onConfirm`** by building the API request from `cart.items` and calling your endpoint.

The Host handles everything else: layout, keyboard navigation, empty states, cart clearing.

---

## Expected Evolution

Any future screen matching the two-panel cart shape must implement this pattern:

- `PAT-cart-flow` → Quotes (`PresupuestosPage`)
- `PAT-cart-flow` → Returns (`DevolucionesPage`)
- `PAT-cart-flow` → Order Fulfillment

A new cart screen should be ~80 lines of domain logic plus slot injection, not ~800 lines of duplicated composition.

Deviations require explicit justification: either the pattern doesn't fit (e.g., a three-panel layout), or the user approves a new architectural direction.

---

## Common Mistakes

- ❌ Calling `useCart` inside a new Host-like component instead of injecting it.
- ❌ Hardcoding `confirmLabel` or payment UI inside the Host.
- ❌ Implementing keyboard Escape without checking for open dialogs.
- ❌ Using the wrong storage (`localStorage` for ephemeral carts, `sessionStorage` for persistent carts).
- ✅ Inject cart state as props. Use slots for domain UI. Respect dialog-aware keyboard handling.

---

## Relations

```yaml
RELATIONS:
  - type: USES
    target: HOOK-use-cart
  - type: USES
    target: COMP-cart-host
  - type: RESPECTS
    target: BUS-carrito
  - type: RESPECTS
    target: BUS-venta
  - type: RESPECTS
    target: BUS-compra
  - type: USES
    target: PAT-display-raw
  - type: RELATED
    target: ADR-cart-host
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-06-30 | Creación como Canonical Pattern |
