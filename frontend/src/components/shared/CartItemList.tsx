import { type ReactNode } from 'react'
import CartItemRow, { type CartItemRowProps } from './CartItemRow'

// ── Types ──────────────────────────────────────────────────────────

export interface CartItemListProps<T> {
  /** Items to render */
  items: T[]
  /** Extract display props from each item */
  getItemProps: (item: T, index: number) => CartItemRowProps
  /** Unique key for each item */
  getKey: (item: T, index: number) => string | number
  /** Empty state content */
  emptyState?: ReactNode
}

// ── Component ──────────────────────────────────────────────────────

export default function CartItemList<T>({
  items,
  getItemProps,
  getKey,
  emptyState,
}: CartItemListProps<T>) {
  if (items.length === 0) {
    return (
      <>{emptyState ?? (
        <div className="text-center py-10 text-gray-400 text-sm">
          Agregá productos para armar la operación
        </div>
      )}</>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item, idx) => (
        <CartItemRow key={getKey(item, idx)} {...getItemProps(item, idx)} />
      ))}
    </div>
  )
}
