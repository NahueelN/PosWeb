import { type RefObject } from 'react'
import { Search, X, PackageSearch, Plus, Sparkles } from 'lucide-react'
import ProductCard, { formatCodigoBarra } from '../../components/shared/ProductCard'
import KeyboardHints from '../../components/shared/KeyboardHints'
import type { ProductoDto, ComboDto, UnidadMedidaDto } from '../../types'

interface VentaProductGridProps {
  productosLoading: boolean
  searchQuery: string
  onSearchChange: (q: string) => void
  searchInputRef: RefObject<HTMLInputElement | null>
  productGridRef: RefObject<HTMLDivElement | null>
  filteredProductos: ProductoDto[]
  filteredCombos: ComboDto[]
  unidadesMap: Map<number, string>
  ofertasMap: Map<number, { descuento: number }>
  onAgregarProducto: (p: ProductoDto) => void
  onAgregarCombo: (c: ComboDto) => void
  combos: ComboDto[]
  medioRefs: RefObject<(HTMLButtonElement | null)[]>
  cartItemsLength: number
}

export default function VentaProductGrid({
  productosLoading, searchQuery, onSearchChange, searchInputRef, productGridRef,
  filteredProductos, filteredCombos, unidadesMap, ofertasMap,
  onAgregarProducto, onAgregarCombo, combos, medioRefs, cartItemsLength,
}: VentaProductGridProps) {
  return (
    <div className="flex-1 min-h-0">
      <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="h-full overflow-y-auto p-4">
          <div className="relative mb-4">
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
                  if (e.key === 'Enter' && !q && cartItemsLength > 0) { medioRefs.current[0]?.focus(); return }
                  setTimeout(() => { productGridRef.current?.querySelector<HTMLButtonElement>('button')?.focus() }, 0)
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
          <KeyboardHints showEnter={cartItemsLength > 0} />
          {productosLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-500 text-sm">Cargando productos…</span>
            </div>
          ) : filteredProductos.length === 0 && filteredCombos.length === 0 && searchQuery.trim() ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <PackageSearch size={24} strokeWidth={1.5} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium text-sm">Sin resultados para esta búsqueda</p>
            </div>
          ) : filteredProductos.length === 0 && filteredCombos.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <PackageSearch size={24} strokeWidth={1.5} className="text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium text-sm">No hay productos disponibles</p>
            </div>
          ) : (
            <div ref={productGridRef}
              className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
              onKeyDown={(e) => {
                const buttons = Array.from(productGridRef.current?.querySelectorAll('button') ?? [])
                const currentIdx = buttons.indexOf(e.target as HTMLButtonElement)
                if (currentIdx === -1) return
                const gridEl = productGridRef.current
                if (!gridEl) return
                let cols = 2
                try { cols = getComputedStyle(gridEl).gridTemplateColumns.split(' ').length } catch {}
                if (e.key === 'ArrowRight') { e.preventDefault(); const next = Math.min(currentIdx + 1, buttons.length - 1); if (next !== currentIdx) buttons[next]?.focus() }
                else if (e.key === 'ArrowLeft') { e.preventDefault(); if (currentIdx > 0) buttons[currentIdx - 1]?.focus() }
                else if (e.key === 'ArrowDown') { e.preventDefault(); const next = Math.min(currentIdx + cols, buttons.length - 1); if (next !== currentIdx) buttons[next]?.focus() }
                else if (e.key === 'ArrowUp') { e.preventDefault(); if (currentIdx - cols < 0) { searchInputRef.current?.focus() } else { buttons[currentIdx - cols]?.focus() } }
                else if (e.key === 'Escape') { e.preventDefault(); searchInputRef.current?.focus() }
                else if (e.key === 'Tab' && !e.shiftKey && cartItemsLength > 0) { e.preventDefault(); medioRefs.current[0]?.focus() }
                else if (e.key === 'Tab' && e.shiftKey && currentIdx === 0) { e.preventDefault(); searchInputRef.current?.focus() }
              }}>
              {filteredProductos.map((p) => {
                const oferta = ofertasMap.get(p.id)
                return (
                  <ProductCard key={p.id} producto={p} unidadesMap={unidadesMap} onClick={() => onAgregarProducto(p)}
                    ofertaDescuento={oferta?.descuento}
                    price={<span className="text-[16px] font-bold">${p.precio.toFixed(2)}</span>} />
                )
              })}
              {filteredCombos.map((c) => (
                <button key={`combo-${c.id}`} onClick={() => onAgregarCombo(c)}
                  className="group relative flex flex-col text-left w-full bg-white rounded-xl border border-purple-200 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.11),0_2px_6px_-2px_rgba(0,0,0,0.06)] active:scale-[0.972] active:shadow-[0_1px_3px_0_rgba(0,0,0,0.07)] active:translate-y-0 active:duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30 focus-visible:ring-offset-2 shadow-[0_1px_3px_0_rgba(0,0,0,0.07),0_1px_2px_-1px_rgba(0,0,0,0.05)]">
                  <span className="absolute top-2.5 right-2.5 z-10 flex items-center gap-0.5 rounded-md bg-[oklch(0.52_0.255_278_/_0.10)] px-1.5 py-[3px] text-[9px] font-bold uppercase tracking-widest text-[oklch(0.52_0.255_278)] leading-none border border-[oklch(0.52_0.255_278_/_0.15)]">
                    <Sparkles size={7} strokeWidth={3} />
                    COMBO
                  </span>
                  <div className="flex flex-1 flex-col gap-0 p-3.5 pb-3 pr-14">
                    <p className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.6em]">{c.descCombo}</p>
                    <p className="mt-1.5 font-mono text-[9.5px] text-gray-400/50 tracking-[0.08em] truncate">{c.codCombo}</p>
                  </div>
                  <div className="flex items-center justify-between px-3.5 py-2.5 mt-auto rounded-b-xl border-t border-purple-100 bg-purple-50/30 group-hover:bg-purple-100/40 transition-colors duration-150">
                    <span className="text-[15px] font-bold text-purple-700 leading-none tabular-nums">${c.precio.toFixed(2)}</span>
                    <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-purple-200 text-purple-500 group-hover:bg-purple-600 group-hover:text-white group-hover:shadow-sm group-hover:shadow-purple-500/25 transition-all duration-150" aria-hidden="true">
                      <Plus size={12} strokeWidth={2.75} />
                    </span>
                  </div>
                  {c.diasSemana && (
                    <p className="px-3.5 pb-1.5 text-[9px] text-purple-400">{c.diasSemana.split(',').join('/')}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
