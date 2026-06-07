# Spec: Gestión de Deuda

## compra — Modified

### ADDED Requirements

#### Requirement: Automatic Debt Creation on Purchase

The system MUST create a Deuda record automatically when a Compra is created for a proveedor.

- The Deuda record links to the Proveedor via `ID_PROVEEDOR` and to the Compra via `ID_COMPRA`
- The debt amount equals the Compra's total gasto
- Debt is created as unpaid (`PAGO = false`) with current timestamp
- If the compra has no proveedor (`proveedorId = 0`), no Deuda is created

##### Scenario: Compra with proveedor creates debt

- GIVEN a compra is created with proveedorId = 5 and total = $15,000
- WHEN the compra is saved successfully
- THEN a Deuda record is created with MONTO_DEUDA = 15000, ID_PROVEEDOR = 5, ID_COMPRA = {compraId}, PAGO = false

##### Scenario: Compra without proveedor creates no debt

- GIVEN a compra is created with proveedorId = 0
- WHEN the compra is saved successfully
- THEN no Deuda record is created

## deuda — New

### Requirements

#### Requirement: List Debts by Proveedor

The system MUST allow listing debts filtered by proveedor and payment status.

##### Scenario: List unpaid debts for a proveedor

- GIVEN proveedor 5 has 3 unpaid debts
- WHEN `GET /api/deudas?proveedorId=5&soloPendientes=true`
- THEN the response includes all 3 debts with their amounts, dates, and compra references

##### Scenario: List all debts for a proveedor

- GIVEN proveedor 5 has both paid and unpaid debts
- WHEN `GET /api/deudas?proveedorId=5`
- THEN the response includes all debts for that proveedor

##### Scenario: List all debts across all proveedores

- GIVEN debts exist for multiple proveedores
- WHEN `GET /api/deudas`
- THEN the response includes all debts with proveedor names

#### Requirement: Get Debt by ID

The system MUST allow retrieving a single debt by its ID.

##### Scenario: Get existing debt

- GIVEN a debt with ID 42 exists
- WHEN `GET /api/deudas/42`
- THEN the response includes the full debt details with proveedor name and compra reference

##### Scenario: Get non-existent debt

- GIVEN no debt with ID 999 exists
- WHEN `GET /api/deudas/999`
- THEN the response returns 404

#### Requirement: Register Payment

The system MUST allow marking a debt as paid.

##### Scenario: Pay an unpaid debt

- GIVEN a debt with ID 42 is unpaid
- WHEN `POST /api/deudas/42/pagar`
- THEN the debt is marked as PAGO = true with FECHA_PAGO = now
- AND the response returns the updated debt

##### Scenario: Pay an already paid debt

- GIVEN a debt with ID 42 is already paid
- WHEN `POST /api/deudas/42/pagar`
- THEN the response returns 409 Conflict with message "La deuda ya fue pagada"

##### Scenario: Pay non-existent debt

- GIVEN no debt with ID 999 exists
- WHEN `POST /api/deudas/999/pagar`
- THEN the response returns 404
