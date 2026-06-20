import { useState, useEffect, useCallback, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import type { SucursalDto, GastoDto, CajaDto } from '../types'
import { formatCurrency, formatDate } from '../formats'
import PageHeader from '../components/ui/PageHeader'
import AlertBanner from '../components/ui/AlertBanner'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'

// ── Helpers ──────────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm ' +
  'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all'

const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

// ── Component ────────────────────────────────────────────────────────

export default function GastosPage() {
  const { sucursal } = useOutletContext<{ sucursal: SucursalDto | null }>()
  const [cajaActiva, setCajaActiva] = useState<CajaDto | null>(null)
  const [gastos, setGastos] = useState<GastoDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [historial, setHistorial] = useState<GastoDto[]>([])
  const [historialLoading, setHistorialLoading] = useState(false)
  const [busquedaHistorial, setBusquedaHistorial] = useState('')

  const historialFiltrado = useMemo(() => {
    if (!busquedaHistorial.trim()) return historial
    const q = busquedaHistorial.toLowerCase()
    return historial.filter(g =>
      g.detalle.toLowerCase().includes(q) ||
      g.monto.toString().includes(q) ||
      formatDate(g.fecha).toLowerCase().includes(q)
    )
  }, [historial, busquedaHistorial])

  // Form state
  const [monto, setMonto] = useState('')
  const [detalle, setDetalle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fuenteGasto, setFuenteGasto] = useState<'caja' | 'ahorro' | 'dividir'>('caja')
  const [montoCaja, setMontoCaja] = useState(0)
  const [montoAhorro, setMontoAhorro] = useState(0)
  const [undoGastoId, setUndoGastoId] = useState<number | null>(null)
  const [undoLoading, setUndoLoading] = useState(false)

  const loadData = useCallback(async () => {
    if (!sucursal) return
    setLoading(true)
    setError('')
    try {
      const res = await api.cajas.activa(sucursal.id)
      if (res.activa && res.caja) {
        setCajaActiva(res.caja)
        const gastosRes = await api.gastos.listar(res.caja.id)
        setGastos(gastosRes.items)
        // Load historial excluding current caja
        setHistorialLoading(true)
        try {
          const histRes = await api.gastos.historial(res.caja.id)
          setHistorial(histRes.items)
        } catch { setHistorial([]) }
        finally { setHistorialLoading(false) }
      } else {
        setCajaActiva(null)
        setGastos([])
        // Load all gastos as historial
        setHistorialLoading(true)
        try {
          const histRes = await api.gastos.historial()
          setHistorial(histRes.items)
        } catch { setHistorial([]) }
        finally { setHistorialLoading(false) }
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar gastos')
    } finally {
      setLoading(false)
    }
  }, [sucursal])

  useEffect(() => { loadData() }, [loadData])

  async function handleUndoGasto() {
    if (undoGastoId === null) return
    setUndoLoading(true)
    try {
      await api.gastos.anular(undoGastoId)
      setSuccess('Gasto anulado')
      setUndoGastoId(null)
      loadData()
    } catch (err: any) {
      setError(err.message || 'Error al anular gasto')
    } finally {
      setUndoLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum <= 0) {
      setFormError('El monto debe ser un número positivo')
      return
    }
    if (!detalle.trim()) {
      setFormError('El detalle es requerido')
      return
    }
    if (detalle.trim().length > 500) {
      setFormError('El detalle no puede superar los 500 caracteres')
      return
    }

      setSubmitting(true)
    try {
      if (fuenteGasto === 'dividir' && (montoCaja + montoAhorro) > montoNum) {
        setFormError('La suma de Caja + Ahorro no puede superar el monto total')
        setSubmitting(false)
        return
      }
      await api.gastos.crear({
        monto: montoNum,
        detalle: detalle.trim(),
        fuentePago: fuenteGasto,
        montoPagadoCaja: fuenteGasto === 'dividir' ? montoCaja : undefined,
      })
      setMonto('')
      setDetalle('')
      setMontoCaja(0)
      setMontoAhorro(0)
      setFuenteGasto('caja')
      setSuccess('Gasto registrado correctamente')
      if (cajaActiva) {
        const gastosRes = await api.gastos.listar(cajaActiva.id)
        setGastos(gastosRes.items)
        // Refresh historial silently (don't break on failure)
        api.gastos.historial(cajaActiva.id).then(h => setHistorial(h.items)).catch(() => {})
      }
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar gasto')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gastos"
        subtitle={cajaActiva ? `${gastos.length} gastos registrados` : undefined}
      />

      {error && (
        <AlertBanner variant="error" message={error} onClose={() => setError('')} />
      )}

      {success && (
        <AlertBanner variant="success" message={success} onClose={() => setSuccess('')} />
      )}

      {loading ? (
        <Spinner text="Cargando gastos..." />
      ) : !cajaActiva ? (
        <Card padding="lg" className="text-center">
          <div className="py-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No hay caja abierta</p>
            <p className="text-sm text-gray-400 mt-1">Abrí una caja para registrar gastos</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Form section ──────────────────────────────────────── */}
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuevo gasto</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className={labelClass}>Monto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-mono">$</span>
                  <input
                    type="number" step="0.01" min="0.01"
                    value={monto}
                    onChange={e => setMonto(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Detalle</label>
                <input
                  type="text"
                  value={detalle}
                  onChange={e => setDetalle(e.target.value)}
                  placeholder="Ej: Flete, limpieza, etc."
                  maxLength={500}
                  className={inputClass}
                  required
                />
              </div>

              {/* Fuente selector */}
              <div>
                <label className={labelClass}>Fuente</label>
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {(['caja', 'ahorro', 'dividir'] as const).map(f => (
                    <button key={f} type="button" onClick={() => setFuenteGasto(f)}
                      className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                        fuenteGasto === f
                          ? f === 'caja' ? 'bg-indigo-500 text-white'
                          : f === 'ahorro' ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-100'
                      }`}>
                      {f === 'caja' ? '💵 Caja' : f === 'ahorro' ? '🏦 Ahorro' : '↔ Dividir'}
                    </button>
                  ))}
                </div>
              </div>

              {fuenteGasto === 'dividir' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-indigo-500 font-medium">$ Caja</span>
                      <input type="number" min={0} step="0.01"
                        value={montoCaja || ''} onChange={e => setMontoCaja(parseFloat(e.target.value) || 0)}
                        className="w-full pl-14 pr-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        placeholder="0.00" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-emerald-500 font-medium">$ Ahorro</span>
                      <input type="number" min={0} step="0.01"
                        value={montoAhorro || ''} onChange={e => setMontoAhorro(parseFloat(e.target.value) || 0)}
                        className="w-full pl-16 pr-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        placeholder="0.00" />
                    </div>
                  </div>
                </div>
              )}

              {formError && (
                <AlertBanner variant="error" message={formError} />
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Registrando...' : 'Registrar gasto'}
              </button>
            </form>
          </Card>

          {/* ── List section ──────────────────────────────────────── */}
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Gastos registrados ({gastos.length})
            </h3>

            {gastos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No hay gastos registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <th className="pb-2 pr-3">Fecha</th>
                      <th className="pb-2 pr-3">Usuario</th>
                      <th className="pb-2 pr-3 text-right">Monto</th>
                      <th className="pb-2">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {gastos.map(g => (
                      <tr key={g.id} className={`hover:bg-gray-100/80 hover:ring-1 hover:ring-gray-300 hover:ring-inset transition-all ${g.anulado ? 'bg-red-50/30' : ''}`}>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          <span className={g.anulado ? 'line-through text-gray-400 text-xs' : 'text-gray-600 text-xs'}>{formatDate(g.fecha)}</span>
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          <span className={g.anulado ? 'line-through text-gray-400 text-xs' : 'text-gray-500 text-xs'}>{g.usuarioNombre || '-'}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-right font-medium">
                          <span className={g.anulado ? 'line-through text-gray-400 text-xs' : 'text-xs'}>{formatCurrency(g.monto)}</span>
                        </td>
                        <td className="py-2.5 text-gray-700 flex items-center justify-between gap-4">
                          <span className={g.anulado ? 'line-through text-gray-400' : ''}>{g.detalle}</span>
                          {g.anulado ? (
                            <span className="text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">Anulado</span>
                          ) : (
                            <button onClick={() => setUndoGastoId(g.id)}
                              className="text-[10px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap">
                              Deshacer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Historial section ─────────────────────────────────────── */}
      {!loading && (
        <div className="border-t border-gray-200 pt-5">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-sm font-semibold text-gray-500">
              Historial de gastos{historial.length > 0 ? ` (${historial.length})` : ''}
            </h3>
            {historial.length > 0 && (
              <input
                type="text"
                value={busquedaHistorial}
                onChange={e => setBusquedaHistorial(e.target.value)}
                placeholder="Buscar..."
                className="w-48 px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all shadow-sm"
              />
            )}
          </div>
          {historialLoading ? (
            <Spinner text="Cargando historial..." />
          ) : historial.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No hay gastos anteriores</p>
          ) : historialFiltrado.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">Sin resultados para "{busquedaHistorial}"</p>
          ) : (
            <div className="overflow-x-auto max-h-64 overflow-y-auto border border-gray-100 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-2 pr-3">Fecha</th>
                    <th className="pb-2 pr-3">Usuario</th>
                    <th className="pb-2 pr-3 text-right">Monto</th>
                    <th className="pb-2">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {historialFiltrado.map(g => (
                    <tr key={g.id} className={`hover:bg-gray-100/80 hover:ring-1 hover:ring-gray-300 hover:ring-inset transition-all ${g.anulado ? 'bg-red-50/20' : ''}`}>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs">
                        <span className={g.anulado ? 'line-through text-gray-400' : 'text-gray-500'}>{formatDate(g.fecha)}</span>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap text-xs">
                        <span className={g.anulado ? 'line-through text-gray-400' : 'text-gray-400'}>{g.usuarioNombre || '-'}</span>
                      </td>
                      <td className="py-2 pr-3 text-right text-xs">
                        <span className={g.anulado ? 'line-through text-gray-400' : 'text-gray-600'}>{formatCurrency(g.monto)}</span>
                      </td>
                      <td className="py-2 text-xs flex items-center justify-between gap-4">
                        <span className={g.anulado ? 'line-through text-gray-400' : 'text-gray-500'}>{g.detalle}</span>
                        {g.anulado ? (
                          <span className="text-[10px] font-medium text-red-500 bg-red-100 px-1 py-0.5 rounded-full whitespace-nowrap">Anulado</span>
                        ) : (
                          <button onClick={() => setUndoGastoId(g.id)}
                            className="text-[10px] font-medium text-red-400 hover:text-red-600 hover:bg-red-50 px-1 py-0.5 rounded transition-colors whitespace-nowrap">
                            Deshacer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Undo confirmation modal */}
      {undoGastoId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
             onClick={() => setUndoGastoId(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full"
               onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Anular gasto</h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Anular el gasto #{undoGastoId}? Quedará marcado como anulado en el historial.
            </p>
            <div className="flex gap-3">
              <button onClick={handleUndoGasto} disabled={undoLoading}
                className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors text-sm">
                {undoLoading ? 'Anulando...' : 'Anular gasto'}
              </button>
              <button onClick={() => setUndoGastoId(null)}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
