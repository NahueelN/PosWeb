import { useEffect, useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Search, X } from 'lucide-react'
import type { CajaDto, MovimientoCajaDto, VentaDetalleDto } from '../../types'
import { api } from '../../api/client'
import { formatCurrency, formatDate } from '../../formats'
import VentaDetalleModal from './VentaDetalleModal'

interface MovimientosCajaModalProps {
  caja: CajaDto
  onClose: () => void
}

type FiltroTipo = 'todos' | 'Venta' | 'Gasto'

function fechaHora(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MovimientosCajaModal({ caja, onClose }: MovimientosCajaModalProps) {
  const [movimientos, setMovimientos] = useState<MovimientoCajaDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [ventaDetalle, setVentaDetalle] = useState<VentaDetalleDto | null>(null)

  useEffect(() => {
    let mounted = true
    api.cajas.movimientos(caja.id)
      .then(res => { if (mounted) setMovimientos(res.items) })
      .catch(e => { if (mounted) setError(e instanceof Error ? e.message : String(e)) })
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [caja.id])

  const ingresos = movimientos.filter(m => m.tipo === 'Venta' && !m.anulado).reduce((s, m) => s + m.monto, 0)
  const egresos = movimientos.filter(m => m.tipo === 'Gasto' && !m.anulado).reduce((s, m) => s + m.monto, 0)

  const visibles = useMemo(() => {
    const q = busqueda.replace(/[^\d.,-]/g, '').trim()
    return movimientos.filter(m => {
      if (filtroTipo !== 'todos' && m.tipo !== filtroTipo) return false
      if (!q) return true
      return String(m.monto).includes(q)
    })
  }, [movimientos, filtroTipo, busqueda])

  const toggleFiltro = (tipo: FiltroTipo) => setFiltroTipo(prev => (prev === tipo ? 'todos' : tipo))

  async function abrirVenta(movimiento: MovimientoCajaDto) {
    try {
      const detalle = await api.ventas.detalle(movimiento.referenciaId)
      setVentaDetalle(detalle)
    } catch {
      // El detalle es informativo: si falla, no interrumpimos el listado.
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
          <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Movimientos de la caja</h2>
              <p className="text-xs text-gray-400 mt-0.5">{formatDate(caja.fechaCierre ?? caja.fechaApertura)}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
          </div>

          <div className="grid grid-cols-3 gap-2 px-6 py-4">
            <button
              type="button"
              onClick={() => toggleFiltro('Venta')}
              aria-pressed={filtroTipo === 'Venta'}
              title="Ver solo ingresos"
              className={`rounded-xl px-3 py-2 text-center transition-all ${
                filtroTipo === 'Venta' ? 'bg-emerald-100 ring-2 ring-emerald-400' : 'bg-emerald-50 hover:bg-emerald-100/70'
              }`}
            >
              <p className="text-[11px] text-emerald-700 uppercase tracking-wide">Ingresos</p>
              <p className="text-sm font-bold text-emerald-700 tabular-nums">{formatCurrency(ingresos)}</p>
            </button>
            <button
              type="button"
              onClick={() => toggleFiltro('Gasto')}
              aria-pressed={filtroTipo === 'Gasto'}
              title="Ver solo egresos"
              className={`rounded-xl px-3 py-2 text-center transition-all ${
                filtroTipo === 'Gasto' ? 'bg-red-100 ring-2 ring-red-400' : 'bg-red-50 hover:bg-red-100/70'
              }`}
            >
              <p className="text-[11px] text-red-700 uppercase tracking-wide">Egresos</p>
              <p className="text-sm font-bold text-red-700 tabular-nums">{formatCurrency(egresos)}</p>
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('todos')}
              aria-pressed={filtroTipo === 'todos'}
              title="Ver todos"
              className={`rounded-xl px-3 py-2 text-center transition-all ${
                filtroTipo === 'todos' ? 'bg-gray-100 ring-2 ring-gray-300' : 'bg-gray-50 hover:bg-gray-100/70'
              }`}
            >
              <p className="text-[11px] text-gray-500 uppercase tracking-wide">Neto</p>
              <p className="text-sm font-bold text-gray-900 tabular-nums">{formatCurrency(ingresos - egresos)}</p>
            </button>
          </div>

          <div className="px-6 pb-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                inputMode="decimal"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Filtrar por monto…"
                className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)]"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  title="Limpiar filtro"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-2 text-sm text-gray-500">Cargando movimientos…</span>
              </div>
            ) : error ? (
              <p className="text-sm text-red-500 text-center py-10">{error}</p>
            ) : movimientos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No hay movimientos registrados.</p>
            ) : visibles.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">Sin resultados para el filtro aplicado.</p>
            ) : (
              <ul className="divide-y-2 divide-gray-200">
                {visibles.map((m, i) => {
                  const esVenta = m.tipo === 'Venta'
                  const contenido = (
                    <>
                      <span className={`shrink-0 ${esVenta ? 'text-emerald-500' : 'text-red-500'}`}>
                        {esVenta ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium text-gray-800 truncate ${m.anulado ? 'line-through' : ''}`}>{m.descripcion}</p>
                        <p className="text-[11px] text-gray-400">
                          {fechaHora(m.fecha)} · {m.tipo}
                          {m.anulado && <span className="ml-1 text-red-500 font-medium">({esVenta ? 'anulada' : 'anulado'})</span>}
                          {esVenta && <span className="ml-1 text-gray-400">· ver detalle</span>}
                        </p>
                      </div>
                      <span className={`shrink-0 text-sm font-semibold tabular-nums ${m.anulado ? 'text-gray-400 line-through' : esVenta ? 'text-emerald-600' : 'text-red-600'}`}>
                        {esVenta ? '+' : '-'}{formatCurrency(m.monto)}
                      </span>
                    </>
                  )
                  return (
                    <li key={`${m.tipo}-${m.referenciaId}-${i}`}>
                      {esVenta ? (
                        <button
                          type="button"
                          onClick={() => abrirVenta(m)}
                          className={`w-full flex items-center gap-3 py-2.5 text-left rounded-lg transition-colors hover:bg-gray-50 ${m.anulado ? 'opacity-50' : ''}`}
                        >
                          {contenido}
                        </button>
                      ) : (
                        <div className={`flex items-center gap-3 py-2.5 ${m.anulado ? 'opacity-50' : ''}`}>
                          {contenido}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      {ventaDetalle && (
        <VentaDetalleModal venta={ventaDetalle} onClose={() => setVentaDetalle(null)} />
      )}
    </>
  )
}
