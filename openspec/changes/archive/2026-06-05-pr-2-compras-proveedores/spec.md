# Spec: pr-2-compras-proveedores

## compra — Modified

### ADDED Requirements

#### Requirement: Atomic Full-Entity Persistence

The system MUST wrap the creation flow in `IDbContextTransaction`: validate items → create `Compra` (`ID_SUCURSAL`, `ID_PROVEEDOR`, `ID_USUARIO`, `NUMERO_COMPROBANTE`, `TOTAL`, `FECHA_COMPRA`) → create `RenglonCompra` per item → update stock → create `Gasto` linked to active caja → assign `ID_GASTO` back to Compra → single `SaveChanges`. Any failure MUST roll back entirely.

##### Scenario: Transaction rollback on error

- GIVEN a request with 3 items where the third references a non-existent product
- WHEN processed
- THEN no Compra, RenglonCompra, stock changes, or Gasto are persisted
- AND the response returns 400

#### Requirement: Proveedor Reference

The request MUST include `proveedorId: int`. The system MUST validate the provider exists before proceeding.
(Previously: `proveedor: string` free-text)

##### Scenario: Invalid proveedor returns 400

- GIVEN a request with `proveedorId: 9999` and no matching Proveedor
- WHEN processed
- THEN returns 400 Bad Request
- AND no data is persisted

#### Requirement: User Tracking

The controller MUST extract `userId` from JWT context and set `Compra.ID_USUARIO` via `GetUserId()`.

##### Scenario: Compra stores the authenticated user

- GIVEN an authenticated user with ID 5
- WHEN a purchase is created
- THEN `Compra.ID_USUARIO` equals 5

#### Requirement: CompraId in Response

The response MUST include `compraId: int` (the created Compra's primary key).

##### Scenario: Response includes compraId

- GIVEN a successful creation
- WHEN the response is returned
- THEN `compraId` is present and non-zero

#### Requirement: Orphan Gasto Strategy

Existing Gastos without an `ID_COMPRA` MUST remain unchanged. New Gastos MUST always have `ID_COMPRA` set.

##### Scenario: Existing orphan preserved

- GIVEN a Gasto with `ID_COMPRA = NULL` exists from before the change
- WHEN the system runs
- THEN that Gasto is not modified or deleted

### MODIFIED Requirements

#### Requirement: Purchase Creation

The system MUST provide a `POST /api/compras/crear` endpoint that creates a purchase — instantiating `Compra` and `RenglonCompra` entities, increasing stock for each item, and recording a single `Gasto` — in one atomic transaction.

The request MUST include `sucursalId`, `proveedorId`, and `items` array. Each item MUST specify `cantidad` and either `productoId` or inline creation data (`codigoBarra`, `nombre`). An item MAY include `precio` and `costo`.

When `productoId` is 0 or omitted, the system MUST create a new product from inline data. When `precio` or `costo` differs, the system MUST update them.
(Previously: used `proveedor: string`, no Compra entity, no atomic transaction)

##### Scenario: Full entity creation (updated)

- GIVEN an active caja, an existing proveedor, and existing products
- WHEN POST `/api/compras/crear` includes `proveedorId` and valid items
- THEN a Compra row exists with correct ID_PROVEEDOR, ID_USUARIO, ID_SUCURSAL, TOTAL, FECHA_COMPRA
- AND RenglonCompra rows are created for each item
- AND stock increases
- AND a Gasto is created with ID_COMPRA set
- AND response includes `compraId`

##### Scenario: Inline product creation (unchanged)

- GIVEN an active caja and existing proveedor
- WHEN items include inline creation data without `productoId`
- THEN new products are created and their stock increases

##### Scenario: Price/cost update (unchanged)

- GIVEN a product with `precio=100`, `costo=50`
- WHEN an item references it with `precio=120`, `costo=60`
- THEN the product's values are updated

#### Requirement: Input Validation

The system MUST validate purchase request data and reject malformed input. The request MUST include a valid `proveedorId`.
(Previously: no proveedorId validation)

##### Scenario: Empty items returns 400 (unchanged)

- GIVEN a request with an empty `items` array
- WHEN processed
- THEN returns 400

##### Scenario: Missing proveedorId returns 400

- GIVEN a request without `proveedorId`
- WHEN processed
- THEN returns 400
- AND no data is persisted

##### Scenario: Inline creation missing fields returns 400 (unchanged)

- GIVEN an item without `productoId`, `codigoBarra`, or `nombre`
- WHEN processed
- THEN returns 400

---

## proveedor — New

### Requirements

| ID | Description | Endpoint |
|----|-------------|----------|
| PR1 | The system MUST list/search proveedores by `nombre` or `codigo` via optional `?search=` query | `GET /api/proveedores` |
| PR2 | The system MUST create a proveedor accepting `{ nombre, codigo, ... }` — returns the created entity | `POST /api/proveedores` |
| PR3 | The system MUST return a single proveedor by ID | `GET /api/proveedores/{id}` |

#### Scenario: Search returns matching proveedores

- GIVEN "Distribuidora Alpha" and "Distribuidora Beta" exist
- WHEN `GET /api/proveedores?search=Alpha`
- THEN only "Distribuidora Alpha" is returned

#### Scenario: Create with duplicate codigo returns 409

- GIVEN a proveedor with `codigo="PROV001"`
- WHEN `POST /api/proveedores` with `codigo="PROV001"`
- THEN returns 409 Conflict

#### Scenario: Get by non-existent ID returns 404

- GIVEN no proveedor with ID 999
- WHEN `GET /api/proveedores/999`
- THEN returns 404 Not Found

---

## purchases-ux — Modified

### Requirement: Proveedor Selector

The frontend compra form MUST replace the free-text proveedor input with a searchable selector populated from `GET /api/proveedores`.

#### Scenario: Selector loads on page mount

- GIVEN the compra page mounts
- WHEN the form renders
- THEN a `GET /api/proveedores` request fires
- AND results populate a searchable dropdown

#### Scenario: Selector sends proveedorId

- GIVEN a proveedor is selected from the dropdown
- WHEN the form is submitted
- THEN the request includes `proveedorId` (int) instead of `proveedor` (string)

---

## frontend-api-client — Modified

### Requirement: Proveedores API Methods

The API client MUST expose `getProveedores(search?)`, `createProveedor(data)`, and `getProveedor(id)` matching the proveedor endpoints.

#### Scenario: Type definitions align

- GIVEN the frontend types are updated
- WHEN TypeScript compiles
- THEN no type errors exist for the new DTOs

---

## Verification Criteria

- `dotnet test PosWeb.sln` passes
- `npm run lint && npx tsc -b` passes
- POST `/api/compras/crear` creates Compra + RenglonCompra rows atomically (verify DB)
- POST `/api/compras/crear` with non-existent proveedorId returns 400, no partial state
- POST `/api/compras/crear` with inactive caja returns 400, no partial state
- Compra has correct ID_PROVEEDOR, ID_USUARIO, ID_GASTO, ID_SUCURSAL, TOTAL
- GET `/api/proveedores` returns list, respects `?search=`
- POST `/api/proveedores` creates and returns proveedor, rejects duplicate codigo
- Frontend selector sends `proveedorId` (int), response includes `compraId`
