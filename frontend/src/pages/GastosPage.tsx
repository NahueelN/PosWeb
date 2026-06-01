import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
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

  // Form state
  const [monto, setMonto] = useState('')
  const [detalle, setDetalle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

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
      } else {
        setCajaActiva(null)
        setGastos([])
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar gastos')
    } finally {
      setLoading(false)
    }
  }, [sucursal])

  useEffect(() => { loadData() }, [loadData])

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
      await api.gastos.crear({ monto: montoNum, detalle: detalle.trim() })
      setMonto('')
      setDetalle('')
      setSuccess('Gasto registrado correctamente')
      if (cajaActiva) {
        const gastosRes = await api.gastos.listar(cajaActiva.id)
        setGastos(gastosRes.items)
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
                <input
                  type="number" step="0.01" min="0.01"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  placeholder="0.00"
                  className={inputClass}
                  required
                />
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
                      <th className="pb-2 pr-3 text-right">Monto</th>
                      <th className="pb-2">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {gastos.map(g => (
                      <tr key={g.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-2.5 pr-3 text-gray-600 whitespace-nowrap">{formatDate(g.fecha)}</td>
                        <td className="py-2.5 pr-3 text-right font-medium">{formatCurrency(g.monto)}</td>
                        <td className="py-2.5 text-gray-700">{g.detalle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
