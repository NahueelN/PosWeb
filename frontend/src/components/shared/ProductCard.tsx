import type { ReactNode } from 'react'
import type { ProductoDto } from '../../types'
import { Plus, Sparkles } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────

export interface ProductCardProps {
  producto: ProductoDto
  unidadesMap: Map<number, string>
  onClick: () => void
  price: ReactNode
  isCombo?: boolean
  ofertaDescuento?: number
  disponibilidad?: string
}

// ── Helpers ────────────────────────────────────────────────────────

function getPresentacion(p: ProductoDto, unidadesMap: Map<number, string>): string | undefined {
  return p.contenido && p.unidadMedidaId
    ? `${p.contenido} ${unidadesMap.get(p.unidadMedidaId) ?? ''}`
    : undefined
}

/** Codigo barra + presentación opcional */
export function formatCodigoBarra(p: ProductoDto, unidadesMap: Map<number, string>): string {
  const pres = getPresentacion(p, unidadesMap)
  return pres ? `${p.codigoBarra} · ${pres}` : p.codigoBarra
}

// ── Component ──────────────────────────────────────────────────────

export default function ProductCard({
  producto: p,
  unidadesMap,
  onClick,
  price,
  isCombo = false,
  ofertaDescuento,
  disponibilidad,
}: ProductCardProps) {
  const presentacion = getPresentacion(p, unidadesMap)
  const precioOferta = ofertaDescuento ? p.precio * (1 - ofertaDescuento / 100) : null

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col text-left w-full bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.07),0_1px_2px_-1px_rgba(0,0,0,0.05)] hover:border-[oklch(0.52_0.255_278_/_0.30)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.11),0_2px_6px_-2px_rgba(0,0,0,0.06)] active:scale-[0.972] active:shadow-[0_1px_3px_0_rgba(0,0,0,0.07)] active:translate-y-0 active:duration-75 transition-all duration-150"
    >
      {isCombo && (
        <span className="absolute top-1.5 right-2 z-10 flex items-center gap-0.5 rounded-md bg-[oklch(0.52_0.255_278_/_0.10)] px-1.5 py-[2px] text-[9px] font-bold uppercase tracking-widest text-[oklch(0.52_0.255_278)] leading-none border border-[oklch(0.52_0.255_278_/_0.15)]">
          <Sparkles size={7} strokeWidth={3} />
          COMBO
        </span>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col p-2 pb-1.5">
        <p className={['text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2', isCombo ? 'pr-12' : ''].join(' ')}>
          {p.nombre}
        </p>
        <p className="mt-0.5 font-mono text-[12px] text-gray-500 tracking-[0.04em] truncate">
          {presentacion ? `${p.codigoBarra} · ${presentacion}` : p.codigoBarra}
        </p>
      </div>

      {/* Footer: price + add button */}
      <div className="flex items-center justify-between px-2 py-1.5 mt-auto rounded-b-xl border-t border-gray-100 bg-gray-50/30 group-hover:bg-gray-100/50 transition-colors duration-150">
        <div className="flex flex-col">
          {precioOferta ? (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-400 line-through leading-none">${p.precio.toFixed(0)}</span>
              <span className="text-[17px] font-bold text-green-600 leading-none tabular-nums">${precioOferta.toFixed(0)}</span>
              <span className="rounded bg-green-100 px-1 text-[8px] font-bold text-green-700 leading-none">{ofertaDescuento}%</span>
            </div>
          ) : (
            <span className="text-[17px] font-bold text-[oklch(0.52_0.255_278)] leading-none tabular-nums">{price}</span>
          )}
        </div>
        <span className="flex h-[28px] w-[28px] items-center justify-center rounded-lg bg-gray-200 text-gray-400 group-hover:bg-[oklch(0.52_0.255_278)] group-hover:text-white group-hover:shadow-sm group-hover:shadow-[oklch(0.52_0.255_278_/_0.25)] transition-all duration-150" aria-hidden="true">
          <Plus size={14} strokeWidth={2.5} />
        </span>
      </div>
      {disponibilidad && (
        <p className="px-2 pb-1.5 text-[10px] text-gray-400">{disponibilidad}</p>
      )}
    </button>
  )
}
