# Delta for compra

## ADDED Requirements

### Requirement: Inline Product Creation

The system MUST create a new Producto when an item includes inline creation data (`codigoBarra`, `nombre`) but no `productoId`.

Inline creation data MUST include `codigoBarra` and `nombre`. Fields `precio`, `costo`, and `tamano` MAY be provided; they default to 0 or null when omitted.

The system MUST reject inline creation when `codigoBarra` already exists in the database.

#### Scenario: Minimal inline creation succeeds

- GIVEN an item with no `productoId`, `codigoBarra="NEW001"`, and `nombre="New Product"`
- WHEN the request is processed
- THEN a new Producto is created with the given values
- AND `precio` and `costo` default to 0

#### Scenario: Duplicate barcode returns 409

- GIVEN a Producto exists with `codigoBarra="EXISTING"`
- WHEN an item includes inline creation data with `codigoBarra="EXISTING"`
- THEN the response returns 409 Conflict
- AND no data is persisted

## MODIFIED Requirements

### Requirement: Purchase Creation

The system MUST provide a `POST /api/compras/crear` endpoint that creates a purchase by increasing stock for each item and recording a single Gasto in one atomic transaction.

The request MUST include `sucursalId` and `items` array. Each item MUST specify `cantidad` and either `productoId` (existing product) or inline creation data (`codigoBarra`, `nombre`). An item MAY include `precio` and `costo` for display or update purposes.

When `productoId` is 0 or omitted, the system MUST create a new product from the inline creation data. When `precio` or `costo` differs from the product's current values, the system MUST update them.
(Previously: items used `productoId` only; separate `nuevosProductos` array for quick creation; price and cost were not updatable during purchase)

#### Scenario: Creating a purchase increases stock and records an expense

- GIVEN an active caja exists for the sucursal
- AND existing products with current stock levels
- WHEN a POST request is sent to `/api/compras/crear` with valid items referencing existing `productoId` values
- THEN stock for each product increases by the specified cantidad
- AND a Gasto record is created linked to the active caja with the total amount
- AND the response returns 200 OK

#### Scenario: Creating a purchase with inline-created products

- GIVEN an active caja exists for the sucursal
- WHEN a POST request includes items without `productoId` and with inline creation data
- THEN new products are created from the inline data
- AND their stock increases by the specified cantidad
- AND a Gasto record is created atomically

#### Scenario: Purchase updates price and cost on existing products

- GIVEN a product exists with `precio=100` and `costo=50`
- WHEN an item references that `productoId` with `precio=120` and `costo=60`
- THEN the product's `precio` is updated to 120
- AND the product's `costo` is updated to 60
- AND stock increases normally

### Requirement: Input Validation

The system MUST validate purchase request data and reject malformed input.
(Previously: validated `nuevosProductos` array for duplicate barcodes)

#### Scenario: Missing required fields returns 400

- GIVEN a POST request to `/api/compras/crear` with an empty `items` array
- WHEN the request is processed
- THEN the response returns 400 Bad Request
- AND no data is persisted

#### Scenario: Inline creation missing required fields returns 400

- GIVEN a POST request with an item that has no `productoId`
- AND the item is missing `codigoBarra` or `nombre`
- WHEN the request is processed
- THEN the response returns 400 Bad Request
- AND no data is persisted
