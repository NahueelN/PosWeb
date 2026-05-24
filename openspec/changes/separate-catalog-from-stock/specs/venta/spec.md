# Delta for venta

## ADDED Requirements

### Requirement: Sale-facing availability truth

The system MUST NOT imply sellable availability from catalog/global product stock in sale-facing search or selection UI. Sale-facing stock indicators SHALL use selected-branch stock or show no availability value when branch-specific stock is not available.

#### Scenario: Branch-aware stock display

- GIVEN the user is selling from Sucursal A
- WHEN product suggestions show availability
- THEN the displayed value comes from Sucursal A branch stock only

#### Scenario: No branch stock value available

- GIVEN the sale UI cannot resolve selected-branch stock for a suggestion yet
- WHEN suggestions are rendered
- THEN the UI does not show global product stock as a sellable quantity

## MODIFIED Requirements

### Requirement: Per-Sucursal Stock Check Before Sale

When creating a venta, the system MUST validate each renglon only against the origin sucursal's `StockSucursal` record before allowing the sale.
(Previously: the spec also required deducting `Producto.STOCK`, which does not match the intended operational truth.)

#### Scenario: Sufficient stock allows sale

- GIVEN Sucursal A has StockSucursal = 10 for Producto X
- WHEN a Venta is created in Sucursal A with cantidad = 3
- THEN the sale is allowed
- AND StockSucursal for (X, A) is deducted to 7

#### Scenario: Insufficient stock blocks sale

- GIVEN Sucursal A has StockSucursal = 2 for Producto X
- WHEN a Venta is created in Sucursal A with cantidad = 5
- THEN the sale MUST be rejected with a clear error
- AND branch stock is not modified

#### Scenario: No stock record for sucursal

- GIVEN Sucursal A has no StockSucursal record for Producto X
- WHEN a Venta is created in Sucursal A with a positive quantity
- THEN the sale MUST be rejected as zero available stock

## REMOVED Requirements

### Requirement: Dual Stock Deduction

(Reason: Sales for this slice use branch stock as the only operational source of truth; global product stock is not sale stock.)
