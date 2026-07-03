import { type ReactNode } from 'react'
import { Plus, Minus, Trash2, AlertTriangle } from 'lucide-react'

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
  /** Called on Escape — parent decides revert vs remove. Defaults to onRemove. */
  onEscape?: () => void
  /** Called when quantity input receives focus — for snapshotting current value */
  onFocusQty?: () => void
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
  onEscape,
  onFocusQty,
  inputRef,
  stockWarning,
  badge,
  details,
  onClickName,
  onRemove,
  removeButton,
}: CartItemRowProps) {
  return (
    <div>
      <div className="flex items-center px-2 py-1 transition-colors hover:bg-gray-50/60">
        {/* Product info — flexible */}
        <div className={`flex-1 min-w-0${onClickName ? ' cursor-pointer' : ''}`} onClick={onClickName}>
          <p className="text-[14px] font-semibold text-gray-900 leading-snug truncate">
            {badge}
            {nombre}
            {stockWarning && (
              <span className="inline-flex items-center gap-1 ml-2 text-[12px] text-red-600 font-medium">
                <AlertTriangle size={12} className="shrink-0" strokeWidth={2.5} />
                {stockWarning}
              </span>
            )}
          </p>
          <p className="text-[13px] text-gray-500 truncate mt-0.5">
            {codigo && <span className="font-mono">{codigo}</span>}
            {codigo && ' · '}
            {precioUnitario}
          </p>
          {details}
        </div>

        {/* Importe — fixed column, right-aligned */}
        <div className="shrink-0 w-[110px] flex items-center justify-end tabular-nums">
          <span className="text-[14px] font-bold text-gray-900 leading-none">{subtotal}</span>
        </div>

        {/* Qty controls — fixed column */}
        <div className="shrink-0 w-[88px] flex items-center justify-center gap-0.5">
          <button type="button"
            onClick={() => cantidad <= 1 ? onRemove() : onCantidadChange(cantidad - 1)}
            className="flex h-[20px] w-[20px] items-center justify-center rounded border border-gray-200 bg-white text-gray-400 hover:border-[oklch(0.52_0.255_278_/_0.50)] hover:bg-[oklch(0.52_0.255_278_/_0.05)] hover:text-[oklch(0.52_0.255_278)] active:scale-90 transition-all duration-100"
            aria-label={`Reducir cantidad de ${nombre}`}
          >
            <Minus size={10} strokeWidth={3} />
          </button>

          <input type="text" inputMode="numeric" min={min} data-cart-qty
            ref={inputRef}
            onFocus={onFocusQty}
            className="w-10 text-center border border-gray-200 rounded px-0.5 py-0.5 text-[12px] font-bold tabular-nums text-[oklch(0.52_0.255_278)] bg-[oklch(0.52_0.255_278_/_0.06)] focus:outline-none focus:ring-1 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)]"
            value={cantidad}
            onChange={(e) => {
              const v = parseInt(e.target.value)
              onCantidadChange(isNaN(v) ? min : v)
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowUp') {
                e.preventDefault()
                onCantidadChange(cantidad + 1)
                return
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                if (cantidad <= 1) { onCantidadChange(0); return }
                onCantidadChange(cantidad - 1)
                return
              }
              if (e.key === 'Enter') {
                e.preventDefault()
                if (cantidad === 0 || cantidad <= min) { onRemove(); onEnter?.(); return }
                onEnter?.()
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                e.stopPropagation()
                ;(onEscape || onRemove)()
                onEnter?.()
                return
              }
            }}
          />

          <button type="button"
            onClick={() => onCantidadChange(cantidad + 1)}
            className="flex h-[20px] w-[20px] items-center justify-center rounded border border-gray-200 bg-white text-gray-400 hover:border-[oklch(0.52_0.255_278_/_0.50)] hover:bg-[oklch(0.52_0.255_278_/_0.05)] hover:text-[oklch(0.52_0.255_278)] active:scale-90 transition-all duration-100"
            aria-label={`Aumentar cantidad de ${nombre}`}
          >
            <Plus size={10} strokeWidth={3} />
          </button>
        </div>

        {/* Delete button — far right */}
        <div className="shrink-0 w-[24px] flex items-center justify-center">
          {removeButton ?? (
            <button type="button" onClick={onRemove}
              className="flex h-[20px] w-[20px] items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 active:scale-90 transition-all duration-100"
              aria-label={`Quitar ${nombre} del carrito`}
            >
              <Trash2 size={11} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
