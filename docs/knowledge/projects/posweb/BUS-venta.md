# BUS-venta — Sales-Specific Business Rules

## Metadata

```yaml
ID: BUS-venta
Type: Business Rule
Name: Sales-Specific Business Rules
Status: Active
Priority: Critical
Level: Project
Sources:
  - frontend/src/pages/VentasPage.tsx
Template: business-rule-v1
Created: 2026-06-30
Updated: 2026-06-30
Tags:
  - Ventas
  - Caja
  - Cliente
  - Combo
```

---

## Overview

Defines the business rules exclusive to the sales process. These extend `BUS-carrito` — all cart-level rules apply to sales. The rules here are specific to selling products to customers.

---

## Rules

1. **Cash register must be open.** A sale cannot proceed without an active cash register. Verified on entry and re-verified before confirming.

2. **Payment method must be selected.** A sale requires exactly one payment method from the available options.

3. **Change only if the method allows it.** `pagaVuelto` controls whether change is calculated. If the selected method does not pay change, `recibido > total` should not compute change.

4. **Stock is validated before sale.** Items exceeding available stock show a warning and require explicit confirmation to proceed with `allowSinStock`.

5. **Partial payment requires a client.** If the amount received is less than the total, a client must be selected to register the debt.

6. **Combos auto-detect when all constituent items are present.** If every item in a combo definition is in the cart with sufficient quantity, they are unified into a single combo line item. Cart operations on combo items must follow the identity contract defined in `PAT-cart-flow`.

7. **Payment methods sorted: Cash first, Transfer second.** `id=1` (Efectivo) and `id=4` (Transferencia) appear before other methods.

---

## Relations

```yaml
RELATIONS:
  - type: EXTENDS
    target: BUS-carrito
  - type: RELATED
    target: PAT-cart-flow
```
