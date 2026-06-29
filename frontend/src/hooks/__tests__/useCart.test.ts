import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCart } from '../useCart'
import { createMockStorage } from '../../test-utils'

// ── Test item type ──────────────────────────────────────────────────
interface CartItem {
  id: number
  nombre: string
  cantidad: number
  precio: number
}

const getId = (i: CartItem) => i.id
const getPrecioUnitario = (i: CartItem) => i.precio

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return { id: 1, nombre: 'Test', cantidad: 1, precio: 100, ...overrides }
}

// ── Helpers ─────────────────────────────────────────────────────────
function setup(overrides: Partial<Parameters<typeof useCart>[0]> = {}) {
  const storage = createMockStorage()
  const config = {
    storageKey: 'test_cart',
    storage,
    getId,
    getPrecioUnitario,
    ...overrides,
  }
  const { result, rerender, unmount } = renderHook(() => useCart<CartItem>(config))
  return { result, rerender, unmount, storage }
}

describe('useCart', () => {
  let storage: ReturnType<typeof createMockStorage>

  beforeEach(() => {
    storage = createMockStorage()
  })

  // ── Initialization ────────────────────────────────────────────────
  it('initializes with empty items', () => {
    const { result } = setup({ storage })
    expect(result.current.items).toEqual([])
    expect(result.current.total).toBe(0)
  })

  it('restores items from storage', () => {
    const saved = [makeItem({ id: 1, cantidad: 2 })]
    storage.setItem('test_cart', JSON.stringify(saved))

    const { result } = setup({ storage })
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].cantidad).toBe(2)
  })

  // ── addItem ───────────────────────────────────────────────────────
  it('addItem updates items and total', () => {
    const { result } = setup({ storage })
    act(() => result.current.addItem(makeItem({ id: 1, cantidad: 2, precio: 100 })))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.total).toBe(200)
  })

  it('addItem persists to storage', () => {
    const { result } = setup({ storage })
    act(() => result.current.addItem(makeItem({ id: 1 })))
    const saved = JSON.parse(storage.getItem('test_cart')!)
    expect(saved).toHaveLength(1)
    expect(saved[0].id).toBe(1)
  })

  it('addItem increments existing item', () => {
    const { result } = setup({ storage })
    act(() => result.current.addItem(makeItem({ id: 1, cantidad: 2 })))
    act(() => result.current.addItem(makeItem({ id: 1, cantidad: 3 })))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].cantidad).toBe(5)
  })

  // ── removeItem ────────────────────────────────────────────────────
  it('removeItem removes item and updates total', () => {
    const { result } = setup({ storage })
    act(() => { result.current.addItem(makeItem({ id: 1, precio: 100 })) })
    act(() => { result.current.addItem(makeItem({ id: 2, precio: 50 })) })
    expect(result.current.total).toBe(150)

    act(() => result.current.removeItem(1))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].id).toBe(2)
    expect(result.current.total).toBe(50)
  })

  // ── updateQuantity ────────────────────────────────────────────────
  it('updateQuantity updates cantidad and total', () => {
    const { result } = setup({ storage })
    act(() => result.current.addItem(makeItem({ id: 1, cantidad: 1, precio: 100 })))
    act(() => result.current.updateQuantity(1, 3))
    expect(result.current.items[0].cantidad).toBe(3)
    expect(result.current.total).toBe(300)
  })

  it('updateQuantity with 0 keeps item at 0', () => {
    const { result } = setup({ storage })
    act(() => result.current.addItem(makeItem({ id: 1 })))
    act(() => result.current.updateQuantity(1, 0))
    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].cantidad).toBe(0)
  })

  // ── clearCart ─────────────────────────────────────────────────────
  it('clearCart empties items and clears storage', () => {
    const { result } = setup({ storage })
    act(() => { result.current.addItem(makeItem({ id: 1 })) })
    act(() => { result.current.addItem(makeItem({ id: 2 })) })
    expect(result.current.items).toHaveLength(2)

    act(() => result.current.clearCart())
    expect(result.current.items).toEqual([])
    expect(result.current.total).toBe(0)
    expect(storage.getItem('test_cart')).toBeNull()
  })
})
