# Stock Sucursal Specification

## Purpose

Track and manage inventory per sucursal (branch), enabling per-location stock queries, adjustments, and low-stock alerts independent of global Producto.STOCK.

## Requirements

### Requirement: StockSucursal Entity

The system MUST expose a `StockSucursal` entity with composite key (ProductoId, SucursalId), an integer Stock ≥ 0, and domain methods `DescontarStock(cantidad)` and `AumentarStock(cantidad)`.

#### Scenario: Create stock record

- GIVEN a Producto and a Sucursal exist
- WHEN a StockSucursal record is created with Stock = 10
- THEN the record is persisted with the composite key
- AND Stock = 10

#### Scenario: Negative stock rejected

- GIVEN a StockSucursal record with Stock = 5
- WHEN DescontarStock(10) is called
- THEN the operation MUST throw a domain exception
- AND Stock remains 5

### Requirement: Query Stock Per Sucursal

The system MUST expose `GET /api/stock?sucursalId={id}` returning the full active catalog for the given sucursal, using branch stock as the source of truth. When no `StockSucursal` row exists, the response SHALL still include the product with stock `0` and an uninitialized state.
(Previously: only existing `StockSucursal` rows were returned, so products without rows were hidden.)

#### Scenario: Query sucursal stock

- GIVEN Sucursal A has 3 products with stock rows and 1 active product without one
- WHEN `GET /api/stock?sucursalId=A` is called
- THEN the response contains 4 product records for Sucursal A
- AND the product without a row is returned as `0` and uninitialized

#### Scenario: Empty sucursal with active catalog

- GIVEN Sucursal B has active catalog products and no stock rows yet
- WHEN `GET /api/stock?sucursalId=B` is called
- THEN the response lists those products instead of an empty array
- AND each product is shown as `0` and uninitialized

### Requirement: Low Stock Alert

The system MUST expose `GET /api/stock/bajo?sucursalId={id}&limite={n}` returning StockSucursal records where stock ≤ limite.

#### Scenario: Filter by limit

- GIVEN Sucursal A has products with stock [2, 8, 15]
- WHEN `GET /api/stock/bajo?sucursalId=A&limite=5` is called
- THEN the response contains only the record with stock = 2

#### Scenario: Missing limite parameter

- WHEN `GET /api/stock/bajo?sucursalId=A` is called without limite
- THEN the server MUST return 400 Bad Request

### Requirement: Adjust Stock

The system MUST expose `PUT /api/stock/ajustar` accepting `{ productoId, sucursalId, stock }` to create or update branch stock intentionally for a sucursal-product pair.
(Previously: the endpoint behavior assumed an existing row and did not define initialization of missing rows.)

#### Scenario: Successful adjustment

- GIVEN StockSucursal for Producto X in Sucursal A has Stock = 5
- WHEN `PUT /api/stock/ajustar` sets stock to 20
- THEN the branch stock for (X, A) is updated to 20

#### Scenario: Initialize missing branch stock

- GIVEN Producto X is visible for Sucursal A with no StockSucursal row yet
- WHEN `PUT /api/stock/ajustar` sets stock to 8
- THEN the system creates the branch stock row for (X, A)
- AND the resulting stock is 8

#### Scenario: Negative stock rejected on API

- WHEN `PUT /api/stock/ajustar` sets `stock: -1`
- THEN the server MUST return 400 Bad Request

#### Scenario: Nonexistent sucursal

- WHEN `PUT /api/stock/ajustar` references a sucursal that does not exist
- THEN the server MUST return 404 Not Found

### Requirement: Frontend Stock Page

The system MUST render `/stock` from the active catalog for the selected sucursal, clearly showing initialized and uninitialized branch stock, and MUST allow inline initialization or adjustment from the same grid.
(Previously: the page only showed products that already had a branch stock row.)

#### Scenario: View stock page

- GIVEN the user is authenticated and selects Sucursal A
- WHEN they navigate to `/stock`
- THEN they see active catalog products for that sucursal, including uninitialized ones
- AND each row shows current branch stock or an uninitialized zero state

#### Scenario: Inline stock initialization

- GIVEN the grid shows a product with uninitialized branch stock
- WHEN the user enters a stock value and saves
- THEN `PUT /api/stock/ajustar` is called for that branch-product pair
- AND the row refreshes as initialized branch stock

#### Scenario: Low stock row highlight

- GIVEN a product has branch stock less than or equal to the low-stock limit
- WHEN the stock grid renders
- THEN the row is visually highlighted, whether the stock came from an existing row or a just-initialized one

#### Scenario: Filter by product name

- GIVEN the stock grid shows initialized and uninitialized products
- WHEN the user types a product name in the search field
- THEN the grid filters matching catalog products regardless of stock-row existence
