import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  addItem as addItemPure,
  removeItem as removeItemPure,
  updateQuantity as updateQuantityPure,
  calcTotal,
  type CartItemBase,
} from '../cart/cart-logic'

// ── Types ──────────────────────────────────────────────────────────

export interface UseCartConfig<T extends CartItemBase> {
  storageKey: string
  storage?: Storage
  getId: (item: T) => number
  getPrecioUnitario: (item: T) => number
}

export interface UseCartReturn<T extends CartItemBase> {
  items: T[]
  addItem: (item: T) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, cantidad: number) => void
  /** Batch replace (functional updater). For combo logic / undo. */
  setItems: (updater: T[] | ((prev: T[]) => T[])) => void
  clearCart: () => void
  total: number
}

// ── Hook ───────────────────────────────────────────────────────────

export function useCart<T extends CartItemBase>(config: UseCartConfig<T>): UseCartReturn<T> {
  const { storageKey, storage = sessionStorage, getId, getPrecioUnitario } = config

  const [itemsState, setItemsState] = useState<T[]>(() => {
    try {
      const saved = storage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed as T[]
      }
    } catch { /* ignore */ }
    return []
  })

  // Persist on every items change
  useEffect(() => {
    try {
      if (itemsState.length > 0) {
        storage.setItem(storageKey, JSON.stringify(itemsState))
      } else {
        storage.removeItem(storageKey)
      }
    } catch { /* storage unavailable */ }
  }, [itemsState, storageKey, storage])

  // ── Actions ──────────────────────────────────────────────────────
  const addItem = useCallback((item: T) => {
    setItemsState(prev => addItemPure(prev, item, getId))
  }, [getId])

  const removeItem = useCallback((id: number) => {
    setItemsState(prev => removeItemPure(prev, id, getId))
  }, [getId])

  const updateQuantity = useCallback((id: number, cantidad: number) => {
    setItemsState(prev => updateQuantityPure(prev, id, cantidad, getId))
  }, [getId])

  const clearCart = useCallback(() => {
    setItemsState([])
  }, [])

  const setItems = useCallback((updater: T[] | ((prev: T[]) => T[])) => {
    setItemsState(updater)
  }, [])

  // Computed total
  const total = useMemo(
    () => calcTotal(itemsState, getPrecioUnitario),
    [itemsState, getPrecioUnitario],
  )

  return { items: itemsState, addItem, removeItem, updateQuantity, setItems, clearCart, total }
}
