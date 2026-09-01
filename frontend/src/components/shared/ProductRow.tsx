import type { ReactNode } from 'react'

// ── Shared grid template ───────────────────────────────────────────
// 7 columns: codigo | nombre | marca | presentacion | stock | precio | accion
export const PRODUCT_ROW_GRID =
  'grid grid-cols-[98px_minmax(0,1fr)_44px_78px_48px] items-center gap-x-2'

export const PRODUCT_ROW_GRID_NO_ACTION =
  'grid grid-cols-[98px_minmax(0,1fr)_44px_78px] items-center gap-x-2'

// ── Types ──────────────────────────────────────────────────────────
export interface ProductRowProps {
  id?: number | string
  codigo: string
  nombre: string
  stock?: string | number | null
  precio: ReactNode
  onClick: () => void
  action?: ReactNode
  badge?: ReactNode
}

// ── Component ──────────────────────────────────────────────────────
export default function ProductRow({
  id,
  codigo,
  nombre,
  stock = null,
  precio,
  onClick,
  action,
  badge,
}: ProductRowProps) {
  return (
    <button
      type="button"
      data-product-row
      data-card-id={id}
      onClick={onClick}
      className={[
        action ? PRODUCT_ROW_GRID : PRODUCT_ROW_GRID_NO_ACTION,
        'w-full text-left px-3 py-2 rounded-lg border border-gray-100',
        'hover:bg-indigo-50/50 hover:border-indigo-200',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500',
        'transition-colors bg-white',
      ].join(' ')}
    >
      {/* 1. Código */}
      <span className="font-mono text-[12px] text-gray-500 truncate">{codigo}</span>

      {/* 2. Nombre + badge */}
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="font-medium text-gray-900 truncate">{nombre}</span>
        {badge}
      </span>

      {/* 3. Stock */}
      <span className="text-right tabular-nums text-gray-500">
        {stock == null || stock === '' ? '' : stock}
      </span>

      {/* 4. Precio */}
      <span className="text-right font-bold tabular-nums text-gray-900">{precio}</span>

      {/* 5. Acción */}
      {action != null && (
        <span
          className="flex justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          {action}
        </span>
      )}
    </button>
  )
}
