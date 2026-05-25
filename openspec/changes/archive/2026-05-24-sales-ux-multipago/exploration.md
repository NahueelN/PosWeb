# Exploration: Sales UX Improvements

## Problem

The sales screen (VentasPage) had three UX friction points:

1. **Single payment only**: The original UI accepted only one payment method per sale. Cashiers who needed to split payments (e.g., partial card + partial cash) couldn't do it without workarounds or multiple transactions.
2. **Mouse-only suggestion navigation**: Product search suggestions required clicking with a mouse. Keyboard-only users (common in POS environments) had to tab to suggestions or type the full product name.
3. **No clear payment progress**: The total was at the top of the form, but there was no fixed indicator showing how much was paid, how much remained, and whether the sale could be confirmed.

## Constraints

- Backend already supports multiple payments per sale (`List<PagoVentaDto>` in `POST /api/ventas`)
- Existing `MedioPago` entities with `pagaVuelto` flag (e.g., Efectivo needs cambio/vuelto logic)
- No test framework on frontend — verification via TypeScript build only
- Must work within existing `VentasPage.tsx` component (no routing changes)

## Existing Capabilities

| Capability | Status | Notes |
|-----------|--------|-------|
| Multipago backend | ✅ Already supported | `PagoVentaDto[]` in venta creation |
| MedioPago list | ✅ Already available | `GET /api/medios-pago` |
| Product search | ✅ Already implemented | `GET /api/productos/buscar-venta` |
| Caja verification | ✅ Already implemented | Active cash register check before confirm |
