# BUS-pesables — Weight-Based Product Rules

## Metadata

```yaml
ID: BUS-pesables
Type: Business Rule
Name: Weight-Based Product Rules
Status: Active
Priority: High
Level: Project
Sources:
  - frontend/src/pages/ProductosPage.tsx
  - frontend/src/pages/VentasPage.tsx
  - frontend/src/components/ProductFormModal.tsx
  - frontend/src/components/shared/CartItemRow.tsx
  - PosWeb.Domain/Producto.cs
  - PosWeb/Application/Ventas/VentaService.cs
Template: business-rule
Created: 2026-07-05
Updated: 2026-07-05
Tags:
  - Productos
  - Ventas
  - Pesables
  - Stock
```

---

## Overview

Defines the rules for weight-based products (`esPesable = true`) in PosWeb. These products are sold by weight (e.g., ham, tomatoes) and differ from regular products in pricing, quantity handling, and display.

---

## Rules

1. **Precio por kg.** A pesable product's `PRECIO` and `COSTO` represent price per kilogram. The UI labels them as "Precio por kg" and "Costo por kg".

2. **Cantidad en kg con 3 decimales.** Sales quantities for pesable products are entered in kilograms with up to 3 decimal places (1 g precision). The cart input uses `step=0.1` for +/- buttons and accepts free decimal input. Initial quantity is 0.

3. **Stock fraccionario.** Stock for pesable products is stored as `decimal(18,3)` representing kg. Stock validation in sales uses decimal comparison, not integer.

4. **Unidad de medida fija a KG.** The unit of measure is locked to KG (ID=2). The UI disables the select and shows "KG - kilogramo".

5. **Código de barras opcional.** Pesable products may have an empty barcode. If provided, it must be unique among active products.

6. **Sin campo Contenido.** The "Contenido" field is hidden in the pesable product form. The `CONTENIDO` column is left null.

7. **Subtotal = precio × kg.** In the cart, the subtotal for a pesable item is calculated as `producto.precio * cantidad`, where `cantidad` is the weight in kg.

8. **Combo items with pesables.** Combo item quantities support decimals (`parseFloat`, not `parseInt`). The `COMBO_ITEM.CANTIDAD` column is `decimal(18,3)`.

---

## Relations

```yaml
RELATIONS:
  - type: EXTENDS
    target: BUS-venta
  - type: RELATED
    target: BUS-carrito
  - type: RELATED
    target: Producto (entity)
```
