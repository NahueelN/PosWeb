# Proposal: Compras Tab

## Intent

Add a Compras (Purchases) tab to the POS for tracking product purchases as stock increases with associated expense records, integrated with the existing cierre workflow.

## Scope

### In Scope
- New `/api/compras` endpoint with CreateCompra action (stock increase + Gasto recording in one transaction)
- New `Gasto` entity in Domain layer + EF Core migration
- New `CompraPage` frontend with product search, quantity/costo inputs, and confirm
- Keyboard shortcut F6 bound to `/compras` route
- `CierrePreviewDto` extended with `TotalGastos` aggregated from Gasto records
- Quick product creation from compra flow via `nuevosProductos` array

### Out of Scope
- Auto-updating `Producto.COSTO` from purchase cost
- Purchase returns/refunds
- Stock validation before purchase (purchases always add stock)
- Gasto editing or deletion
- Purchase history, reports, or paginated querying

## Capabilities

### New Capabilities
- `compra`: Purchase creation with atomic stock increase + gasto recording

### Modified Capabilities
None — behavior changes are additive (new endpoint, new entity). Existing specs unchanged.

## Approach

Single `CompraController` with `POST /api/compras/crear`. The API accepts `{ sucursalId, items[{ productoId, cantidad, costo }], nuevosProductos[] }`.

`CompraService` orchestrates in a single EF transaction:
1. Create or resolve productos (from `nuevosProductos` if barcode not found)
2. For each item: call `StockSucursalService.AumentarStock(productoId, sucursalId, cantidad)`
3. Compute total costo, create a `Gasto` record referencing `ID_CAJA` (active caja)
4. Commit

Frontend (`CompraPage`) mirrors `VentasPage` layout: search grid, cart panel, confirm with keyboard nav. Stock is read-only display (no inline edit).

`CajaService.ObtenerPreviewCierre()` adds `SUM(Gasto.MONTO) WHERE ID_CAJA = active` to the preview DTO.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/Domain/Entities/Gasto.cs` | New | Gasto entity (ID_CAJA, MONTO, FECHA, DETALLE) |
| `src/Domain/.../StockSucursal.cs` | Unchanged | Reuses `AumentarStock()` |
| `src/Application/Services/CompraService.cs` | New | Orchestrates transaction |
| `src/Application/Services/StockSucursalService.cs` | Modified | May need `AumentarStock` for upsert path |
| `src/API/Controllers/CompraController.cs` | New | POST /api/compras/crear |
| `src/API/Controllers/CajaController.cs` | Modified | Preview includes total gastos |
| `src/Contracts/Dtos/...` | New | CompraRequest/Response DTOs |
| `src/Infraestructure/Config/GastoConfig.cs` | New | EF config for Gasto |
| `Infraestructure/Migrations/` | New | Migration for Gasto table |
| `frontend/src/pages/CompraPage.tsx` | New | Purchase screen |
| `frontend/src/api/...` | New | compras client API |
| `frontend/src/Layout.tsx` | Modified | Add /compras nav link, F6 shortcut |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Transaction fails mid-way | Low | Single `SaveChanges` in EF transaction; stock and gasto commit atomically |
| No active caja when purchasing | Med | Return 400 with clear error; frontend shows "no hay caja abierta" |
| Duplicate barcode in nuevosProductos | Low | Backend validates uniqueness before insert; returns 409 on conflict |

## Rollback Plan

1. Revert `CajaService.ObtenerPreviewCierre()` changes
2. Remove `CompraController` and `CompraService`
3. Remove `Gasto` entity and EF config
4. Revert migration: `dotnet ef migrations remove`
5. Revert frontend: delete `CompraPage`, remove nav link and shortcut

## Dependencies

- Active `Caja` must exist for the sucursal at time of purchase (gasto linking)

## Success Criteria

- [ ] `POST /api/compras/crear` with valid items returns 200, stock increased, Gasto record created
- [ ] `POST /api/compras/crear` with no active caja returns 400
- [ ] `GET /api/caja/preview/{id}` includes `totalGastos` field with accumulated purchase gastos
- [ ] CompraPage renders product grid, cart panel, and confirm button; F6 navigates to /compras
- [ ] `dotnet test` passes; `npm run lint && npx tsc -b` passes
