import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import type { SucursalDto, GastoDto, CajaDto } from '../types'

function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatFecha(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

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
      // Refetch list
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Gastos</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">{success}</div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : !cajaActiva ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-gray-500 mb-2">No hay caja abierta</p>
          <p className="text-sm text-gray-400">Abrí una caja para registrar gastos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Nuevo gasto</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto
                </label>
                <input
                  type="number" step="0.01" min="0.01"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detalle
                </label>
                <input
                  type="text"
                  value={detalle}
                  onChange={e => setDetalle(e.target.value)}
                  placeholder="Ej: Flete, limpieza, etc."
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-2 py-1.5 rounded-lg">{formError}</div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Registrando...' : 'Registrar gasto'}
              </button>
            </form>
          </div>

          {/* List section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Gastos registrados ({gastos.length})
            </h2>

            {gastos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No hay gastos registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <th className="pb-2 pr-3">Fecha</th>
                      <th className="pb-2 pr-3 text-right">Monto</th>
                      <th className="pb-2">Detalle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gastos.map(g => (
                      <tr key={g.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">{formatFecha(g.fecha)}</td>
                        <td className="py-2 pr-3 text-right font-medium">{formatCurrency(g.monto)}</td>
                        <td className="py-2 text-gray-700">{g.detalle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
