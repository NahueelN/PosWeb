# Proposal: Separate Catalog from Stock

## Intent

Product APIs and UI still mix catalog data with operational stock, so product creation implies inventory, sales show misleading availability, and product edits can reset `Producto.STOCK`. This slice makes products catalog-only and makes branch stock the visible operational truth.

## Goals / Non-Goals

### In Scope
- Remove stock capture from product create/edit flow.
- Redirect post-create workflow toward explicit branch stock initialization.
- Make `/stock` show the active catalog for a branch, including products without existing `StockSucursal` rows.
- Stop showing misleading global/catalog stock in product and sales UX.

### Out of Scope
- Dropping `PRODUCTOS.STOCK` or doing a full schema cleanup.
- Transfers, purchases, reservations, or inventory reporting.
- Historical backfill/reconciliation from global stock values.

## Capabilities

### New Capabilities
- `producto-catalogo`: Products can be created and maintained without stock fields, as catalog records only.

### Modified Capabilities
- `stock-sucursal`: Branch stock query/edit flows include products with no existing stock row and allow initialization from zero.
- `venta`: Sale-facing availability must align with branch stock, not `Producto.STOCK`.

## Scope Boundaries for Slice 1

- Change request/response contracts used by product create/edit so stock is not part of catalog maintenance.
- Update stock-page read model/API so selected-branch stock is listed for all active products.
- Update product/sales UI to remove or replace misleading stock badges sourced from `ProductoDto.stock`.
- Keep sale validation/deduction on `StockSucursal` unchanged.

## High-Level Approach

Use a compatibility-first split: keep legacy `PRODUCTOS.STOCK` stored temporarily, but stop treating it as operational truth. Introduce catalog-only product flows, branch-centric stock initialization, and UI/read-model changes that expose zero or uninitialized branch stock clearly.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `PosWeb.Contracts/ProductoDto.cs` | Modified | Separate catalog maintenance from stock payloads |
| `PosWeb/Application/Productos/ProductoService.cs` | Modified | Stop reading/writing stock in create/edit flows |
| `PosWeb/Application/StockSucursal/StockSucursalService.cs` | Modified | List full active catalog per branch |
| `frontend/src/pages/ProductosPage.tsx` | Modified | Remove stock from product form; guide to stock setup |
| `frontend/src/pages/StockPage.tsx` | Modified | Initialize/edit branch stock for visible catalog products |
| `frontend/src/pages/VentasPage.tsx` | Modified | Remove misleading global stock display |

## Risks / Migration Notes

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Products become unsellable until branch stock is initialized | High | Explicit post-create path and visible zero/uninitialized rows |
| Shared DTO changes break multiple screens | Med | Split contracts carefully and regression-test create/edit/search |
| Legacy global stock remains ambiguous | Med | Treat as compatibility-only and defer removal to a later change |

## Why Not Keep Stock in Product Creation

Keeping stock in product creation preserves a false model: inventory is branch-specific, but creation is catalog-wide. It keeps UX and API semantics misleading, hides uninitialized branch stock, and reinforces a field sales does not actually trust.

## Rollback Plan

Restore stock fields in product create/edit contracts and revert stock-page/query UI changes.

## Dependencies

None.

## Success Criteria

- [ ] Products can be created/edited without stock input.
- [ ] New products are visible in branch stock UI even before initialization.
- [ ] Sales/product screens no longer imply availability from `Producto.STOCK`.
- [ ] Existing branch-stock sale validation behavior remains unchanged.
