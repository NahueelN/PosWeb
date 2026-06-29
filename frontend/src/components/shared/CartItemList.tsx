import { type ReactNode } from 'react'
import CartItemRow, { type CartItemRowProps } from './CartItemRow'

// ── Types ──────────────────────────────────────────────────────────

export interface CartItemListProps {
  items: any[]
  getItemProps: (item: any, index: number) => CartItemRowProps
  getKey: (item: any, index: number) => string | number
  emptyState?: ReactNode
}

// ── Component ──────────────────────────────────────────────────────

export default function CartItemList({
  items,
  getItemProps,
  getKey,
  emptyState,
}: CartItemListProps) {
  if (!items || items.length === 0) {
    return (
      <>{emptyState ?? (
        <div className="text-center py-10 text-gray-400 text-sm">
          Agregá productos para armar la operación
        </div>
      )}</>
    )
  }

  return (
    <div className="divide-y divide-gray-100">
      {items.map((item: any, idx: number) => (
        <CartItemRow key={getKey(item, idx)} {...getItemProps(item, idx)} />
      ))}
    </div>
  )
}
