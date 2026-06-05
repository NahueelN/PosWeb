# Compra Specification

## Purpose

Track product purchases as stock increases with associated expense records integrated into the caja cierre workflow.

## Requirements

### Requirement: Atomic Full-Entity Persistence

The system MUST wrap the purchase creation flow in `IDbContextTransaction`: validate items → create `Compra` (`ID_SUCURSAL`, `ID_PROVEEDOR`, `ID_USUARIO`, `NUMERO_COMPROBANTE`, `TOTAL`, `FECHA_COMPRA`) → create `RenglonCompra` per item → update stock → create `Gasto` linked to active caja → assign `ID_GASTO` back to Compra → single `SaveChanges`. Any failure MUST roll back entirely.

#### Scenario: Transaction rollback on error

- GIVEN a request with 3 items where the third references a non-existent product
- WHEN processed
- THEN no Compra, RenglonCompra, stock changes, or Gasto are persisted
- AND the response returns 400

### Requirement: Proveedor Reference

The request MUST include `proveedorId: int`. The system MUST validate the provider exists before proceeding.

#### Scenario: Invalid proveedor returns 400

- GIVEN a request with `proveedorId: 9999` and no matching Proveedor
- WHEN processed
- THEN returns 400 Bad Request
- AND no data is persisted

### Requirement: User Tracking

The controller MUST extract `userId` from JWT context and set `Compra.ID_USUARIO` via `GetUserId()`.

#### Scenario: Compra stores the authenticated user

- GIVEN an authenticated user with ID 5
- WHEN a purchase is created
- THEN `Compra.ID_USUARIO` equals 5

### Requirement: CompraId in Response

The response MUST include `compraId: int` (the created Compra's primary key).

#### Scenario: Response includes compraId

- GIVEN a successful creation
- WHEN the response is returned
- THEN `compraId` is present and non-zero

### Requirement: Orphan Gasto Strategy

Existing Gastos without an `ID_COMPRA` MUST remain unchanged. New Gastos MUST always have `ID_COMPRA` set (via `Compra.ID_GASTO` foreign key back to Gasto).

#### Scenario: Existing orphan preserved

- GIVEN a Gasto with `ID_COMPRA = NULL` exists from before the change
- WHEN the system runs
- THEN that Gasto is not modified or deleted

### Requirement: Purchase Creation

The system MUST provide a `POST /api/compras/crear` endpoint that creates a purchase — instantiating `Compra` and `RenglonCompra` entities, increasing stock for each item, and recording a single `Gasto` — in one atomic transaction.

The request MUST include `sucursalId`, `proveedorId`, and `items` array. Each item MUST specify `cantidad` and either `productoId` (existing product) or inline creation data (`codigoBarra`, `nombre`). An item MAY include `precio` and `costo` for display or update purposes.

When `productoId` is 0 or omitted, the system MUST create a new product from the inline creation data. When `precio` or `costo` differs from the product's current values, the system MUST update them.
(Previously: used `proveedor: string`, no Compra entity, no atomic transaction; items used `productoId` only; separate `nuevosProductos` array for quick creation; price and cost were not updatable during purchase)

#### Scenario: Full entity creation (updated)

- GIVEN an active caja, an existing proveedor, and existing products
- WHEN POST `/api/compras/crear` includes `proveedorId` and valid items
- THEN a Compra row exists with correct ID_PROVEEDOR, ID_USUARIO, ID_SUCURSAL, TOTAL, FECHA_COMPRA
- AND RenglonCompra rows are created for each item
- AND stock increases
- AND a Gasto is created with ID_COMPRA set
- AND response includes `compraId`

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

### Requirement: Active Caja Validation

The system MUST reject purchase creation when no caja is open for the sucursal.

#### Scenario: Purchase with no active caja returns 400

- GIVEN no active caja exists for the sucursal
- WHEN a POST request is sent to `/api/compras/crear`
- THEN the response returns 400 Bad Request
- AND the error message indicates "no hay caja abierta"
- AND no stock changes or Gasto records are persisted

### Requirement: Cierre Preview Integration

The `GET /api/caja/{id}/preview-cierre` endpoint MUST include `totalGastos` in the response, computed as the sum of all Gasto amounts linked to that caja.

#### Scenario: Cierre preview shows accumulated gastos

- GIVEN a caja with multiple purchase Gasto records
- WHEN `GET /api/caja/{id}/preview-cierre` is called
- THEN the response includes a `totalGastos` field
- AND its value equals the sum of all Gasto.MONTO for that caja
- AND regular venta totals remain unchanged

### Requirement: Input Validation

The system MUST validate purchase request data and reject malformed input. The request MUST include a valid `proveedorId`.
(Previously: no proveedorId validation; validated `nuevosProductos` array for duplicate barcodes)

#### Scenario: Missing required fields returns 400

- GIVEN a POST request to `/api/compras/crear` with an empty `items` array
- WHEN the request is processed
- THEN the response returns 400 Bad Request
- AND no data is persisted

#### Scenario: Missing proveedorId returns 400

- GIVEN a request without `proveedorId`
- WHEN processed
- THEN returns 400
- AND no data is persisted

#### Scenario: Inline creation missing required fields returns 400

- GIVEN a POST request with an item that has no `productoId`
- AND the item is missing `codigoBarra` or `nombre`
- WHEN the request is processed
- THEN the response returns 400 Bad Request
- AND no data is persisted
