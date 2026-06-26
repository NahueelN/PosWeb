// ── Pure cart logic — zero React dependencies ──────────────────────

/** Minimum contract for any cart item. */
export interface CartItemBase {
  cantidad: number
}

/**
 * Add an item to the cart. If an item with the same id already exists,
 * increments its cantidad. Otherwise appends.
 * 
 * Uses `getId` to determine item identity — supports nested ids
 * (e.g. `item.producto.id` for Ventas, `item.productoId` for Compras).
 */
export function addItem<T extends CartItemBase>(
  items: T[],
  newItem: T,
  getId: (item: T) => number,
): T[] {
  const id = getId(newItem)
  const idx = items.findIndex(i => getId(i) === id)
  if (idx >= 0) {
    const updated = [...items]
    updated[idx] = { ...updated[idx], cantidad: updated[idx].cantidad + newItem.cantidad } as T
    return updated
  }
  return [...items, newItem]
}

/**
 * Remove an item by its identity id.
 */
export function removeItem<T extends CartItemBase>(
  items: T[],
  id: number,
  getId: (item: T) => number,
): T[] {
  return items.filter(i => getId(i) !== id)
}

/**
 * Update the quantity of an item. If cantidad <= 0, removes the item.
 */
export function updateQuantity<T extends CartItemBase>(
  items: T[],
  id: number,
  cantidad: number,
  getId: (item: T) => number,
): T[] {
  if (cantidad <= 0) return removeItem(items, id, getId)
  return items.map(i => getId(i) === id ? { ...i, cantidad } as T : i)
}

/**
 * Calculate the cart total: sum of cantidad × precioUnitario.
 */
export function calcTotal<T extends CartItemBase>(
  items: T[],
  getPrecioUnitario: (item: T) => number,
): number {
  return items.reduce((sum, i) => sum + i.cantidad * getPrecioUnitario(i), 0)
}
