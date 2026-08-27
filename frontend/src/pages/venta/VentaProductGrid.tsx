import { type RefObject } from 'react'
import { Search, X, PackageSearch, Sparkles } from 'lucide-react'
import { ProductRow, ProductGridRows, ProductGridHeader, PRODUCT_ROW_GRID } from '../../components/shared'
import KeyboardHints from '../../components/shared/KeyboardHints'
import type { ProductoDto, ComboDto } from '../../types'

interface VentaProductGridProps {
  productosLoading: boolean
  searchQuery: string
  onSearchChange: (q: string) => void
  searchInputRef: RefObject<HTMLInputElement | null>
  filteredProductos: ProductoDto[]
  filteredCombos: ComboDto[]
  ofertasMap: Map<number, { descuento: number }>
  onAgregarProducto: (p: ProductoDto) => void
  onAgregarCombo: (c: ComboDto) => void
  combos: ComboDto[]
  medioRefs: RefObject<(HTMLButtonElement | null)[]>
  cartItemsLength: number
  confirmBtnRef?: RefObject<HTMLButtonElement | null>
  pagoExacto?: boolean
}

export default function VentaProductGrid({
  productosLoading, searchQuery, onSearchChange, searchInputRef,
  filteredProductos, filteredCombos, ofertasMap,
  onAgregarProducto, onAgregarCombo, combos, medioRefs, cartItemsLength,
  confirmBtnRef, pagoExacto,
}: VentaProductGridProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div className="p-4 pb-0 shrink-0">
          <div className="relative">
            <Search size={20} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input ref={searchInputRef} id="search-producto"
              autoComplete="off"
              className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-10 text-[13.5px] text-gray-900 placeholder:text-gray-400 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)]"
              placeholder="Buscá producto por código de barra o nombre…" value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Escape') { if (searchQuery) { e.preventDefault(); onSearchChange(''); searchInputRef.current?.focus() } return }
                if (e.key === 'Tab' && !e.shiftKey && cartItemsLength > 0) { e.preventDefault(); medioRefs.current[0]?.focus() }
                if (e.key === 'ArrowDown' || e.key === 'Enter') {
                  e.preventDefault()
                  const q = searchQuery.trim().toUpperCase()
                  if (e.key === 'Enter' && q) { const combo = combos.find(c => c.codCombo === q); if (combo) { onAgregarCombo(combo); onSearchChange(''); return }; onSearchChange('') }
                  if (e.key === 'Enter' && !q && cartItemsLength > 0) {
                    if (pagoExacto) { confirmBtnRef?.current?.focus() }
                    else { medioRefs.current[0]?.focus() }
                    return
                  }
                  setTimeout(() => { document.querySelector<HTMLElement>('[data-product-row]')?.focus() }, 0)
                }
              }}
              autoFocus />
            {searchQuery && (
              <button type="button" onClick={() => { onSearchChange(''); searchInputRef.current?.focus() }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
                <X size={14} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <KeyboardHints showEnter={cartItemsLength > 0} />
          {productosLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-500 text-sm">Cargando productos…</span>
            </div>
          ) : filteredProductos.length === 0 && filteredCombos.length === 0 && searchQuery.trim() ? (
            <ProductGridRows searchInputRef={searchInputRef} header={<ProductGridHeader />}>
              <div
                className={[
                  PRODUCT_ROW_GRID,
                  'w-full text-left px-3 py-2 rounded-lg border border-gray-100 bg-gray-50',
                ].join(' ')}
              >
                <span className="font-mono text-[12px] text-gray-600 truncate">{searchQuery.trim()}</span>
              </div>
            </ProductGridRows>
          ) : filteredProductos.length === 0 && filteredCombos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <PackageSearch size={24} strokeWidth={1.5} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium text-sm">No hay productos disponibles</p>
            </div>
          ) : (
            <ProductGridRows searchInputRef={searchInputRef} header={<ProductGridHeader />}>
              {filteredProductos.map((p) => {
                const oferta = ofertasMap.get(p.id)
                const precioOferta = oferta ? p.precio * (1 - oferta.descuento / 100) : null
                return (
                  <ProductRow
                    key={p.id}
                    id={p.id}
                    codigo={p.codigoBarra}
                    nombre={p.nombre}
                    stock={p.stock}
                    precio={precioOferta != null ? (
                      <span className="flex items-center justify-end gap-1">
                        <span className="text-[11px] text-gray-400 line-through tabular-nums">${p.precio.toFixed(0)}</span>
                        <span className="text-green-600 tabular-nums">${precioOferta.toFixed(0)}</span>
                        <span className="rounded bg-green-100 px-1 text-[9px] font-bold text-green-700 leading-none">{oferta!.descuento}%</span>
                      </span>
                    ) : <span>${p.precio.toFixed(2)}</span>}
                    onClick={() => onAgregarProducto(p)}
                  />
                )
              })}
              {filteredCombos.map((c) => (
                <ProductRow
                  key={`combo-${c.id}`}
                  codigo={c.codCombo}
                  nombre={c.descCombo}
                  precio={<span className="text-purple-700">${c.precio.toFixed(2)}</span>}
                  onClick={() => onAgregarCombo(c)}
                  badge={
                    <span className="flex items-center gap-0.5 rounded-md bg-[oklch(0.52_0.255_278_/_0.10)] px-1.5 py-[2px] text-[9px] font-bold uppercase tracking-widest text-[oklch(0.52_0.255_278)] leading-none border border-[oklch(0.52_0.255_278_/_0.15)]">
                      <Sparkles size={7} strokeWidth={3} />
                      COMBO
                    </span>
                  }
                />
              ))}
            </ProductGridRows>
          )}
        </div>
      </div>
    </div>
  )
}
