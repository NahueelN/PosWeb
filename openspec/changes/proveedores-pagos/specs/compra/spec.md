# Delta for Compra

## MODIFIED Requirements

### Requirement: Automatic Debt Creation

The system MUST create a Deuda record when a Compra is created. The Deuda links to the Proveedor and the Compra, with the debt amount equal to the compra's total gasto MINUS any amount paid at time of purchase. The debt is created as unpaid (or partially paid) within the same database transaction as the compra.

The request MAY include `montoPagado: decimal?` — if provided, the system MUST register a payment for that amount against the deuda. If `montoPagado` equals `totalGasto`, the deuda is fully paid. If `montoPagado` is between 0 and `totalGasto`, the deuda is partially paid, and `MONTO_PAGADO` on the Deuda is set to `montoPagado`, with `PAGO` remaining false until the full amount is covered. If `montoPagado` is omitted or 0, the full amount is registered as unpaid debt.
(Previously: always created a full unpaid deuda with no payment option)

#### Scenario: Purchase creates unpaid supplier debt (no payment)

- GIVEN a compra is created for a proveedor with total $15,000
- WHEN the compra request does not include `montoPagado`
- THEN a Deuda record is created with MONTO_DEUDA = 15000, MONTO_PAGADO = 0, ID_PROVEEDOR = the proveedor, ID_COMPRA = the new compra, PAGO = false

#### Scenario: Purchase with full payment

- GIVEN a compra is created for a proveedor with total $15,000
- WHEN the compra request includes `montoPagado: 15000`
- THEN a Deuda record is created with MONTO_DEUDA = 15000, MONTO_PAGADO = 15000, PAGO = true, FECHA_PAGO = current timestamp

#### Scenario: Purchase with partial payment

- GIVEN a compra is created for a proveedor with total $15,000
- WHEN the compra request includes `montoPagado: 5000`
- THEN a Deuda record is created with MONTO_DEUDA = 15000, MONTO_PAGADO = 5000, PAGO = false
- AND the deuda has a pending balance of $10,000
