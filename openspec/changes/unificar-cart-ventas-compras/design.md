# Design: Unificar Carrito — Ventas y Compras

## Arquitectura General

```
┌──────────────────────────────────────────────────┐
│ VentasPage / CompraPage                          │
│  ┌────────────────────┐  ┌─────────────────────┐ │
│  │ CartHost            │  │ PageShell           │ │
│  │  ┌────────────────┐ │  │                     │ │
│  │  │ useCart<T>      │ │  └─────────────────────┘ │
│  │  │  ┌────────────┐ │ │                          │
│  │  │  │cart-logic.ts│ │ │                          │
│  │  │  │ (puras)     │ │ │                          │
│  │  │  └────────────┘ │ │                          │
│  │  └────────────────┘ │                          │
│  │  ┌────────────────┐ │                          │
│  │  │ CartPanel       │ │                          │
│  │  │ PaymentFooter   │ │                          │
│  │  │ MontoInput      │ │                          │
│  │  └────────────────┘ │                          │
│  └────────────────────┘                          │
└──────────────────────────────────────────────────┘
```

**Separación de capas**: `cart-logic.ts` (funciones puras, cero React) → `useCart.ts` (hook React, state + persistencia) → `CartHost` (componente visual, compone shared components) → Páginas (lógica de negocio específica: combos, proveedor, clientes).

## Tipos Genéricos

### CartItem (contrato mínimo)

```ts
interface CartItem {
  id: number
  cantidad: number
}
```

### Adaptadores por página

**VentasPage** — `Item` extiende CartItem:

```ts
interface Item extends CartItem {
  producto: ProductoDto
  comboId?: number
  comboNombre?: string
  comboPrecio?: number
  // id → producto.id, mergeKey → 'id'
}
```

**CompraPage** — `CartItemCompra` extiende CartItem:

```ts
interface CartItemCompra extends CartItem {
  productoId: number  // id → productoId
  productoNombre: string
  codigoBarra: string
  costoUnitario: number
  subtotal: number
  precio?: number
  categoriaId?: number
  // mergeKey → 'productoId'
}
```

## useCart<T> — API

```ts
function useCart<T extends CartItem>(config: {
  storageKey: string
  storage?: Storage        // default: sessionStorage
  mergeKey?: keyof T       // default: 'id'
  getPrecioUnitario: (item: T) => number
}): {
  items: T[]
  addItem: (item: T) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, cantidad: number) => void
  clearCart: () => void
  total: number
}
```

**Persistencia**: serializa `items` a JSON en el storage configurado. Deserializa en inicialización (lazy initializer). Si `items.length === 0`, elimina la key del storage.

## CartHost — Props

```ts
interface CartHostProps<T extends CartItem> {
  cart: UseCartReturn<T>
  title: string
  confirmLabel: string
  onConfirm: () => void | Promise<void>
  confirmDisabled?: boolean
  confirmRef?: RefObject<HTMLButtonElement>
  pageShell?: { title: string; subtitle: string; caja?: CajaProps }
  paymentSlot: ReactNode     // medios de pago, fuente, etc.
  headerExtra?: ReactNode
  emptyState?: ReactNode
  showVerify?: boolean
  itemRenderer?: (item: T, index: number) => ReactNode
  children: ReactNode        // panel izquierdo (search bar, product grid)
}
```

## Flujo de Datos

```
1. Página monta useCart con config específica
2. Página pasa cart + callbacks a CartHost
3. CartHost renderiza layout dos columnas:
   - Izquierda: children (product grid, search)
   - Derecha: CartPanel > items + PaymentFooter > MontoInput + paymentSlot
4. Interacciones del usuario en CartPanel (+, -, cantidad, eliminar)
   llaman a cart.updateQuantity / cart.removeItem
5. useCart actualiza estado → re-render → CartPanel refleja cambios
6. Persistencia automática vía useEffect en useCart
```

## Estrategia de Migración

1. **Fase 0**: Instalar y configurar testing. No tocar código de producción.
2. **Fase 1a**: Extraer `cart-logic.ts` + tests. No rompe nada.
3. **Fase 1b**: Crear `useCart.ts` + tests de hook. No se usa en producción aún.
4. **Fase 1c**: Migrar VentasPage — reemplazar useState inline por useCart. Misma UI.
5. **Fase 1d**: Migrar CompraPage — reemplazar useReducer por useCart. Misma UI.
6. **Fase 3a**: Crear CartHost + tests de integración.
7. **Fase 3b**: Migrar VentasPage a CartHost.
8. **Fase 3c**: Migrar CompraPage a CartHost + agregar PageShell.

Cada paso es verificable independientemente con tests. Rollback posible en cualquier punto.

## Testing Strategy

| Nivel | Qué | Framework |
|-------|-----|-----------|
| Unitario puro | cart-logic.ts (12 tests) | vitest |
| Hook | useCart con renderHook (8 tests) | @testing-library/react |
| Regresión | Bugs conocidos (6 tests) | vitest + testing-library |
| Integración | CartHost render + interacción (6 tests) | @testing-library/react + user-event |
| Smoke | VentasPage y CompraPage renderizan sin crash | testing-library |

**Mocks necesarios** (en `test-utils.tsx`):
- `mockUseOutletContext`: mockea `useOutletContext` de react-router-dom
- `mockApi`: mockea `api` client con todos los métodos
- `mockUseNotification`: `notifyError` y `notifySuccess`
- `mockStorage`: simula sessionStorage/localStorage en memoria

## Decisiones de Diseño

1. **useState vs useReducer en useCart**: useState es suficiente. La lógica compleja está en cart-logic.ts (pura). El hook solo orquesta estado + storage + recalculo de total.

2. **Genericidad**: `T extends CartItem` con `mergeKey` configurable permite que Ventas (merge por `id`) y Compra (merge por `productoId`) usen el mismo hook sin adaptadores intermedios.

3. **CartHost como composición, no herencia**: Recibe `cart` por props, no lo crea internamente. La página mantiene control del ciclo de vida del hook.

4. **Storage configurable por página**: Ventas usa `sessionStorage` (se pierde al cerrar pestaña), Compra usa `localStorage` (sobrevive). El hook acepta cualquier objeto Storage API.
