import { describe, it, expect } from 'vitest'
import { addItem, removeItem, updateQuantity, calcTotal } from '../cart-logic'

// ── Test helpers ────────────────────────────────────────────────────
interface TestItem {
  id: number
  nombre: string
  cantidad: number
  precio: number
}

const getId = (i: TestItem) => i.id
const getPrecio = (i: TestItem) => i.precio

function makeItem(overrides: Partial<TestItem> = {}): TestItem {
  return { id: 1, nombre: 'Test', cantidad: 1, precio: 100, ...overrides }
}

// ── addItem ─────────────────────────────────────────────────────────
describe('addItem', () => {
  it('adds new item to empty cart', () => {
    const item = makeItem()
    const result = addItem([], item, getId)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(item)
  })

  it('adds new item to non-empty cart', () => {
    const a = makeItem({ id: 1 })
    const b = makeItem({ id: 2, nombre: 'B' })
    const result = addItem([a], b, getId)
    expect(result).toHaveLength(2)
    expect(result.map(i => i.id)).toEqual([1, 2])
  })

  it('increments cantidad when item already exists', () => {
    const a = makeItem({ id: 1, cantidad: 2 })
    const result = addItem([a], makeItem({ id: 1, cantidad: 3 }), getId)
    expect(result).toHaveLength(1)
    expect(result[0].cantidad).toBe(5)
  })

  it('does not mutate original array', () => {
    const original = [makeItem()]
    const copy = [...original]
    addItem(original, makeItem({ id: 2 }), getId)
    expect(original).toEqual(copy)
  })

  it('does not mutate existing item on increment', () => {
    const a = makeItem({ id: 1, cantidad: 2 })
    const original = [a]
    const result = addItem(original, makeItem({ id: 1 }), getId)
    expect(result[0]).not.toBe(a) // new reference
    expect(a.cantidad).toBe(2)   // original unchanged
  })
})

// ── removeItem ──────────────────────────────────────────────────────
describe('removeItem', () => {
  it('removes existing item', () => {
    const a = makeItem({ id: 1 })
    const b = makeItem({ id: 2 })
    const result = removeItem([a, b], 1, getId)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(2)
  })

  it('returns same array when id not found', () => {
    const items = [makeItem({ id: 1 })]
    const result = removeItem(items, 999, getId)
    expect(result).toEqual(items)
  })

  it('returns empty array when removing last item', () => {
    const result = removeItem([makeItem()], 1, getId)
    expect(result).toHaveLength(0)
  })
})

// ── updateQuantity ──────────────────────────────────────────────────
describe('updateQuantity', () => {
  it('updates cantidad to positive value', () => {
    const a = makeItem({ id: 1, cantidad: 2 })
    const result = updateQuantity([a], 1, 5, getId)
    expect(result[0].cantidad).toBe(5)
  })

  it('removes item when cantidad is 0', () => {
    const result = updateQuantity([makeItem({ id: 1 })], 1, 0, getId)
    expect(result).toHaveLength(0)
  })

  it('removes item when cantidad is negative', () => {
    const result = updateQuantity([makeItem({ id: 1 })], 1, -1, getId)
    expect(result).toHaveLength(0)
  })

  it('does not mutate original item', () => {
    const a = makeItem({ id: 1, cantidad: 2 })
    const original = [a]
    const result = updateQuantity(original, 1, 5, getId)
    expect(a.cantidad).toBe(2)
    expect(result[0]).not.toBe(a)
  })
})

// ── calcTotal ───────────────────────────────────────────────────────
describe('calcTotal', () => {
  it('returns 0 for empty cart', () => {
    expect(calcTotal([], getPrecio)).toBe(0)
  })

  it('calculates total for single item', () => {
    const items = [makeItem({ cantidad: 3, precio: 100 })]
    expect(calcTotal(items, getPrecio)).toBe(300)
  })

  it('calculates total for multiple items', () => {
    const items = [
      makeItem({ id: 1, cantidad: 2, precio: 100 }),
      makeItem({ id: 2, cantidad: 1, precio: 50 }),
    ]
    expect(calcTotal(items, getPrecio)).toBe(250)
  })
})

// ── Regression tests — bugs conocidos ──────────────────────────────
describe('regression', () => {
  // Combo double-add: cuando un producto ya está en el carrito como parte
  // de un combo, agregarlo individualmente NO debe mergear con el combo
  it('addItem with different id does not merge with existing items', () => {
    const comboItem = makeItem({ id: 1, cantidad: 1, precio: 150 })
    const individual = makeItem({ id: 2, cantidad: 1, precio: 100 })
    const cart = [comboItem]
    const result = addItem(cart, individual, getId)
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe(1)
    expect(result[1].id).toBe(2)
  })

  // Stock: updateQuantity con cantidad > stock debe permitirse
  // (la validación de stock es del backend/UI, no de cart-logic)
  it('updateQuantity allows any positive quantity', () => {
    const item = makeItem({ id: 1, cantidad: 1 })
    const result = updateQuantity([item], 1, 9999, getId)
    expect(result[0].cantidad).toBe(9999)
  })

  // Focus/desborde: cantidades grandes no rompen el total
  it('calcTotal handles large quantities', () => {
    const items = [makeItem({ id: 1, cantidad: 10000, precio: 999.99 })]
    const total = calcTotal(items, getPrecio)
    expect(total).toBeCloseTo(9999900, 0)
  })

  // Auto-combo: al remover un item, el total se recalcula correctamente
  it('total updates correctly after removeItem', () => {
    const a = makeItem({ id: 1, cantidad: 2, precio: 100 })
    const b = makeItem({ id: 2, cantidad: 1, precio: 50 })
    const afterRemove = removeItem([a, b], 1, getId)
    expect(calcTotal(afterRemove, getPrecio)).toBe(50)
  })

  // Agregar item con cantidad 0
  it('addItem with cantidad 0 still adds the item', () => {
    const result = addItem([], makeItem({ cantidad: 0 }), getId)
    expect(result).toHaveLength(1)
    expect(result[0].cantidad).toBe(0)
  })

  // Remover item que no existe no tira error
  it('removeItem with non-existent id returns same array', () => {
    const items = [makeItem({ id: 1 })]
    const result = removeItem(items, 999, getId)
    expect(result).toHaveLength(1)
    expect(result).toEqual(items)
  })

  // updateQuantity con el mismo valor no cambia nada
  it('updateQuantity with same value returns equivalent array', () => {
    const item = makeItem({ id: 1, cantidad: 3 })
    const result = updateQuantity([item], 1, 3, getId)
    expect(result[0].cantidad).toBe(3)
  })

  // Total con items de precio 0
  it('calcTotal with zero-priced items returns 0', () => {
    const items = [makeItem({ id: 1, cantidad: 5, precio: 0 })]
    expect(calcTotal(items, getPrecio)).toBe(0)
  })
})
