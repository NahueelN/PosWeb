# Tasks: Compras Scanner UX

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~400-500 |
| 400-line budget risk | Low-Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (1 file rewrite + 1 CSS file) |
| Delivery strategy | single-pr-default |
| Chain strategy | N/A |

Decision needed before apply: No

---

## Task Dependencies

```
T1 â”€â†’ T2 â”€â†’ T3 â”€â†’ T4 â”€â†’ T5
                       â”‚
                       â””â”€â†’ T6
```

---

## Task 1.1: Extract Pure Reducer + Define State

**Depends on:** Nothing  
**Estimate:** ~15 min  
**Testing:** Extract and unit-test the reducer with Vitest

### What to do

1. Inside `CompraPage.tsx` (or a new file `compraReducer.ts`), define:

```typescript
type Step = 'scan' | 'confirm' | 'done'

interface CartItem {
  productoId: number
  productoNombre: string
  codigoBarra: string
  cantidad: number
  costoUnitario: number
  subtotal: number
}

interface CompraState {
  step: Step
  cart: CartItem[]
  nuevosProductos: NuevoProductoDto[]
  searchTerm: string
  cantidad: number
  error: string | null
  success: CompraResponseDto | null
  verified: boolean
  lastScanned: { barcode: string; time: number } | null
  sucursalId: number
}

type CompraAction =
  | { type: 'SET_STEP'; step: Step }
  | { type: 'ADD_PRODUCT'; productoId: number; nombre: string; codigoBarra: string; costo: number; cantidad: number }
  | { type: 'REMOVE_FROM_CART'; index: number }
  | { type: 'UPDATE_CANTIDAD_CART'; index: number; cantidad: number }
  | { type: 'SET_SEARCH_TERM'; term: string }
  | { type: 'SET_CANTIDAD'; cantidad: number }
  | { type: 'SET_VERIFIED'; verified: boolean }
  | { type: 'CONFIRM_SUCCESS'; response: CompraResponseDto }
  | { type: 'CONFIRM_ERROR'; error: string }
  | { type: 'ADD_NUEVO_PRODUCTO' }
  | { type: 'RESET_CART' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_SUCURSAL'; sucursalId: number }
```

2. Implement the pure `compraReducer(state, action)` function.

3. Write at least these tests (optional but recommended if Vitest is set up):
   - ADD_PRODUCT adds item to empty cart
   - ADD_PRODUCT increments quantity if same productoId already in cart
   - REMOVE_FROM_CART removes the item at index
   - SET_STEP transitions correctly
   - RESET_CART clears cart
   - CONFIRM_SUCCESS sets success, transitions to done
   - CONFIRM_ERROR sets error but keeps cart intact

### Verification

- `npx tsc --noEmit` passes
- (If Vitest) `npx vitest run` passes

---

## Task 1.2: Rewrite Scan Step UI

**Depends on:** 1.1  
**Estimate:** ~45 min  
**Testing:** Manual + TypeScript check

### What to do

In `frontend/src/pages/CompraPage.tsx`:

1. **Set up `useReducer`** with initial state (`step: 'scan'`, empty cart, `sucursalId: 1`, `cantidad: 1`).

2. **Search input** (replace the existing placeholder input):
   - `ref={searchRef}` â€” `useRef<HTMLInputElement>`
   - `autoFocus` attribute
   - `onChange` â†’ dispatch `SET_SEARCH_TERM`
   - `onKeyDown` â†’ handle Enter:
     - If searchTerm matches a product barcode **exactly** â†’ dispatch `ADD_PRODUCT` with current cantidad
     - Clear search term after add
     - Refocus `searchRef.current?.focus()`
     - Ignore Enter if no exact barcode match
   - Debounce duplicate scan: if same barcode within 500ms, skip

3. **Quantity input** next to search:
   - Numeric input, `min={1}`, `value={state.cantidad}`
   - `onChange` â†’ dispatch `SET_CANTIDAD`

4. **Product grid** (modify existing):
   - Filter `productos` client-side by `state.searchTerm` (by `codigoBarra` or `nombre`)
   - Each card shows: name, codigoBarra, price, cost, stock
   - "Agregar" button per card â†’ dispatch `ADD_PRODUCT` with cantidad from state

5. **Cart panel** (modify existing):
   - Each item row: name, quantity (+/- buttons), unit cost, subtotal, delete
   - `+` â†’ dispatch `UPDATE_CANTIDAD_CART` with +1
   - `-` â†’ dispatch `UPDATE_CANTIDAD_CART` with -1 (remove if 0)
   - `ðŸ—‘ï¸` â†’ dispatch `REMOVE_FROM_CART`
   - Footer: total sum

6. **Navigation buttons**:
   - "ðŸ“‹ Ver resumen" â†’ dispatch `SET_STEP('confirm')` (enabled only if cart.length > 0)
   - "âž• Nuevo producto" â†’ existing nuevosProductos UI (keep it)

7. **Address the `React.useEffect` bug**: Make sure to import useEffect and use it directly, and import React too for JSX. The initial products load should use `useEffect(() => { loadProductos() }, [state.sucursalId])`.

8. **Auto-focus logic**:
   ```typescript
   useEffect(() => {
     if (state.step === 'scan') {
       searchRef.current?.focus()
     }
   }, [state.step])
   ```

### Step SCAN layout reference

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ [ðŸ” Buscar__________] [Cant: 24_]          â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚ Product grid (filtered or full)           â”‚
â”‚ â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”        â”‚
â”‚ â”‚ Prod A       â”‚  â”‚ Prod B       â”‚        â”‚
â”‚ â”‚ $1.200  St:50â”‚  â”‚ $0.900  St:30â”‚        â”‚
â”‚ â”‚ [Agregar]    â”‚  â”‚ [Agregar]    â”‚        â”‚
â”‚ â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜        â”‚
â”‚                                           â”‚
â”‚ â”€â”€ Carrito â”€â”€                             â”‚
â”‚ â”‚ Prod A  x24  $28.800  [-] 24 [+] ðŸ—‘  â”‚ â”‚
â”‚ â”‚ TOTAL: $39.600                         â”‚ â”‚
â”‚                                           â”‚
â”‚ [âž• Nuevo]         [ðŸ“‹ Ver resumen â†’]    â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Verification

- Open devtools console: no errors
- Type a barcode + Enter: product added to cart
- Type a partial name: grid filters
- Change quantity input: next add uses that quantity
- Cart +/- works correctly
- Empty cart â†’ "Ver resumen" disabled
- Scanner simulation: rapid same-barcode adds only once

---

## Task 1.3: Implement Confirm Step (Boleta)

**Depends on:** 1.2  
**Estimate:** ~30 min  
**Testing:** Manual

### What to do

1. When `state.step === 'confirm'`, render instead of the scan UI:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  ðŸ“‹ VERIFICAR COMPRA                              â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  â”Œâ”€â”€â”€ BOLETA DE COMPRA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  â”‚  Fecha: {fecha}   Sucursal: {nombre}       â”‚ â”‚
â”‚  â”‚                                             â”‚ â”‚
â”‚  â”‚  CÃ“DIGO   PRODUCTO      CANT   COSTO   SUB â”‚ â”‚
â”‚  â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚ â”‚
â”‚  â”‚  {rows}                                     â”‚ â”‚
â”‚  â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚ â”‚
â”‚  â”‚                       TOTAL: ${total}       â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                                                  â”‚
â”‚  â˜ {checkbox} "He verificado que las cantidades  â”‚
â”‚     y precios coinciden con la boleta fÃ­sica"    â”‚
â”‚                                                  â”‚
â”‚  [âœï¸ Volver a editar]  [âœ… Confirmar compra]     â”‚
â”‚                            (disabled until check) â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

2. Table styling:
   - Monospace font (Courier New or similar)
   - Alternating row backgrounds for readability
   - Right-aligned numbers
   - Bolder total row

3. Checkbox dispatch: `dispatch({ type: 'SET_VERIFIED', verified: e.target.checked })`

4. "Volver a editar" â†’ dispatch `SET_STEP('scan')`

5. "Confirmar compra" â†’ handler that:
   - Builds `CompraRequestDto` from cart items
   - Calls `api.compras.crear(request)`
   - On success: dispatch `CONFIRM_SUCCESS`
   - On error: dispatch `CONFIRM_ERROR`
   - Show loading state on button during request

6. Error display: if `state.error` is set, show it as a red alert banner above the table

### Verification

- Click "Ver resumen" from scan â†’ confirm step shows
- All cart items appear correctly in the table
- Checkbox unchecked â†’ button disabled
- Checkbox checked â†’ button enabled
- Click "Volver a editar" â†’ back to scan with cart intact
- Click "Confirmar compra" â†’ call made, or error shown inline

---

## Task 1.4: Implement Done Step (Comprobante)

**Depends on:** 1.3  
**Estimate:** ~30 min  
**Testing:** Manual

### What to do

1. When `state.step === 'done'` and `state.success !== null`, render:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  âœ… COMPRA REGISTRADA                             â”‚
â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¤
â”‚  â”Œâ”€â”€â”€ COMPROBANTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  â”‚           PosWeb â€” Punto de Venta         â”‚ â”‚
â”‚  â”‚                                           â”‚ â”‚
â”‚  â”‚  Comprobante: C-{fecha}-{gastoId}         â”‚ â”‚
â”‚  â”‚  Fecha: {response.fecha}                  â”‚ â”‚
â”‚  â”‚  Sucursal: {sucursalNombre}               â”‚ â”‚
â”‚  â”‚                                           â”‚ â”‚
â”‚  â”‚  PRODUCTO       CANT   COSTO   SUBTOTAL   â”‚ â”‚
â”‚  â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚ â”‚
â”‚  â”‚  {response.items rows}                    â”‚ â”‚
â”‚  â”‚  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”‚ â”‚
â”‚  â”‚  TOTAL GASTO           ${response.total}  â”‚ â”‚
â”‚  â”‚  Unidades: {total units}                 â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â”‚                                                â”‚
â”‚  [ðŸ–¨ï¸ Imprimir] [ðŸ”„ Nueva] [âŒ Cerrar]        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

2. Use data from `CompraResponseDto`:
   - `gastoId` â†’ comprobante number suffix
   - `items` â†’ table rows (name, cantidad, costoUnitario, subtotal)
   - `totalGasto` â†’ total
   - `fecha` â†’ date display

3. Buttons:
   - "ðŸ”„ Nueva compra" â†’ dispatch `RESET_CART` then `SET_STEP('scan')`
   - "âŒ Cerrar" â†’ `navigate(-1)` (go back)
   - "ðŸ–¨ï¸ Imprimir" â†’ `window.print()`

### Receipt print CSS

Create `frontend/src/pages/CompraPage.css`:

```css
@media print {
  .no-print { display: none !important; }
  .receipt { 
    width: 80mm;
    padding: 2mm;
    font-family: 'Courier New', 'Courier', monospace;
    font-size: 10pt;
    line-height: 1.3;
  }
  .receipt h1 { font-size: 14pt; text-align: center; }
  .receipt table { width: 100%; border-collapse: collapse; }
  .receipt th, .receipt td { padding: 1mm 0; }
  .receipt .total { font-weight: bold; border-top: 1px dashed #000; }
}
```

Import it in CompraPage.tsx:
```typescript
import './CompraPage.css'
```

### Verification

- Successful POST â†’ comprobante shows
- All response data displayed correctly
- "Nueva compra" clears cart and returns to scan
- "Cerrar" navigates back
- "Imprimir" opens browser print dialog

---

## Task 1.5: beforeunload + Edge Cases

**Depends on:** 1.2  
**Estimate:** ~10 min  
**Testing:** Manual

### What to do

1. Add `beforeunload` handler when cart has items:

```typescript
useEffect(() => {
  if (state.cart.length > 0) {
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }
}, [state.cart.length])
```

2. Escape key handling:
   - `scan` step: clear search input if not empty, or do nothing
   - `confirm` step: go back to scan (`SET_STEP('scan')`)
   - `done` step: go back (`navigate(-1)`)

3. Sucursal dropdown: move to a header bar or collapsible section so it doesn't clutter the scanner input. Keep functionality unchanged.

### Verification

- Add items to cart â†’ try to close tab â†’ browser warns
- Escape in confirm â†’ back to scan
- Empty cart â†’ no warning on close

---

## Task 1.6: Clean Up Deleted Code

**Depends on:** 1.3  
**Estimate:** ~5 min  
**Testing:** TypeScript check

### What to do

1. Remove the old `import { useState } from 'react'` replaced by `useReducer`
2. Remove any duplicate or unused handlers
3. Ensure all remaining code references the reducer state instead of old `useState` variables
4. Verify unused imports are removed

### Verification

- `npx tsc --noEmit` passes with 0 errors
- No console warnings about unused variables

---

## Implementation Order (Recommended)

```
Day 1 (~1.5h):
  1.1 â€” Extract reducer + test   (15 min)
  1.2 â€” Rewrite scan step        (45 min)
  1.5 â€” beforeunload + Esc       (10 min)

Day 2 (~1h):
  1.3 â€” Confirm step (boleta)    (30 min)
  1.4 â€” Done step (comprobante)  (30 min)
  1.6 â€” Cleanup                  (5 min)
```

## Success Criteria

- [x] Scanner flow: focus — scan barcode — added to cart — cleared — refocused
- [x] Scan with quantity: scan — type "24" — Enter — 24 units added
- [x] Manual add: click "Agregar" — product added with current quantity
- [x] Grid filtering: type partial name — grid filters in real time
- [x] Confirm step: table shows all items, checkbox required
- [x] Successful confirm — comprobante with response data
- [x] Error during confirm — inline error, cart preserved
- [x] "Nueva compra" — full reset to scan step
- [x] Print — opens print dialog with receipt CSS
- [x] Escape — appropriate action per step
- [x] `npm run lint && npx tsc -b` passes
- [x] TypeScript 0 errors

## Current State (al 25/05)

### Fix aplicado
- [x] **500 Internal Server Error** — migración `AddGasto` estaba pendiente → `dotnet ef database update` la aplicó. La tabla `GASTOS` ahora existe y el endpoint `POST /api/compras/crear` funciona correctamente.

### Pendiente
- [ ] **`sdd-verify`** — ejecutar la verificación formal: validar que la implementación cumple spec, design y tasks. Ejecutar `npm run lint && npx tsc -b` y reportar resultados.
- [ ] **`sdd-archive`** — archivar el cambio una vez verificado, persistir estado final en el artifact store activo.
