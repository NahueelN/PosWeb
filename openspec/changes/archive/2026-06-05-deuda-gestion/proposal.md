# Proposal: Gestión de Deuda

## Intent

Implement debt tracking for supplier purchases (proveedor) with automatic debt creation on Compra, manual payment registration, and a frontend management page. This completes the `FT_compras-proveedores-deuda` branch by wiring the Deuda entity into the purchase flow.

## Scope

### In Scope
- **DeudaService**: Listar (por proveedor, estado pago/no pago), ObtenerPorId, RegistrarPago
- **Automatic debt creation**: When `CompraService.CrearCompra` succeeds, create a Deuda record for the proveedor with the compra's total
- **DeudaController**: API endpoints for listing and payment
- **DTOs**: DeudaDto, RegistrarPagoRequestDto
- **Frontend**: Deuda page with proveedor filter, paid/unpaid toggle, payment button
- **Tests**: DeudaService unit tests (InMemory EF Core)

### Out of Scope
- Client debt from Ventas (entity supports it, but focus is proveedor debt)
- Partial payments or payment plans
- Debt aging reports
- Automatic debt cancellation

## Capabilities

### New Capabilities
- `deuda`: debt tracking and payment for supplier purchases

### Modified Capabilities
- `compra`: automatic Deuda creation during purchase flow

## Approach

1. **Backend**: New `DeudaService` with Listar, ObtenerPorId, RegistrarPago. Inject into `CompraService` for automatic debt creation.
2. **Frontend**: New `DeudaPage` under the Compras tab showing proveedor debts with filter and payment actions.
3. **No schema changes**: The Deuda entity, table, and relationships are already in place from PR 1.

## Dependencies

- PR 1 (schema-foundation): ✅ Deuda entity and table exist
- PR 2 (compras-proveedores): ✅ CompraService and ProveedorService exist
