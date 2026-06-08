# Proposal: PR 2 — Compras & Proveedores

## Intent

Make purchase creation atomic and fully persisted (Compra + RenglonCompra) with proveedor entity refs, user tracking, and matching frontend DTOs.

## Scope

### In Scope
- Atomic CompraService rewrite (IDbContextTransaction, single SaveChanges)
- Compra + RenglonCompra entity instantiation in the flow
- ProveedorId replacing free-text string
- User tracking (ID_USUARIO) on Compra
- Gasto back-link (ID_GASTO) on Compra
- CompraId in response DTO
- ProveedorService + ProveedoresController (list, create, get)
- Frontend: types update, proveedor selector, DTO alignment

### Out of Scope
- Deuda management (PR 3)
- Compra history page / purchase returns

## Capabilities

### New
- `proveedor`: Proveedor CRUD — search, create, get-by-id

### Modified
- `compra`: Atomic creation with proveedor ref, user tracking, full entity persistence.
- `purchases-ux`: Frontend proveedor selector, new DTO shape.
- `frontend-api-client`: Proveedores API methods added.

## Approach

1. **Atomicity**: Wrap flow in `IDbContextTransaction`. Remove mid-operation SaveChanges() — single call at end.
2. **Proveedor**: DTO `proveedor: string` → `proveedorId: int`. New `ProveedorService` + `ProveedoresController`. Register DI.
3. **User tracking**: Pass `userId` from controller (`GetUserId()`) → set `Compra.ID_USUARIO`.
4. **Compra entity**: Instantiate `Compra` with renglones. Assign `ID_GASTO` back. Response includes `compraId`.
5. **Frontend**: Update types. Add proveedor search/select to CompraPage. Wire new API.

## Affected Areas

| Area | Impact |
|------|--------|
| `CompraService.cs` | Rewrite for atomicity + entities |
| `CompraController.cs` | Pass userId, handle new DTO |
| `CompraRequestDto.cs` | `proveedor` → `proveedorId` |
| `CompraResponseDto.cs` | Add `compraId` |
| `ProveedorService.cs` | New |
| `ProveedoresController.cs` | New |
| `Program.cs` | Register ProveedorService |
| `frontend/types/index.ts` | Update DTO types |
| `frontend/api/client.ts` | Add proveedores API |
| `frontend/pages/CompraPage.tsx` | Proveedor selector, new DTO |

## Risks & Mitigation

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing purchases lack Compra records | Low | No migration needed — PR 1 schema exists |
| Frontend/backend DTO drift | Low | Single PR — update both together |
| Missing userId context | Low | Controller has `GetUserId()` |

## Rollback Plan

Revert the merge commit. No migration runs so existing data is safe.

## Dependencies

- PR 1 schema foundation merged (all entities exist)

## Success Criteria

- [ ] `dotnet test PosWeb.sln` passes
- [ ] POST `/api/compras/crear` creates Compra + RenglonCompra records atomically
- [ ] Compra has correct ID_PROVEEDOR, ID_USUARIO, ID_GASTO
- [ ] GET `/api/proveedores` returns list
- [ ] POST `/api/proveedores` creates supplier
- [ ] Frontend shows proveedor selector, sends `proveedorId`, receives `compraId`
- [ ] `npm run lint && npx tsc -b` passes
