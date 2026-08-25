import { useRef, type ReactNode, type RefObject } from 'react'
import { PRODUCT_ROW_GRID } from './ProductRow'

// ── Header ─────────────────────────────────────────────────────────
const HEADER_CELL = 'truncate'
const HEADER_CELL_RIGHT = 'text-right truncate'

export function ProductGridHeader() {
  return (
    <div
      className={[
        PRODUCT_ROW_GRID,
        'px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400',
      ].join(' ')}
    >
      <span className={HEADER_CELL}>Código</span>
      <span className={HEADER_CELL}>Descripción</span>
      <span className={HEADER_CELL_RIGHT}>Stock</span>
      <span className={HEADER_CELL_RIGHT}>Precio</span>
      <span />
    </div>
  )
}

// ── Types ──────────────────────────────────────────────────────────
interface ProductGridRowsProps {
  children: ReactNode
  searchInputRef: RefObject<HTMLInputElement | null>
  header?: ReactNode
}

// ── Container ──────────────────────────────────────────────────────
export default function ProductGridRows({
  children,
  searchInputRef,
  header,
}: ProductGridRowsProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const rows = Array.from(
      gridRef.current?.querySelectorAll<HTMLButtonElement>('[data-product-row]') ?? []
    )
    const idx = rows.indexOf(document.activeElement as HTMLButtonElement)
    if (idx === -1) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      rows[Math.min(idx + 1, rows.length - 1)]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (idx === 0) searchInputRef.current?.focus()
      else rows[idx - 1]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      rows[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      rows[rows.length - 1]?.focus()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      searchInputRef.current?.focus()
    }
  }

  return (
    <>
      {header}
      <div ref={gridRef} className="flex flex-col gap-1" onKeyDown={handleKeyDown}>
        {children}
      </div>
    </>
  )
}
