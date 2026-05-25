# Proposal: Single Payment Per Sale

## Intent

Remove multipago complexity from VentasPage.tsx. Each sale uses exactly one payment method — the array state, "Agregar pago" button, and "ya agregado" disabled logic are unnecessary for this POS.

## Scope

### In Scope
- Rewrite payment flow in `VentasPage.tsx`: select one medio → auto-fills monto = total → optional Recibió for cash → confirm
- Remove `paymentEntries[]` array, `selectedMedio`, `pagoMonto`, `pagoConCambio` and all related logic
- Remove "Pagos agregados" list, "Agregar pago" button, "ya agregado" disabled state
- Update sticky bar confirm logic: ready when a medio is selected
- Send `pagos: [{ medioPagoId, monto, conCambio }]` — one element, existing API contract
- Update spec `venta-ux` REQ-01 to reflect single-payment behavior
- Result screen (REQ-05) stays unchanged

### Out of Scope
- Backend changes — API already accepts `pagos[]` of any length
- Types (`PagoVentaDto`, `VentaDto`) — no changes
- Other pages, components, or test infrastructure

## Capabilities

### New Capabilities
None — simplification of an existing capability.

### Modified Capabilities
- `venta-ux`: REQ-01 changes from "allow multiple payment methods" to "exactly one per sale". REQ-02 (vuelto) applies inline to the selected medio. REQ-04 sticky bar logic updates. REQ-05 unchanged.

## Approach

1. Collapse payment state: replace `paymentEntries[]` with `selectedMedio: MedioPagoDto | null`
2. Selecting a medio sets monto = total immediately
3. For `pagaVuelto: true` medios, show Recibió field inline; on confirm, compute cambio in DTO
4. Confirm button active when: `cajaActiva && selectedMedio !== null && items.length > 0`
5. Sticky bar shows selected medio + amount instead of pagos list + remaining
6. `getPagosDto()` returns one-element array

## Affected Areas

| Area | Impact |
|------|--------|
| `frontend/src/pages/VentasPage.tsx` | Modified — ~120 lines removed |
| `openspec/specs/venta-ux/spec.md` | Modified — REQ-01 delta |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Vuelto edge case missed | Low | Only Efectivo has pagaVuelto; single-payment flow is simpler |
| Result screen regression | Low | Reads from API response, no frontend payment logic |
| Confirm button disabled state | Low | Single condition: `cajaActiva && selectedMedio` |

## Rollback Plan

Revert `VentasPage.tsx` and spec via `git checkout` — single file change.

## Dependencies

None.

## Success Criteria

- [ ] Sale with one payment: select medio → amount auto-fills → confirm → registered
- [ ] Vuelto works — Efectivo shows Recibió field, cambio in result
- [ ] Sticky bar shows confirm-ready when medio selected and total covered
- [ ] Backend receives `pagos` with exactly one element per sale
- [ ] All backend tests pass (`dotnet test`)
