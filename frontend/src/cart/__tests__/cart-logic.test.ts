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
