# Proposal: Stock por Sucursal

## Intent

Producto.STOCK is global: selling at Sucursal A reduces stock for all sucursales. Wrong for multi-branch. Track per sucursal instead.

## Scope

### In Scope
- `StockSucursal` entity with composite key (ID_PRODUCTO, ID_SUCURSAL)
- `STOCK_POR_SUCURSAL` table via EF Core migration
- Stock query/adjust/low-stock API + controller
- Deduct per-sucursal stock on sale
- Frontend stock page by sucursal

### Out of Scope
- Historical stock recalculation from ventas (start at 0)
- Removing global Producto.STOCK (kept as total inventory)
- Purchase orders, transfers between sucursales
- Stock reservations or holds

## Capabilities

### New
- `stock-sucursal`: Query, adjust, and low-stock alerts per sucursal

### Modified
- `venta`: Deduct stock from origin sucursal

## Approach

**Recommended: Option B — Service-layer.**

A — Domain entity with methods. StockSucursal owns DescontarStock/AumentarStock. Venta.AgregarRenglon takes StockSucursal. DDD-pure but couples domain entities.

B — VentaService loads StockSucursal, validates, deducts. StockSucursal is data-only. Zero domain coupling, minimal blast radius. **(RECOMMENDED)**

C — Extend AgregarRenglon with ID_SUCURSAL param, deduct inside domain. Correct but needs repo access in domain — architectural shift.

**Why B**: Same correctness, less risk. Enrich later.

### Migration
Fresh — all stock=0. UI enforces initial entry.

### UI
New `/stock` page: sucursal selector + editable grid. Low-stock badge in ProductosPage filtered by selected sucursal.

## Affected Areas

| Area | Impact |
|------|--------|
| `PosWeb.Domain/StockSucursal.cs` | New |
| `PosWeb.Domain/Exceptions/` | 1-2 new |
| `PosWeb.Contracts/StockSucursalDto.cs` | New |
| `PosWeb/Data/PosDbContext.cs` | DbSet + config |
| `PosWeb/Application/StockSucursalService.cs` | New |
| `PosWeb/Controllers/StockController.cs` | New |
| `PosWeb/Application/Ventas/VentaService.cs` | Per-sucursal deduction |
| `PosWeb/Program.cs` | Register service |
| `frontend/src/types/index.ts` | New type |
| `frontend/src/api/client.ts` | Stock methods |
| `frontend/src/pages/StockPage.tsx` | New |
| `frontend/src/App.tsx` | /stock route |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| No historical per-sucursal stock | High | Accept starting at 0 |
| Dual stock confusion | Med | Doc: global = total inventory |

## Rollback

Revert migration, restore global STOCK deduction. Remove frontend route/page.

## Dependencies

None.

## Success Criteria

- [ ] Query stock by (productoId, sucursalId) correct
- [ ] Sale deducts origin sucursal only
- [ ] Other sucursales unaffected
- [ ] Low-stock endpoint returns correct products
- [ ] dotnet test passes
- [ ] npx tsc -b passes

## Effort

| Layer | Estimate |
|-------|----------|
| Domain | Low — 1 entity + exceptions |
| Backend | Medium — service, controller, DbContext, migration |
| Frontend | Medium — new page + API client + route |
