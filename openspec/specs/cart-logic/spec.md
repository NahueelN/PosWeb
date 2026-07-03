# Cart Logic Specification

## Purpose

Funciones puras de carrito — sin dependencia de React — que modelan las operaciones de agregar, quitar, actualizar cantidad y calcular total para cualquier tipo de ítem de carrito.

## Requirements

### Requirement: Add Item

`addItem<T extends { id: number }>(items: T[], newItem: T, mergeKey?: keyof T): T[]`

Si el ítem ya existe (matchea por `mergeKey`, default `id`), incrementa cantidad. Si no, lo agrega.

#### Scenario: Adding new item
- GIVEN carrito vacío `[]`
- WHEN `addItem([], { id: 1, cantidad: 1 })`
- THEN retorna `[{ id: 1, cantidad: 1 }]`

#### Scenario: Adding duplicate increments quantity
- GIVEN carrito `[{ id: 1, cantidad: 2 }]`
- WHEN `addItem(cart, { id: 1, cantidad: 1 })`
- THEN retorna `[{ id: 1, cantidad: 3 }]`

### Requirement: Remove Item

`removeItem<T extends { id: number }>(items: T[], id: number): T[]`

Elimina el ítem por id.

#### Scenario: Removing existing item
- GIVEN carrito con 2 ítems
- WHEN `removeItem(cart, idDelPrimero)`
- THEN retorna carrito con 1 ítem (el segundo)

#### Scenario: Removing non-existent item is no-op
- GIVEN cualquier carrito
- WHEN `removeItem(cart, idInexistente)`
- THEN retorna mismo array sin cambios

### Requirement: Update Quantity

`updateQuantity<T extends { id: number; cantidad: number }>(items: T[], id: number, cantidad: number): T[]`

Actualiza la cantidad. Si cantidad ≤ 0, elimina el ítem.

#### Scenario: Updating to positive quantity
- GIVEN `[{ id: 1, cantidad: 2 }]`
- WHEN `updateQuantity(cart, 1, 5)`
- THEN retorna `[{ id: 1, cantidad: 5 }]`

#### Scenario: Updating to zero removes item
- GIVEN `[{ id: 1, cantidad: 2 }]`
- WHEN `updateQuantity(cart, 1, 0)`
- THEN retorna `[]`

### Requirement: Calculate Total

`calcTotal<T extends { cantidad: number; precioUnitario: number }>(items: T[]): number`

Suma `cantidad × precioUnitario` para todos los ítems.

#### Scenario: Empty cart total is zero
- GIVEN carrito vacío
- WHEN `calcTotal([])`
- THEN retorna `0`

#### Scenario: Cart with items
- GIVEN `[{ cantidad: 2, precioUnitario: 100 }, { cantidad: 1, precioUnitario: 50 }]`
- WHEN `calcTotal(cart)`
- THEN retorna `250`

### Requirement: Pure Functions — No Side Effects

Todas las funciones SON puras: mismo input → mismo output, sin mutar argumentos, sin acceder a storage, DOM o APIs externas.
