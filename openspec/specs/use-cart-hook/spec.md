# useCart Hook Specification

## Purpose

Hook React genérico `useCart<T>` que reemplaza la lógica de carrito duplicada en VentasPage y CompraPage, usando las funciones puras de `cart-logic` internamente. Soporta persistencia configurable y expone una API unificada.

## Requirements

### Requirement: Generic Typed Hook

`useCart<T extends { id: number; cantidad: number }>(config: UseCartConfig<T>): UseCartReturn<T>`

Config acepta: `storageKey: string`, `storage?: Storage` (default `sessionStorage`), `mergeKey?: keyof T`, `getPrecioUnitario: (item: T) => number`.

#### Scenario: Initializes from storage
- GIVEN sessionStorage tiene datos para `storageKey`
- WHEN hook monta
- THEN `items` contiene los datos persistidos

#### Scenario: Initializes empty when no storage
- GIVEN storage vacío para `storageKey`
- WHEN hook monta
- THEN `items` es `[]`

### Requirement: Cart Operations

Expone: `items`, `addItem(item)`, `removeItem(id)`, `updateQuantity(id, cantidad)`, `clearCart()`, `total`.

#### Scenario: addItem updates state and persists
- GIVEN hook montado con `storageKey: 'venta_cart'`
- WHEN `addItem({ id: 1, cantidad: 1, precio: 100 })`
- THEN `items` incluye el ítem
- AND sessionStorage contiene el ítem serializado

#### Scenario: removeItem updates state and persists
- GIVEN carrito con 1 ítem
- WHEN `removeItem(id)`
- THEN `items` queda vacío
- AND storage se limpia (carrito vacío)

#### Scenario: updateQuantity with 0 removes item
- GIVEN carrito con 1 ítem cantidad=3
- WHEN `updateQuantity(id, 0)`
- THEN `items` queda vacío

### Requirement: Computed Total

`total` se recalcula automáticamente vía `calcTotal` + `getPrecioUnitario`.

#### Scenario: Total updates on add
- GIVEN carrito vacío (total=0)
- WHEN `addItem({ id: 1, cantidad: 2, precio: 100 })`
- THEN `total` es `200`

### Requirement: Configurable Persistence

El hook acepta `storage` (Storage API). Default: `sessionStorage`. Para CompraPage se pasa `localStorage`.

#### Scenario: localStorage persistence
- GIVEN hook con `storage: localStorage`, `storageKey: 'compra_cart'`
- WHEN `addItem(...)`
- THEN localStorage tiene los datos, no sessionStorage

### Requirement: Clear Cart

`clearCart()` vacía items y remueve la key del storage.

#### Scenario: clearCart resets state
- GIVEN carrito con ítems
- WHEN `clearCart()`
- THEN `items` es `[]`
- AND storage key fue eliminada
