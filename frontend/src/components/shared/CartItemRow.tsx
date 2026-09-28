import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Plus, Minus, X, AlertTriangle } from 'lucide-react'

// Scanner detection: barcode readers emit a long digit burst ending in Enter/Tab.
// A quantity long enough to be a barcode (>= 8 digits) is always a scan; shorter
// bursts only count when every digit arrives faster than human typing.
const SCAN_GAP_MS = 100
const MIN_SCAN_LEN = 5
const UNCONDITIONAL_SCAN_LEN = 8

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
  /** Step for +/- buttons (default 1) */
  step?: number
  /** Decimal places for display and rounding (default 0) */
  decimales?: number
  /** Called when quantity changes. cantidad=0 means remove. */
  onCantidadChange: (cantidad: number) => void
  /** Called on Enter after quantity input — focus next element */
  onEnter?: () => void
  /** Called when a barcode scan is detected while typing in the quantity input */
  onScan?: (code: string) => void
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
  /** Called when clicking the importe/subtotal area (price next to quantity) */
  onClickImporte?: () => void
}

// ── Component ──────────────────────────────────────────────────────

export default function CartItemRow({
  nombre,
  codigo,
  precioUnitario,
  subtotal,
  cantidad,
  min = 0,
  step = 1,
  decimales = 0,
  onCantidadChange,
  onEnter,
  onScan,
  onEscape,
  onFocusQty,
  inputRef,
  stockWarning,
  badge,
  details,
  onClickName,
  onClickImporte,
  onRemove,
  removeButton,
}: CartItemRowProps) {
  function commit(valor: string) {
    const v = parseFloat(valor)
    if (isNaN(v)) { onCantidadChange(min); return }
    const rounded = Math.round(v * Math.pow(10, decimales)) / Math.pow(10, decimales)
    onCantidadChange(Math.max(min, rounded))
  }

  const burstRef = useRef('')
  const lastKeyTimeRef = useRef(0)
  const fastRunRef = useRef(0)
  const focusValueRef = useRef(cantidad)
  const productInfoRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLParagraphElement>(null)
  const stockWarningMeasureRef = useRef<HTMLSpanElement>(null)
  const [compactStockWarning, setCompactStockWarning] = useState(false)

  useEffect(() => {
    if (!stockWarning) {
      setCompactStockWarning(false)
      return
    }

    const update = () => {
      const availableWidth = productInfoRef.current?.clientWidth ?? 0
      const titleWidth = titleRef.current?.scrollWidth ?? 0
      const warningWidth = (stockWarningMeasureRef.current?.offsetWidth ?? 0) + 18
      setCompactStockWarning(titleWidth + warningWidth > availableWidth)
    }

    update()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(update)
    if (productInfoRef.current) observer.observe(productInfoRef.current)
    return () => observer.disconnect()
  }, [nombre, stockWarning])

  return (
    <div>
      <div className="flex items-center px-3 py-2.5 transition-colors hover:bg-slate-50/70 xl:px-4">
        {/* Product info — flexible */}
        <div ref={productInfoRef} className={`relative flex-1 min-w-0${onClickName ? ' cursor-pointer' : ''}`} onClick={onClickName}>
          <div className="flex min-w-0 items-center gap-1">
            <p ref={titleRef} className="min-w-0 max-w-full truncate text-[14px] font-semibold leading-snug text-slate-900">
              {badge}
              {nombre}
            </p>
            {stockWarning && (
              <>
                <span className="inline-flex shrink-0 items-center gap-1 text-red-600" title={stockWarning} aria-label={stockWarning}>
                  <AlertTriangle size={14} strokeWidth={2.5} />
                  <span className={compactStockWarning ? 'hidden' : 'text-[11px] font-medium'}>{stockWarning}</span>
                </span>
                <span ref={stockWarningMeasureRef} className="pointer-events-none absolute invisible whitespace-nowrap text-[11px] font-medium">{stockWarning}</span>
              </>
            )}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            {codigo && <span className="font-mono">{codigo}</span>}
            {codigo && ' · '}
            {precioUnitario}
          </p>
          {details}
        </div>

        {/* Importe — fixed column, right-aligned */}
        <div
          className={`shrink-0 w-[72px] flex items-center justify-end tabular-nums xl:w-[86px]${onClickImporte ? ' cursor-pointer' : ''}`}
          onClick={onClickImporte}
          title={onClickImporte ? 'Editar precio' : undefined}
        >
          <span className="text-[14px] font-extrabold text-slate-950 leading-none xl:text-[15px]">{subtotal}</span>
        </div>

        {/* Qty controls — fixed column */}
        <div className="shrink-0 w-[96px] flex items-center justify-center gap-1 xl:w-[120px]">
          <button type="button"
            onClick={() => {
              if (cantidad <= step) { onRemove() } else { onCantidadChange(Math.round((cantidad - step) * Math.pow(10, decimales)) / Math.pow(10, decimales)) }
              onEnter?.()
            }}
            className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:border-[oklch(0.52_0.255_278_/_0.50)] hover:bg-[oklch(0.52_0.255_278_/_0.05)] hover:text-[oklch(0.52_0.255_278)] active:scale-90 transition-all duration-100 xl:h-6 xl:w-6 xl:rounded-md"
            aria-label={`Reducir cantidad de ${nombre}`}
          >
            <Minus size={10} strokeWidth={2.5} className="xl:hidden" />
            <Minus size={12} strokeWidth={2.5} className="hidden xl:block" />
          </button>

          <input type="number" min={min} step={step} data-cart-qty
              ref={inputRef}
              onFocus={() => { focusValueRef.current = cantidad; burstRef.current = ''; fastRunRef.current = 0; lastKeyTimeRef.current = 0; onFocusQty?.() }}
              onBlur={() => { burstRef.current = ''; fastRunRef.current = 0 }}
              value={cantidad}
              onChange={(e) => commit(e.target.value)}
              onKeyDown={(e) => {
                const now = performance.now()
                if (e.key >= '0' && e.key <= '9') {
                  burstRef.current += e.key
                  fastRunRef.current = now - lastKeyTimeRef.current <= SCAN_GAP_MS ? fastRunRef.current + 1 : 1
                  lastKeyTimeRef.current = now
                  return
                }
                if (e.key === 'Enter' || e.key === 'Tab') {
                  const seq = burstRef.current
                  const allFast = fastRunRef.current === seq.length && seq.length > 0
                  burstRef.current = ''
                  fastRunRef.current = 0
                  lastKeyTimeRef.current = 0
                  if (seq.length >= UNCONDITIONAL_SCAN_LEN || (seq.length >= MIN_SCAN_LEN && allFast)) {
                    e.preventDefault()
                    onCantidadChange(Math.max(min, focusValueRef.current))
                    onScan?.(seq)
                    return
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onEnter?.()
                  }
                  return
                }
                burstRef.current = ''
                fastRunRef.current = 0
                if (e.key === 'Escape') {
                  e.preventDefault()
                  e.stopPropagation()
                  ;(onEscape || onRemove)()
                  onEnter?.()
                }
              }}
              className={`${decimales > 0 ? 'w-12 xl:w-16' : 'w-9 xl:w-11'} h-5 text-center border border-slate-200 rounded px-0.5 text-[11px] font-bold tabular-nums text-[oklch(0.52_0.255_278)] bg-[oklch(0.52_0.255_278_/_0.06)] focus:outline-none focus:ring-1 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)] xl:h-6 xl:rounded-md xl:text-[12px]`}
          />

          <button type="button"
            onClick={() => {
              onCantidadChange(Math.round((cantidad + step) * Math.pow(10, decimales)) / Math.pow(10, decimales))
              onEnter?.()
            }}
            className="flex h-5 w-5 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:border-[oklch(0.52_0.255_278_/_0.50)] hover:bg-[oklch(0.52_0.255_278_/_0.05)] hover:text-[oklch(0.52_0.255_278)] active:scale-90 transition-all duration-100 xl:h-6 xl:w-6 xl:rounded-md"
            aria-label={`Aumentar cantidad de ${nombre}`}
          >
            <Plus size={10} strokeWidth={2.5} className="xl:hidden" />
            <Plus size={12} strokeWidth={2.5} className="hidden xl:block" />
          </button>
        </div>

        <div className="shrink-0 w-4 flex items-center justify-end xl:w-[18px]">
          {removeButton ?? (
            <button type="button" onClick={onRemove}
              className="flex h-4 w-4 items-center justify-center rounded text-slate-300 hover:text-red-500 hover:bg-red-50 active:scale-90 transition-all duration-100"
              aria-label={`Quitar ${nombre} del carrito`}
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
