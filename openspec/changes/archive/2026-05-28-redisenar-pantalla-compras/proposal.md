# Proposal: Redesign Purchases Screen

## Intent

Current `CompraPage` loads ALL products into a grid — unnecessary overhead. The flow mixes scanning with inline forms and confirms everything at once. Replace with item-by-item: scan barcode → resolve (create/update) → confirm.

## Scope

### In Scope
- Item-by-item purchase flow (scan → resolve → add to list)
- Full product creation on unknown barcode (codigo, nombre, precio, costo, talle, cantidad)
- Edit precio/costo when product exists
- Unified item list (no new/existing distinction)
- Backend: merge `items`/`nuevosProductos` into unified `items` array
- Remove old grid + carrito panel

### Out of Scope
- Receipts, purchase history, suppliers, stock warnings

## Capabilities

### New Capabilities
- `purchases-ux`: Frontend purchase flow — scan barcode, inline resolve, unified list, item-by-item confirmation

### Modified Capabilities
- `compra`: Backend endpoint — unify `items`/`nuevosProductos`, support price+cost update per item

## Approach

1. **Backend**: Modify `POST /api/compras/crear` to accept unified `items` where each item can include product data for on-the-fly creation. Remove `nuevosProductos`. Update Precio/Costo on existing products when provided.
2. **Frontend**: Replace `CompraPage.tsx`. Flow: barcode → resolve → form (create/update) → add to list → loop. Single "Confirmar compra" submits all.
3. **Tests**: Update CompraService tests for unified DTO. No frontend tests (no framework).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/pages/compras/CompraPage.tsx` | Removed | Old grid + carrito replaced entirely |
| `src/pages/compras/` | New | New page components for scan-resolve flow |
| `src/api/compras.ts` | Modified | New DTO shape, remove `nuevosProductos` |
| `Contracts/Dtos/CompraRequestDto.cs` | Modified | Unify `items`/`nuevosProductos` |
| `Application/Services/CompraService.cs` | Modified | Price+cost update, unified items |
| `Controllers/ComprasController.cs` | Modified | Adjust for new DTO |
| `openspec/specs/compra/spec.md` | Modified | Delta spec for endpoint |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing purchase history uses old DTO | Low | Old payload stored as JSON, backward compatible |
| Price/cost update conflicts with concurrent ops | Low | EF Core concurrency token on Producto |

## Rollback Plan

1. `git checkout HEAD -- src/pages/compras/ src/PosWeb.Contracts/Dtos/ src/Application/Services/ src/Controllers/ openspec/specs/compra/spec.md`

## Dependencies

- Active caja validation exists (no change needed)

## Success Criteria

- [ ] Barcode scan resolves product (create if new, show form if exists)
- [ ] Price and cost can be modified during purchase
- [ ] Unified item list shows all items indistinctly
- [ ] Old grid page no longer exists
- [ ] All backend tests pass (`dotnet test`)
- [ ] Frontend compiles with no TS errors (`npx tsc -b`)
