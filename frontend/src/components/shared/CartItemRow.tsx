import { type ReactNode } from 'react'
import type { CartItemBase } from '../../cart/cart-logic'

// ── Shared cart item row props ──────────────────────────────────────

export interface CartItemRowProps {
  /** Item name (required) */
  nombre: string
  /** Barcode or code (optional) */
  codigo?: string
  /** Unit price label, e.g. "$100.00 c/u" */
  precioUnitario: string
  /** Formatted subtotal (cantidad × precio) */
  subtotal: string
  /** Current quantity */
  cantidad: number
  /** Min quantity (default 0 = allows removal at 0) */
  min?: number
  /** Called when quantity changes. cantidad=0 means remove. */
  onCantidadChange: (cantidad: number) => void
  /** Called on Enter after quantity input — focus next element */
  onEnter?: () => void
  /** Ref callback for quantity input */
  inputRef?: (el: HTMLInputElement | null) => void
  /** Stock warning (e.g. "Stock insuficiente: 5 disponibles") */
  stockWarning?: string
  /** Badge (e.g. "COMBO" badge) */
  badge?: ReactNode
  /** Extra lines below the item info (e.g. combo items list) */
  details?: ReactNode
  /** Called to delete the item */
  onRemove: () => void
  /** Custom action button (e.g. combo undo button) instead of delete */
  removeButton?: ReactNode
  /** Called when clicking the item name area */
  onClickName?: () => void
}

// ── Component ──────────────────────────────────────────────────────

export default function CartItemRow({
  nombre,
  codigo,
  precioUnitario,
  subtotal,
  cantidad,
  min = 0,
  onCantidadChange,
  onEnter,
  inputRef,
  stockWarning,
  badge,
  details,
  onClickName,
  onRemove,
  removeButton,
}: CartItemRowProps) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
      <div className={`flex-1 min-w-0${onClickName ? ' cursor-pointer' : ''}`} onClick={onClickName}>
        <p className="font-semibold text-gray-900 text-base truncate">
          {badge}
          {nombre}
        </p>
        {codigo && (
          <p className="text-xs text-gray-400 font-mono truncate">{codigo}</p>
        )}
        <p className="text-xs text-gray-500 mt-0.5">{precioUnitario}</p>
        {details}
        {stockWarning && (
          <p className="text-xs text-amber-600 font-medium mt-0.5 flex items-center gap-1">
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {stockWarning}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <p className="font-semibold text-gray-900 text-base">{subtotal}</p>
        <div className="flex items-center gap-1">
          <button type="button"
            onClick={() => onCantidadChange(cantidad <= min ? 0 : cantidad - 1)}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors text-base">
            −
          </button>
          <input type="number" min={min}
            ref={inputRef}
            className="w-14 text-center border border-gray-300 rounded-lg px-1 py-1 text-base font-semibold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            value={cantidad}
            onChange={(e) => {
              const v = parseInt(e.target.value)
              onCantidadChange(isNaN(v) ? min : v)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onEnter?.()
              }
            }}
          />
          <button type="button"
            onClick={() => onCantidadChange(cantidad + 1)}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors text-base">
            +
          </button>
          {removeButton ?? (
            <button type="button" onClick={onRemove}
              className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
