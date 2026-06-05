# Deuda Specification

## Purpose

Define the debt tracking and payment system for supplier purchases.

## Requirements

### Requirement: List Debts

The system MUST allow listing debts filtered by proveedor and payment status.

#### Scenario: List unpaid debts for a proveedor

- GIVEN proveedor 5 has 3 unpaid debts
- WHEN `GET /api/deudas?proveedorId=5&soloPendientes=true`
- THEN the response includes all 3 debts with amounts, dates, proveedor name, and compra references

#### Scenario: List all debts

- GIVEN debts exist for multiple proveedores
- WHEN `GET /api/deudas`
- THEN the response includes all debts with proveedor names

### Requirement: Get Debt by ID

The system MUST allow retrieving a single debt by its ID, including the proveedor name.

#### Scenario: Get existing debt

- GIVEN a debt with ID 42 exists
- WHEN `GET /api/deudas/42`
- THEN the response includes the full debt details with proveedor name

#### Scenario: Get non-existent debt

- GIVEN no debt with ID 999 exists
- WHEN `GET /api/deudas/999`
- THEN the response returns 404

### Requirement: Register Payment

The system MUST allow marking a debt as paid. The debt's PAGO flag is set to true and FECHA_PAGO is recorded as the current timestamp.

#### Scenario: Pay an unpaid debt

- GIVEN a debt with ID 42 is unpaid
- WHEN `POST /api/deudas/42/pagar`
- THEN the debt is marked as paid with current timestamp

#### Scenario: Pay already paid debt

- GIVEN a debt with ID 42 is already paid
- WHEN `POST /api/deudas/42/pagar`
- THEN the response returns 409 Conflict

### Requirement: Automatic Debt Creation on Purchase

The system MUST create a Deuda record when a Compra is created. The debt is created within the same database transaction as the compra.

#### Scenario: Purchase creates supplier debt

- GIVEN a compra is created for a proveedor
- WHEN the compra is saved
- THEN a Deuda record is created linking the proveedor and compra with the total amount
