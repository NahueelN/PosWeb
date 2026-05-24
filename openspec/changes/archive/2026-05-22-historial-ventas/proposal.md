# Proposal: Historial de Ventas

## Intent

Users can create sales but have zero visibility into past transactions. Add a read-only history view with filters and line-item detail.

## Scope

### In Scope
- `GET /api/ventas` with date-range, sucursal filters, cursor pagination
- Sales list: id, date, sucursal name, item count, total
- Expandable line items: product name, quantity, unit price, subtotal
- `/historial` frontend page with filter bar and paginated table

### Out of Scope
- Payment tracking, void/cancel, PDF/Excel export, customers, real-time

## Capabilities

### New Capabilities
- `historial-ventas`: Read-only sales history with filters, pagination, and line-item detail

### Modified Capabilities
- `venta`: Add query capability — spec currently covers creation only

## Approach

New `GET /api/ventas` on existing `VentasController`. Manual joins in query (no nav properties added to domain). Frontend: separate `/historial` page alongside POS `/ventas`.

### Key Decisions

| Decision | Option A (recommended) | Option B | Why |
|---|---|---|---|
| **Route** | Separate `/historial` | Tab within `/ventas` | `/ventas` is multi-step POS. Separate route keeps both clean. |
| **Detail** | Inline expand (eager-loaded) | Separate detail endpoint | Sales are small (1-10 items). Eager load avoids N+1. |
| **Nav props** | Manual joins in query | Add `[ForeignKey]` to domain | Domain entities lack FK navs. Manual joins keep them clean. |
| **Pagination** | Cursor-based (id + take) | Offset (skip/take) | Append-only data; cursor avoids drift mid-browse. |

## Affected Areas

| Area | Impact |
|---|---|
| `PosWeb.Contracts/VentaDto.cs` | Add `VentaListadoDto`, `VentaDetalleDto` |
| `PosWeb/Controllers/VentasController.cs` | Add `GET /api/ventas` |
| `PosWeb/Application/Ventas/VentaService.cs` | Add `ListarVentas()` |
| `frontend/src/types/index.ts` | Add history types |
| `frontend/src/api/client.ts` | Add `ventas.listar()` |
| `frontend/src/pages/HistorialPage.tsx` | New |
| `frontend/src/components/Layout.tsx` | Add nav link |
| `frontend/src/App.tsx` | Add route |

## Risks

| Risk | Mitigation |
|---|---|
| Product name lookups per item slow query | Single join, no N+1 |
| Cursor pagination unfamiliar to FE | Simple: pass `after` (last id) + `take`; response has `nextCursor` |
| Existing `venta` spec needs read updates | Add delta spec |

## Rollback Plan

Revert `GET` action, delete `HistorialPage.tsx` + route, remove nav link. No migration — purely additive.

## Dependencies

None. Reads existing `VENTAS` and `RENGLONES_VENTA` tables.

## Success Criteria

- [ ] `GET /api/ventas?desde=...&hasta=...&sucursalId=1&after=0&take=20` returns 200 with paginated results
- [ ] Each sale shows: id, date, sucursal name, item count, total
- [ ] Expanding a row shows line items with product name, quantity, price, subtotal
- [ ] `/historial` page renders with working filters and pagination
- [ ] Existing `POST /api/ventas` unchanged
