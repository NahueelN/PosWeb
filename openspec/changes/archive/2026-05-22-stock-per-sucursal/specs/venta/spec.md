# Delta for Venta

**Note**: No existing `openspec/specs/venta/spec.md` found. This delta defines the new per-sucursal stock check and deduction behavior added to the venta capability.

## ADDED Requirements

### Requirement: Per-Sucursal Stock Check Before Sale

When creating a venta, the system MUST validate that each renglon (line item) has sufficient stock in the origin sucursal's StockSucursal record BEFORE allowing the sale.

#### Scenario: Sufficient stock allows sale

- GIVEN Sucursal A has StockSucursal = 10 for Producto X
- WHEN a Venta is created in Sucursal A with a renglon of Producto X, cantidad = 3
- THEN the sale is allowed
- AND StockSucursal for (X, A) is deducted to 7
- AND Producto.STOCK (global) is also deducted by 3

#### Scenario: Insufficient stock blocks sale

- GIVEN Sucursal A has StockSucursal = 2 for Producto X
- WHEN a Venta is created in Sucursal A with a renglon of Producto X, cantidad = 5
- THEN the sale MUST be rejected with a clear error
- AND the error MUST indicate: sucursal, producto, available stock, requested quantity
- AND neither StockSucursal nor Producto.STOCK are modified

#### Scenario: No stock record for sucursal

- GIVEN Sucursal A has no StockSucursal record for Producto X
- WHEN a Venta is created in Sucursal A with a renglon of Producto X
- THEN the sale MUST be rejected (available = 0, requested > 0)

### Requirement: Dual Stock Deduction

When a venta is confirmed, the system MUST deduct from both Producto.STOCK (global) AND StockSucursal (per-sucursal) for each renglon.

#### Scenario: Deduction in service layer

- GIVEN a sale is confirmed for Producto X, cantidad = 3 in Sucursal A
- WHEN the VentaService processes the sale
- THEN StockSucursal for (X, A) decreases by 3
- AND Producto.STOCK for X decreases by 3
- AND the deduction logic lives in VentaService, not in domain entities
