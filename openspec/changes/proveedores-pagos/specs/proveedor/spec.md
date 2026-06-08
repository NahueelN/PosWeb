# Delta for Proveedor

## MODIFIED Requirements

### Requirement: Update Proveedor

The system MUST provide a `PUT /api/proveedores/{id}` endpoint to update an existing proveedor. The endpoint accepts the same fields as `POST` (nombre, tipoDocumento, nroDocumento, telefono, domicilio, mail). The nombre update MUST regenerate COD_PROVEEDOR from the new nombre.

If the proveedor doesn't exist, the endpoint MUST return 404.

#### Scenario: Update existing proveedor

- GIVEN a proveedor with ID 1 exists with nombre "Distribuidora Alpha"
- WHEN `PUT /api/proveedores/1` with `{ "nombre": "Distribuidora Beta" }`
- THEN the proveedor's nombre is updated to "Distribuidora Beta"
- AND COD_PROVEEDOR is updated accordingly
- AND the response returns 200 with the updated entity

#### Scenario: Update non-existent proveedor

- GIVEN no proveedor with ID 999 exists
- WHEN `PUT /api/proveedores/999`
- THEN returns 404 Not Found

### Requirement: Get Proveedor by ID (extended with debt info)

The system MUST return a single proveedor by its ID, including the total pending debt (`deudaPendiente`) computed as the sum of unpaid deuda amounts for that proveedor.
(Previously: no debt information in proveedor response)

#### Scenario: Existing ID returns proveedor with debt info

- GIVEN a proveedor with ID 1 has $20,000 in unpaid debts
- WHEN `GET /api/proveedores/1`
- THEN the proveedor entity is returned with all fields
- AND `deudaPendiente` equals 20000

### ProveedorDto (updated)

| Field | Type | Description |
|-------|------|-------------|
| `Id` | int | Primary key |
| `Codigo` | string | Auto-generated from NOMBRE |
| `Nombre` | string | Supplier name |
| `TipoDocumento` | string? | Document type |
| `NroDocumento` | string? | Document number |
| `Telefono` | string? | Phone number |
| `Domicilio` | string? | Address |
| `Mail` | string? | Email address |
| `Activo` | bool | Whether supplier is active |
| `DeudaPendiente` | decimal | Total unpaid debt amount |

(Previously: no DeudaPendiente, no TipoDocumento, NroDocumento, Activo in spec)
