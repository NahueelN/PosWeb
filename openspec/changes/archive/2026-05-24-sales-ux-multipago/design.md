# Design: Sales UX Multipago

## Technical Approach

Single-file rewrite of `frontend/src/pages/VentasPage.tsx`. No backend changes. All state managed via React hooks (useState, useRef, useEffect).

## Data Flow

### Multipago
```
User selects medio from grid
  → selectedMedio state set
  → pagoMonto auto-filled to restante (or empty if 0)
  → User optionally enters "recibió" conCambio
  → User clicks "Agregar" or presses Enter
  → PaymentEntry added to paymentEntries[]
  → selectedMedio cleared, pagoMonto reset
  → If restante > 0, user can add another payment
  → If restante <= 0 && paymentEntries.length > 0 → confirm button enables
```

### Keyboard Navigation
```
User types query
  → handleQueryChange debounces 200ms
  → API call → suggestions[]
  → User presses ArrowDown → highlightIdx++
  → User presses ArrowUp → highlightIdx--
  → User presses Enter → agregarProducto(sugerencias[highlightIdx])
  → Highlight resets to -1 when suggestions change
```

### Payment Calculations
```
total = sum(item.precio * item.cantidad)
totalPagado = sum(paymentEntry.monto)
restante = max(0, total - totalPagado)
esPagoCompleto = restante <= 0 && paymentEntries.length > 0
```

## Component Structure

Single component `VentasPage` with three steps:
1. **sucursal** — Branch selection (unchanged)
2. **venta** — Main sales screen with search, items, payments, sticky bar
3. **resultado** — Sale result with payment breakdown

## Key Interfaces

```typescript
interface PaymentEntry {
  medioPagoId: number
  medioPagoNombre: string
  monto: number
  conCambio?: number
  pagaVuelto: boolean
}
```

## State Changes

| State | Type | Purpose |
|-------|------|---------|
| `paymentEntries` | `PaymentEntry[]` | Track all payments for current sale |
| `selectedMedio` | `MedioPagoDto \| null` | Currently selected payment method |
| `pagoMonto` | `string` | Amount for the current payment being added |
| `pagoConCambio` | `string` | "Recibió" amount for cambio methods |
| `highlightIdx` | `number` | Currently highlighted suggestion index |
| `total` | computed | Sum of item prices × quantities |
| `totalPagado` | computed | Sum of all payment entry amounts |
| `restante` | computed | Remaining balance to cover |

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/pages/VentasPage.tsx` | Modify | Full rewrite: add multipago, keyboard nav, sticky bar, payment result |

## Testing Strategy

- Frontend: `npx tsc -b` to verify TypeScript compilation
- Backend: no changes needed
- Manual: visual verification of payment flow, keyboard nav, sticky bar
