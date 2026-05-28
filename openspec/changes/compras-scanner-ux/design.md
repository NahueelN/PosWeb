# Design: Compras Scanner UX

## Technical Approach

Rewrite `frontend/src/pages/CompraPage.tsx` to use a `useReducer`-based state machine with three steps (`scan`, `confirm`, `done`). No backend changes needed. No API contract changes. The `CompraResponseDto` from the existing POST endpoint provides all the data needed for the receipt.

## Architecture Decisions

### useReducer vs Multiple useState

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `useReducer` | Single state object, predictable transitions, easier to debug | ✅ **Chosen** — the step machine + cart + form state benefit from a single reducer |
| Multiple `useState` | Quick to write, but scattered logic across handlers | ❌ Rejected — harder to reason about step transitions and invariants |

### Step Enum vs String Flag

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Union type `'scan' \| 'confirm' \| 'done'` | Type-safe, no invalid states | ✅ **Chosen** — strict typing prevents bugs |

### Product Grid: Client-side Filter vs API Search

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Client-side filter (load all, filter in JS) | Fast after initial load, no extra API calls | ✅ **Chosen** — product catalog is small (<200 items), matches existing pattern |
| API-backed search | Scales to large catalogs | ❌ Rejected — overkill for this codebase, adds latency per keystroke |

### Duplicate Scan Detection

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Debounce by barcode + timestamp | Simple, effective for keyboard-wedge scanners | ✅ **Chosen** — 500ms window, track last barcode + time |
| No deduplication | Scanner double-Enter adds 2 units | ❌ Rejected — confusing UX |

## State Machine

```
         +-------+
         | SCAN  | ◄──────────────────────┐
         +---+---+                        │
             | "Ver resumen"              │
             v                            │
         +-------+                        │
         | CONFIRM|─── "Volver a editar" ──┘
         +---+---+
             | "Confirmar compra" (POST /api/compras/crear)
             v
         +------+
         | DONE |─── "Nueva compra" ──► SCAN
         +------+─── "Cerrar" ──► navigate(-1)
```

## State Shape (useReducer)

```typescript
type Step = 'scan' | 'confirm' | 'done'

interface CompraState {
  step: Step
  cart: CartItem[]
  nuevosProductos: NuevoProductoDto[]
  searchTerm: string
  cantidad: number          // quantity to add next
  error: string | null
  success: CompraResponseDto | null
  verified: boolean         // checkbox state in confirm step
  lastScanned: { barcode: string; time: number } | null  // deduplication
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
```

## Component Layout (per step)

### Step: SCAN

```
┌──────────────────────────────────────────────────────────┐
│  [🔍 Buscar producto..._______] [Cant: 24_]              │
├──────────────────────────────────────────────────────────┤
│  Productos                                                │
│  ┌─────────────────────────────────────────────────┐     │
│  │ Coca-Cola 600ml    $1.200   Stock: 50  [+ Agregar] │   │
│  │ Pepsi 500ml        $1.000   Stock: 30  [+ Agregar] │   │
│  │ ...                                                │   │
│  └─────────────────────────────────────────────────┘     │
│                                                          │
│  ── Carrito ─────────────────────────────────            │
│  │ Coca-Cola 600ml  x24  $1.200  $28.800  [-] 24 [+] 🗑│  │
│  │ Pepsi 500ml      x12  $0.900  $10.800  [-] 12 [+] 🗑│  │
│  │                                       Total: $39.600 │ │
│  ──────────────────────────────────────────────────      │
│                                                          │
│  [➕ Nuevo producto]       [📋 Ver resumen →]           │
└──────────────────────────────────────────────────────────┘
```

### Step: CONFIRM

```
┌──────────────────────────────────────────────────────────┐
│  📋 VERIFICAR COMPRA                                      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─── BOLETA DE COMPRA ───────────────────────────────┐  │
│  │  Fecha: 25/05/2026   Sucursal: Sucursal Central    │  │
│  │                                                     │  │
│  │  CÓDIGO       PRODUCTO           CANT  COSTO   SUB  │  │
│  │  ─────────────────────────────────────────────────  │  │
│  │  77908900    Coca-Cola 600ml      24  $1.200 $28.800│  │
│  │  77904100    Pepsi 500ml          12  $0.900 $10.800│  │
│  │  77903200    Agua 1.5L             6  $0.700  $4.200│  │
│  │  ─────────────────────────────────────────────────  │  │
│  │                                 TOTAL:    $43.800    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                          │
│  ☐ He verificado que las cantidades y precios             │
│    coinciden con la boleta física                         │
│                                                          │
│  [✏️ Volver a editar]           [✅ Confirmar compra]   │
│                                        (disabled)        │
└──────────────────────────────────────────────────────────┘
```

### Step: DONE

```
┌──────────────────────────────────────────────────────────┐
│  ✅ COMPRA REGISTRADA                                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─── COMPROBANTE ───────────────────────────────────┐   │
│  │           PosWeb — Punto de Venta                 │   │
│  │                                                   │   │
│  │  Comprobante: C-20260525-0001                    │   │
│  │  Fecha: 25/05/2026 23:30                         │   │
│  │  Sucursal: Sucursal Central                      │   │
│  │                                                   │   │
│  │  PRODUCTO               CANT   COSTO   SUBTOTAL  │   │
│  │  ─────────────────────────────────────────────── │   │
│  │  Coca-Cola 600ml        24    $1.200   $28.800   │   │
│  │  Pepsi 500ml            12    $0.900   $10.800   │   │
│  │  Agua 1.5L               6    $0.700    $4.200   │   │
│  │  ─────────────────────────────────────────────── │   │
│  │  TOTAL GASTO                      $43.800         │   │
│  │  Unidades: 42                                     │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [🖨️ Imprimir]   [🔄 Nueva compra]   [❌ Cerrar]      │
└──────────────────────────────────────────────────────────┘
```

## Key Implementation Details

### Auto-focus on Search Input

```typescript
const searchRef = useRef<HTMLInputElement>(null)

useEffect(() => {
  searchRef.current?.focus()
}, []) // on mount

// After adding product to cart, refocus:
const handleAddProduct = (id: number, cantidad: number) => {
  dispatch({ type: 'ADD_PRODUCT', ... })
  searchRef.current?.focus()
}
```

### Scanner Deduplication

```typescript
const LAST_SCAN_MS = 500

function handleScan(barcode: string): boolean {
  const last = state.lastScanned
  if (last && last.barcode === barcode && Date.now() - last.time < LAST_SCAN_MS) {
    return false // skip duplicate
  }
  // ... add product
  dispatch({ type: 'UPDATE_LAST_SCAN', barcode, time: Date.now() })
  return true
}
```

### Product Filter (Client-side)

```typescript
const filteredProductos = productos.filter(p => {
  if (!state.searchTerm) return true
  const q = state.searchTerm.toLowerCase()
  return p.codigoBarra.toLowerCase().includes(q) || p.nombre.toLowerCase().includes(q)
})
```

### Confirm POST + Transition

```typescript
const handleConfirm = async () => {
  const request: CompraRequestDto = {
    sucursalId: state.sucursalId,
    items: state.cart.map(i => ({
      productoId: i.productoId,
      cantidad: i.cantidad,
      costoUnitario: i.costoUnitario
    }))
  }

  try {
    const response = await api.compras.crear(request)
    dispatch({ type: 'CONFIRM_SUCCESS', response })
  } catch (err: any) {
    dispatch({ type: 'CONFIRM_ERROR', error: err.message })
  }
}
```

### Print CSS

```css
@media print {
  .no-print { display: none; }
  .receipt { 
    width: 80mm;
    font-family: 'Courier New', monospace;
    font-size: 12px;
  }
}
```

### beforeunload Warning

```typescript
useEffect(() => {
  if (state.cart.length > 0) {
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault() }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }
}, [state.cart.length])
```

## Data Flow

```
USER SCANS BARCODE
  │
  ├─ searchRef: read value, check exact barcode match
  ├─ dedup check: same barcode < 500ms? → skip
  ├─ find producto in full list by codigoBarra
  ├─ dispatch ADD_PRODUCT with current cantidad
  ├─ input cleared, refocused
  └─ cart panel re-renders

USER CLICKS "VER RESUMEN"
  │
  ├─ dispatch SET_STEP('confirm')
  ├─ cart becomes read-only table
  └─ verification checkbox shown

USER CHECKS BOX + CLICKS "CONFIRMAR COMPRA"
  │
  ├─ dispatch CONFIRM_SUCCESS or CONFIRM_ERROR
  ├─ on success:
  │   ├─ comprobante shown with response data
  │   └─ print, new, close buttons rendered
  └─ on error:
      ├─ inline error message
      └─ retry possible
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/pages/CompraPage.tsx` | **Rewrite** | Full `useReducer` state machine with 3-step UI, scanner input, confirm boleta, receipt |
| `frontend/src/pages/CompraPage.css` | **Create** | Print-specific CSS for receipt (80mm thermal) |

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (reducer) | State transitions: SCAN→CONFIRM, CONFIRM→DONE, DONE→SCAN | Extract pure `compraReducer(state, action)` and test with Vitest |
| Unit (reducer) | ADD_PRODUCT updates cart correctly | Same |
| Unit (reducer) | SET_VERIFIED enables confirm button | Same |
| Integration | Confirm POST with valid cart returns success | Manual (no E2E framework) |
| Manual | Scanner flow: real barcode scanner or USB keyboard wedge | Open devtools, type barcode + Enter in search input |
| Lint/Type | `npm run lint && npx tsc -b` passes | CI check |

## Open Questions

None.
