# Delta for Deuda

## MODIFIED Requirements

### Requirement: Automatic Debt Creation on Purchase

The system MUST create a Deuda record when a Compra is created, with `MONTO_PAGADO` initialized to the amount paid (if any). The debt is created within the same database transaction as the compra.
(Previously: always created with MONTO_PAGADO not tracked, PAGO=false)

#### Scenario: Purchase creates supplier debt with partial payment tracking

- GIVEN a compra is created for a proveedor with montoPagado=5000 and total=15000
- WHEN the compra is saved
- THEN a Deuda record is created with MONTO_DEUDA=15000, MONTO_PAGADO=5000, PAGO=false, linking the proveedor and compra

### Requirement: Register Payment (partial payment support)

The system MUST allow registering payments against a debt. The endpoint `POST /api/deudas/{id}/pagar` MUST accept an optional `monto` parameter in the request body.

When `monto` is provided, the system MUST add it to `MONTO_PAGADO`. If the resulting `MONTO_PAGADO >= MONTO_DEUDA`, the debt is marked as paid (`PAGO = true`, `FECHA_PAGO = current timestamp`). If partial, `PAGO` remains false.

When `monto` is omitted, the system MUST mark the debt as fully paid (equivalent to monto = remaining balance).
(Previously: always paid the full remaining amount, no monto parameter)

#### Scenario: Full payment via POST /pagar

- GIVEN a debt with ID 42 is unpaid, MONTO_DEUDA=15000, MONTO_PAGADO=5000
- WHEN `POST /api/deudas/42/pagar` with body `{ "monto": 10000 }`
- THEN MONTO_PAGADO becomes 15000
- AND PAGO is set to true with current timestamp

#### Scenario: Partial payment leaves debt unpaid

- GIVEN a debt with ID 42 is unpaid, MONTO_DEUDA=15000, MONTO_PAGADO=0
- WHEN `POST /api/deudas/42/pagar` with body `{ "monto": 5000 }`
- THEN MONTO_PAGADO becomes 5000
- AND PAGO remains false

#### Scenario: Pay already fully paid debt

- GIVEN a debt with ID 42 is already paid (MONTO_PAGADO >= MONTO_DEUDA)
- WHEN `POST /api/deudas/42/pagar` with any monto
- THEN the response returns 409 Conflict

#### Scenario: Register payment without monto (full remaining)

- GIVEN a debt with ID 42, MONTO_DEUDA=15000, MONTO_PAGADO=3000
- WHEN `POST /api/deudas/42/pagar` without monto param
- THEN MONTO_PAGADO becomes 15000
- AND PAGO is set to true

## ADDED Requirements

### Requirement: DeudaDto includes MONTO_PAGADO

The response DTO MUST include `montoPagado` and `saldoPendiente` fields computed as MONTO_PAGADO and (MONTO_DEUDA - MONTO_PAGADO) respectively.

#### Scenario: Deuda response shows partial payment status

- GIVEN a debt with MONTO_DEUDA=15000, MONTO_PAGADO=5000
- WHEN `GET /api/deudas/42`
- THEN the response includes montoPagado=5000 and saldoPendiente=10000
