# Proveedor Specification

## Purpose

Manage supplier (proveedor) entities for purchase tracking, enabling search, creation, and lookup of suppliers linked to purchase orders.

## Requirements

### Requirement: List/Search Proveedores

The system MUST list and search proveedores by `nombre`, `codigo`, or `nroDocumento` via an optional `?search=` query parameter.

**Endpoint:** `GET /api/proveedores`

#### Scenario: Search returns matching proveedores

- GIVEN "Distribuidora Alpha" and "Distribuidora Beta" exist
- WHEN `GET /api/proveedores?search=Alpha`
- THEN only "Distribuidora Alpha" is returned

#### Scenario: Empty search returns all

- GIVEN multiple proveedores exist
- WHEN `GET /api/proveedores` without search parameter
- THEN all proveedores are returned

### Requirement: Create Proveedor

The system MUST create a proveedor accepting `{ nombre, codigo, ... }` and return the created entity.

The system MUST auto-generate `COD_PROVEEDOR` from `NOMBRE`: take first 50 characters, uppercase, trimmed.

**Endpoint:** `POST /api/proveedores`

#### Scenario: Create with valid data

- GIVEN valid proveedor creation data
- WHEN `POST /api/proveedores` with valid fields
- THEN a new proveedor is created
- AND the response includes the created entity with an assigned ID
- AND `COD_PROVEEDOR` is auto-generated from NOMBRE

#### Scenario: Create with duplicate codigo returns 409

- GIVEN a proveedor with `codigo="PROV001"`
- WHEN `POST /api/proveedores` with `codigo="PROV001"`
- THEN returns 409 Conflict

### Requirement: Get Proveedor by ID

The system MUST return a single proveedor by its ID.

**Endpoint:** `GET /api/proveedores/{id}`

#### Scenario: Existing ID returns proveedor

- GIVEN a proveedor with ID 1 exists
- WHEN `GET /api/proveedores/1`
- THEN the proveedor entity is returned with all fields

#### Scenario: Non-existent ID returns 404

- GIVEN no proveedor with ID 999
- WHEN `GET /api/proveedores/999`
- THEN returns 404 Not Found

## Data Contracts

### ProveedorDto

| Field | Type | Description |
|-------|------|-------------|
| `Id` | int | Primary key |
| `Codigo` | string | Auto-generated from NOMBRE |
| `Nombre` | string | Supplier name |
| `Telefono` | string? | Phone number |
| `Domicilio` | string? | Address |
| `Mail` | string? | Email address |

### CrearProveedorRequestDto

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Nombre` | string | Yes | Supplier name |
| `TipoDocumento` | string? | No | Document type |
| `NroDocumento` | string? | No | Document number |
| `Telefono` | string? | No | Phone number |
| `Domicilio` | string? | No | Address |
| `Mail` | string? | No | Email address |
