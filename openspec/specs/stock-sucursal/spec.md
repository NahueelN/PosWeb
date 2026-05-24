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

The system MUST expose `GET /api/stock?sucursalId={id}` returning all StockSucursal records for the given sucursal.

#### Scenario: Query sucursal stock

- GIVEN Sucursal A has 3 products with stock entries
- WHEN `GET /api/stock?sucursalId=A` is called
- THEN the response contains 3 records with productoId, sucursalId, stock

#### Scenario: Empty sucursal

- GIVEN Sucursal B has no stock entries
- WHEN `GET /api/stock?sucursalId=B` is called
- THEN the response is an empty array

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

The system MUST expose `PUT /api/stock` accepting `{ productoId, sucursalId, stock }` to set stock for a sucursal-producto pair.

#### Scenario: Successful adjustment

- GIVEN StockSucursal for Producto X in Sucursal A has Stock = 5
- WHEN `PUT /api/stock` with `{ productoId: X, sucursalId: A, stock: 20 }`
- THEN the record's Stock is updated to 20

#### Scenario: Negative stock rejected on API

- WHEN `PUT /api/stock` with `{ stock: -1 }`
- THEN the server MUST return 400 Bad Request

#### Scenario: Nonexistent sucursal

- WHEN `PUT /api/stock` with `{ sucursalId: "Z" }` and Z does not exist
- THEN the server MUST return 404 Not Found

### Requirement: Frontend Stock Page

The system MUST render a `/stock` page with a sucursal selector (defaulting to active sucursal) and an editable grid showing: Producto | Código | Stock Actual | Stock Mínimo | Acción.

#### Scenario: View stock page

- GIVEN the user is authenticated
- WHEN they navigate to `/stock`
- THEN they see a sucursal selector at top
- AND a table of products with current stock per sucursal

#### Scenario: Inline stock edit

- GIVEN the stock grid is displayed for Sucursal A
- WHEN the user edits the stock field of a row and saves
- THEN `PUT /api/stock` is called with the new value
- AND the grid reflects the updated stock

#### Scenario: Low stock row highlight

- GIVEN a product has stock ≤ 5 for the selected sucursal
- WHEN the stock grid renders
- THEN the row is visually highlighted

#### Scenario: Filter by product name

- GIVEN the stock grid shows 10 products
- WHEN the user types a product name in the search field
- THEN the grid filters to matching products only
