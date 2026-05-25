# Design: Two-Column POS Layout

## Technical Approach

Rewrite `frontend/src/pages/VentasPage.tsx` with a two-column flex layout. All existing payment/confirm logic stays unchanged. The product grid loads from the existing `GET /api/productos` endpoint.

## Layout Structure

```tsx
<div className="flex flex-col lg:flex-row gap-4 h-full">
  {/* Left Panel — Product Browser */}
  <div className="lg:w-[55%] xl:w-[60%] space-y-4">
    <SearchBar />
    <ProductGrid products={filteredProducts} onAdd={agregarProducto} />
  </div>

  {/* Right Panel — Cart + Payment */}
  <div className="lg:w-[45%] xl:w-[40%] lg:sticky lg:top-0 lg:self-start space-y-4">
    <CartItems items={items} onChange={handleCambiarCantidad} onRemove={quitarItem} />
    <PaymentSection mediosPago={...} selectedMedio={...} ... />
    <StickyTotal total={total} selectedMedio={...} ... />
  </div>
</div>
```

## State Changes

| State | Source | Purpose |
|-------|--------|---------|
| `productos` | `GET /api/productos` on mount | All active products for the grid |
| `productosLoading` | Loading state | Show skeleton while fetching |
| `searchQuery` | Search input | Client-side filter for product grid |
| `filteredProductos` | Computed from productos + searchQuery | Products to display in grid |

Everything else (items, payment state, etc.) stays the same.

## Product Card Component

```tsx
function ProductCard({ producto, onAdd }: { producto: ProductoDto; onAdd: (p: ProductoDto) => void }) {
  return (
    <button onClick={() => onAdd(producto)}
      className="bg-white rounded-xl border border-gray-200 p-3 text-left hover:border-indigo-300 hover:shadow-sm transition-all active:scale-[0.98]"
    >
      <p className="font-semibold text-gray-900 text-sm truncate">{producto.nombre}</p>
      <p className="text-lg font-bold text-indigo-600 mt-1">${producto.precio.toFixed(2)}</p>
      <StockBadge stock={producto.stock} />
    </button>
  )
}
```

## Data Flow

```
Page mount
  → fetch GET /api/productos → setProductos
  → fetch GET /api/medios-pago → setMediosPago
  → fetch GET /api/cajas/activa → setCajaActiva

User types in search
  → setSearchQuery
  → filteredProductos = productos.filter(p => 
      p.nombre.toLowerCase().includes(query) || 
      p.codigoBarra.includes(query)
    )

User clicks product card
  → agregarProducto(producto) → adds to items[]

User clicks + in cart
  → handleCambiarCantidad(id, cantidad + 1)

User selects payment
  → selectMedio(mp) → sets selectedMedio + pagoMonto auto-filled

User confirms
  → confirmarVenta() → POST /api/ventas → show result
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/pages/VentasPage.tsx` | Rewrite | Two-column layout with product grid + cart panel |

## Testing Strategy

- `npx tsc -b` — TypeScript compilation
- `npx vite build` — production build
- Manual: verify product grid loads, cards add to cart, payment + confirm still works
