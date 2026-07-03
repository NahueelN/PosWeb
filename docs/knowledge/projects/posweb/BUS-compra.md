# BUS-compra — Purchase-Specific Business Rules

## Metadata

```yaml
ID: BUS-compra
Type: Business Rule
Name: Purchase-Specific Business Rules
Status: Active
Priority: Critical
Level: Project
Sources:
  - frontend/src/pages/CompraPage.tsx
Template: business-rule-v1
Created: 2026-06-30
Updated: 2026-06-30
Tags:
  - Compras
  - Proveedor
  - Scanner
```

---

## Overview

Defines the business rules exclusive to the purchase process. These extend `BUS-carrito` — all cart-level rules apply to purchases. The rules here are specific to buying products from suppliers.

---

## Rules

1. **Supplier is required.** A purchase cannot be confirmed without a selected supplier.

2. **Verification checkbox must be marked.** The operator must explicitly confirm they have verified quantities and costs before the purchase can be completed.

3. **New products can be created inline during purchase.** Items with `productoId === 0` are created server-side as part of the purchase. The purchase request carries all fields needed to create the product.

4. **Three payment sources are available.** The purchase can be paid from: cash register (`caja`), savings (`ahorro`), or split between both (`dividir`).

5. **Barcode lookup requires explicit confirmation.** Unlike sales where all products exist in the local catalog, purchases may involve products not yet in the database. Barcode lookup cascades through local DB → local filtered list → external API (Open Food Facts). The explicit confirmation step (Enter) distinguishes between typing a product name and completing a barcode entry that may trigger an external API call or open a product creation modal. Scanner input (paste) triggers automatically because the hardware signals completion.

---

## Relations

```yaml
RELATIONS:
  - type: EXTENDS
    target: BUS-carrito
  - type: RELATED
    target: PAT-cart-flow
```
