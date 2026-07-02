# BUS-carrito — Cart Operation Rules

## Metadata

```yaml
ID: BUS-carrito
Type: Business Rule
Name: Cart Operation Rules
Status: Active
Priority: Critical
Level: Project
Sources:
  - frontend/src/pages/VentasPage.tsx
  - frontend/src/pages/CompraPage.tsx
Template: business-rule-v1
Created: 2026-06-30
Updated: 2026-06-30
Tags:
  - Ventas
  - Compras
```

---

## Overview

Defines the invariants that apply to any cart-based operation in PosWeb, regardless of whether it's a sale, purchase, quote, or return. These rules are shared by all screens that implement `PAT-cart-flow`.

---

## Rules

1. **Cart must not be empty to confirm.** An operation cannot be completed with zero items. The confirm action must be blocked while the cart is empty.

2. **Partial payment generates debt.** If the amount paid is less than the cart total, the difference is registered as a debt. The counterparty (client or supplier) determines who owes whom.

3. **Debt = total − paid.** The debt amount is always calculated as the cart total minus the paid amount. No other formula applies.

4. **Cart state persists within the operation.** The cart must survive navigation within the same screen. The storage strategy (ephemeral or persistent) is a domain decision made by the specific operation.

5. **Leaving with items warns the user.** Navigating away from a cart screen with items in the cart must prompt a confirmation. Losing unsaved items is a data loss risk.

---

## Relations

```yaml
RELATIONS:
  - type: RELATED
    target: PAT-cart-flow
```
