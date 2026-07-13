import { useRef, type ReactNode } from 'react'

interface Props {
  searchQuery: string
  onSearchChange: (q: string) => void
  children: ReactNode
  showHints?: boolean
  searchPlaceholder?: string
  /** Ref opcional para que el padre pueda acceder al input de búsqueda */
  searchInputRef?: React.RefObject<HTMLInputElement | null>
  /** Llamado al presionar Enter con texto o pegar un código de barras */
  onBarcodeLookup?: (codigo: string) => void
}

/**
 * Panel reutilizable de búsqueda + grilla de productos con navegación por teclado.
 *
 * - Enter / ↓ en la búsqueda → foco al primer producto de la grilla.
 * - ← → ↑ ↓ navegan la grilla. ↑ desde la primera fila vuelve a la búsqueda.
 * - Shift+Tab desde el primer producto vuelve a la búsqueda.
 * - El padre inyecta cada card con data-card (p. ej. &lt;button data-card&gt;).
 */
export default function ProductCardPanel({
  searchQuery,
  onSearchChange,
  children,
  showHints = false,
  searchPlaceholder = 'Buscá producto por código de barra o nombre…',
  searchInputRef: externalSearchRef,
  onBarcodeLookup,
}: Props) {
  const internalSearchRef = useRef<HTMLInputElement>(null!)
  const gridRef = useRef<HTMLDivElement>(null!)
  const searchRef = externalSearchRef ?? internalSearchRef

  function focusFirstCard() {
    setTimeout(() => {
      gridRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    }, 0)
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && searchQuery.trim() && onBarcodeLookup) {
      e.preventDefault()
      onBarcodeLookup(searchQuery.trim())
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault()
      focusFirstCard()
    }
  }

  function handleGridKeyDown(e: React.KeyboardEvent) {
    const cards = Array.from(gridRef.current?.children ?? []).filter(
      (el): el is HTMLElement => el.tagName === 'BUTTON'
    )
    const currentIdx = cards.indexOf(e.target as HTMLElement)
    if (currentIdx === -1) return

    const gridEl = gridRef.current
    if (!gridEl) return

    let cols = 2
    try {
      cols = getComputedStyle(gridEl).gridTemplateColumns.split(' ').length
    } catch {
      // fallback
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = Math.min(currentIdx + 1, cards.length - 1)
      if (next !== currentIdx) cards[next]?.focus()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (currentIdx > 0) cards[currentIdx - 1]?.focus()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const next = Math.min(currentIdx + cols, cards.length - 1)
      if (next !== currentIdx) cards[next]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (currentIdx - cols < 0) {
        searchRef.current?.focus()
      } else {
        cards[currentIdx - cols]?.focus()
      }
    } else if (e.key === 'Tab' && e.shiftKey && currentIdx === 0) {
      e.preventDefault()
      searchRef.current?.focus()
    }
  }

  function handleClear() {
    onSearchChange('')
    searchRef.current?.focus()
  }

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          ref={searchRef}
          id="search-productos"
          className="w-full pl-11 pr-20 py-3.5 bg-white border border-gray-200 rounded-xl shadow-sm text-base placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          onPasteCapture={(e) => {
            if (!onBarcodeLookup) return
            const text = e.clipboardData.getData('text/plain').trim()
            if (!text) return
            e.preventDefault()
            e.stopPropagation()
            onBarcodeLookup(text)
          }}
          autoFocus
        />
        {onBarcodeLookup && (
          <button
            type="button"
            onClick={() => { if (searchQuery.trim()) onBarcodeLookup(searchQuery.trim()) }}
            className="absolute right-9 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center text-indigo-500 hover:text-indigo-700 transition-colors"
            title="Buscar"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
        )}
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Keyboard hints */}
      {showHints && (
        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-mono border border-gray-200 shadow-[0_1px_0_0_#e5e7eb]">←</kbd>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-mono border border-gray-200 shadow-[0_1px_0_0_#e5e7eb]">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-mono border border-gray-200 shadow-[0_1px_0_0_#e5e7eb]">→</kbd>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-mono border border-gray-200 shadow-[0_1px_0_0_#e5e7eb]">↓</kbd>
            <span>Productos</span>
          </span>
        </div>
      )}

      {/* Grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
        onKeyDown={handleGridKeyDown}
      >
        {children}
      </div>
    </div>
  )
}
