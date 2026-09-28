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
    <div>
      <div className="grid grid-cols-[minmax(0,1fr)_72px_96px_16px] border-b border-slate-200 bg-slate-50/70 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500 xl:grid-cols-[minmax(0,1fr)_86px_120px_18px] xl:px-4">
        <span>Producto</span>
        <span className="text-right">Importe</span>
        <span className="text-center">Cant.</span>
      </div>
      <div className="divide-y divide-slate-200">
        {items.map((item: any, idx: number) => (
          <CartItemRow key={getKey(item, idx)} {...getItemProps(item, idx)} />
        ))}
      </div>
    </div>
  )
}
