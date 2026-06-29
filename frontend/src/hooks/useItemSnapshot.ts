import { useRef } from 'react'

/**
 * Shared hook for cart item quantity Escape behavior.
 *
 * - If the item was just added (first time in cart): Escape removes it.
 * - If the item already existed (editing): Escape reverts to the quantity it had
 *   when focus entered the input.
 */
export function useItemSnapshot() {
  const snapshot = useRef<Map<number, number>>(new Map())
  const added = useRef<Set<number>>(new Set())

  /** Call right before addItem when the user clicks a card / scans a barcode. */
  function markAdded(id: number, prevQty?: number) {
    if (prevQty !== undefined) {
      snapshot.current.set(id, prevQty)
    } else {
      added.current.add(id)
    }
  }

  /** Pass as onFocusQty to CartItemRow. */
  function onFocusQty(id: number, currentQty: number) {
    if (added.current.has(id)) {
      added.current.delete(id)
    } else if (!snapshot.current.has(id)) {
      snapshot.current.set(id, currentQty)
    }
  }

  /** Pass as onEscape to CartItemRow. */
  function onEscape(id: number, currentQty: number, revert: (qty: number) => void, remove: () => void) {
    const snap = snapshot.current.get(id)
    if (snap !== undefined && currentQty !== snap) {
      revert(snap)
    } else if (snap === undefined) {
      remove()
    }
  }

  return { markAdded, onFocusQty, onEscape }
}
