# Design: Single Payment Per Sale

## Technical Approach

Replace multipago array state (`paymentEntries[]`) with a direct single-payment model. The moment a user taps a medio, the payment is ready — no "Agregar pago" intermediate step, no list of added payments, no remaining-balance tracking. Backend receives `pagos[0]` with one element using the existing `PagoVentaDto` contract. **All changes are in `VentasPage.tsx` only.**

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| State shape | A) Keep `paymentEntries[]` + `selectedMedio` | Duplicated concern, more surface for bugs | **B: `selectedMedio` only** — single source of truth, ~100 lines removed |
| Amount visibility | A) Show monto input for all medios | Extra tap for card users who can't change it | **B: Hide for non-vuelto** — auto = total, no input needed |
| Confirm condition | A) `esPagoCompleto()` with balance checks | Legacy from multipago, overcomplicated | **B: `selectedMedio !== null`** — iff medio is set, payment is ready |
| Backend contract | A) New endpoint accepting single payment | Breaking change, backend + frontend work | **B: Send `pagos[0]`** — existing API accepts 1..N elements |

## Data Flow

**Before (multipago):** `selectMedio → fill monto → [Agregar] → paymentEntries[] → getPagosDto() → confirmarVenta()`

**After (single):** `selectMedio → fill monto = total → confirmarVenta()` — `getPagosDto()` returns `[pago]` directly from `selectedMedio`.

## File Changes

| File | Action | Δ |
|------|--------|---|
| `frontend/src/pages/VentasPage.tsx` | Modify | −100 lines net |

No types, no backend, no other files touched.

## State Shape

### Removed (7 items)
- `PaymentEntry` interface — no list to type
- `paymentEntries: useState<PaymentEntry[]>` — replaced by single `selectedMedio`
- `totalPagado` computed — no array to sum
- `restante` computed — no partial payments
- `agregarPago()` / `quitarPago()` — no intermediate add/remove
- `esPagoCompleto()` — replaced by inline `selectedMedio !== null`

### Simplified (3 keepers)
| State | What changes |
|-------|-------------|
| `selectedMedio` | WAS temporary selection → IS the payment itself |
| `pagoMonto` | WAS `restante.toFixed(2)` → `total.toFixed(2)`; hidden for non-vuelto medios |
| `pagoConCambio` | Same behavior — shown only when `selectedMedio.pagaVuelto` |

## Component Changes

### Removed JSX
- "Pagos agregados" list + quitar (X) buttons (~15 lines)
- "Agregar pago" button inside medio panel
- `yaUsado` / `disabled` logic on medio grid buttons — all medios always clickable
- "Falta agregar ${restante}" amber warning

### Modified sticky bar
- **Remove**: `totalPagado`, restante, "Cubierto" / "Faltan" labels
- **Add**: Selected medio name + amount when set
- **Button text**: `Sin caja abierta` / `Seleccioná un medio de pago` / `Confirmar venta`

### Modified `getPagosDto()`
```
if (!selectedMedio) return []
dto = { medioPagoId: selectedMedio.id, monto }
if (pagaVuelto && pagoConCambio > monto) dto.conCambio = pagoConCambio
return [dto]
```

### Simplified `selectMedio(mp)`
`setPagoMonto(total.toFixed(2))` — monto is always the full total now.

### Simplified `confirmarVenta()`
Payment validation: check `!selectedMedio` instead of `pagosDto.length === 0`.
Reset only `selectedMedio`, `pagoMonto`, `pagoConCambio` (no `paymentEntries`).

## Implementation Notes

1. **Medio grid visibility** — always show when `items.length > 0`, no `restante > 0` gate
2. **Non-vuelto medios** (card/transfer) — hide monto input entirely, show medio name + "Monto: $total"
3. **Vuelto medios** (cash) — show Recibió input; monto input can stay hidden (auto = total)
4. **Enter key** — `handlePagoKeyDown` simplified: Enter always calls `confirmarVenta()`
5. **Result screen** — untouched, already renders `pagos[]` of any length with `cambio`
6. **`pagoMontoRef`** — can be removed since monto input is hidden; focus the Recibió input instead if shown
