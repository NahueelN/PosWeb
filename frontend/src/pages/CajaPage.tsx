import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import type { CajaDto, SucursalDto, CierrePreviewDto } from '../types'

export default function CajaPage() {
  const { sucursal } = useOutletContext<{ sucursal: SucursalDto | null }>()
  const [caja, setCaja] = useState<CajaDto | null>(null)
  const [activa, setActiva] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reporteCierre, setReporteCierre] = useState<CajaDto | null>(null)
  const [preview, setPreview] = useState<CierrePreviewDto | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Open form
  const [montoInicial, setMontoInicial] = useState('')

  // Close form
  const [montoEfectivo, setMontoEfectivo] = useState('')
  const [montoTarjetas, setMontoTarjetas] = useState('')

  const loadCaja = useCallback(async () => {
    if (!sucursal) return
    setLoading(true)
    try {
      const res = await api.cajas.activa(sucursal.id)
      setCaja(res.caja)
      setActiva(res.activa)
      if (res.activa && res.caja) {
        loadPreview(res.caja.id)
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar caja')
    } finally {
      setLoading(false)
    }
  }, [sucursal])

  const loadPreview = useCallback(async (cajaId: number) => {
    setLoadingPreview(true)
    try {
      const res = await api.cajas.previewCierre(cajaId)
      setPreview(res)
    } catch {
      // preview is optional UX improvement
    } finally {
      setLoadingPreview(false)
    }
  }, [])

  useEffect(() => { loadCaja() }, [loadCaja])

  async function handleAbrir(e: React.FormEvent) {
    e.preventDefault()
    if (!sucursal) return
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await api.cajas.abrir({
        sucursalId: sucursal.id,
        montoInicial: parseFloat(montoInicial) || 0,
      })
      setCaja(result)
      setActiva(true)
      setReporteCierre(null)
      setPreview(null)
      setMontoInicial('')
      setSuccess('Caja abierta correctamente')
    } catch (err: any) {
      setError(err.message || 'Error al abrir caja')
    } finally {
      setLoading(false)
    }
  }

  async function handleCerrar(e: React.FormEvent) {
    e.preventDefault()
    if (!caja) return
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await api.cajas.cerrar(caja.id, {
        montoContadoEfectivo: parseFloat(montoEfectivo) || 0,
        montoContadoTarjetas: parseFloat(montoTarjetas) || 0,
        gastos: preview?.totalGastos ?? 0,
      })
      setCaja(result)
      setActiva(false)
      setReporteCierre(result)
      setMontoEfectivo('')
      setMontoTarjetas('')
    } catch (err: any) {
      setError(err.message || 'Error al cerrar caja')
    } finally {
      setLoading(false)
    }
  }

  const ef = parseFloat(montoEfectivo) || 0
  const tj = parseFloat(montoTarjetas) || 0
  const totalGastos = preview?.totalGastos ?? 0
  const esperado = preview ? preview.montoInicial + preview.totalVentas - totalGastos : 0
  const contadoActual = ef + tj
  const diffPreview = esperado - contadoActual

  if (!sucursal) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Seleccioná una sucursal para gestionar la caja</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Caja - {sucursal.nombre}</h1>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">{error}</div>
      )}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">{success}</div>
      )}

      {loading && !caja ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : activa && caja ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Caja activa info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">Caja abierta</h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Apertura</dt>
                <dd className="font-medium">{new Date(caja.fechaApertura).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Usuario</dt>
                <dd className="font-medium">{caja.usuarioApertura}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Monto inicial</dt>
                <dd className="font-medium">${caja.montoInicial.toFixed(2)}</dd>
              </div>
            </dl>

            {/* Preview de ventas */}
            {loadingPreview ? (
              <div className="mt-4 text-sm text-gray-400">Cargando resumen de ventas...</div>
            ) : preview ? (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Resumen de ventas</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Total ventas</dt>
                    <dd className="font-medium">${preview.totalVentas.toFixed(2)}</dd>
                  </div>
                  {preview.desglosePagos.map(p => (
                    <div key={p.idMedioPago} className="flex justify-between pl-3">
                      <dt className="text-gray-500">{p.medioPago}</dt>
                      <dd className="font-medium">${p.monto.toFixed(2)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>

          {/* Cerrar caja */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Cerrar caja</h2>
            <form onSubmit={handleCerrar} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto contado efectivo
                </label>
                <input
                  type="number" step="0.01" min="0"
                  value={montoEfectivo}
                  onChange={e => setMontoEfectivo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto contado tarjetas
                </label>
                <input
                  type="number" step="0.01" min="0"
                  value={montoTarjetas}
                  onChange={e => setMontoTarjetas(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gastos
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700">
                  {totalGastos > 0
                    ? <span className="font-medium text-red-600">-${totalGastos.toFixed(2)}</span>
                    : <span className="text-gray-400">$0.00</span>
                  }
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Los gastos se cargan desde la solapa <strong>Gastos</strong>
                </p>
              </div>

              {preview && (ef > 0 || tj > 0) && (
                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between text-gray-600">
                    <span>Esperado</span>
                    <span>${esperado.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Contado</span>
                    <span>${contadoActual.toFixed(2)}</span>
                  </div>
                  <hr className="border-gray-200" />
                  <div className="flex justify-between font-semibold">
                    <span>Diferencia estimada</span>
                    <span className={diffPreview >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {diffPreview >= 0 ? '+' : ''}{diffPreview.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-500 disabled:opacity-50"
              >
                {loading ? 'Cerrando...' : 'Cerrar caja'}
              </button>
            </form>
          </div>
        </div>
      ) : reporteCierre ? (
        /* Reporte de cierre */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">Cierre de caja</h2>
            </div>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Apertura</dt>
                <dd className="font-medium">{new Date(reporteCierre.fechaApertura).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Cierre</dt>
                <dd className="font-medium">{new Date(reporteCierre.fechaCierre!).toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Usuario</dt>
                <dd className="font-medium">{reporteCierre.usuarioApertura}</dd>
              </div>
              <hr className="border-gray-200" />

              <div className="flex justify-between">
                <dt className="text-gray-500">Monto inicial</dt>
                <dd className="font-medium">${reporteCierre.montoInicial.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Total ventas</dt>
                <dd className="font-medium">${reporteCierre.totalVentas.toFixed(2)}</dd>
              </div>

              {reporteCierre.desglosePagos.length > 0 && (
                <>
                  <hr className="border-gray-200" />
                  <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Cobros por medio</div>
                  {reporteCierre.desglosePagos.map(p => (
                    <div key={p.idMedioPago} className="flex justify-between pl-2">
                      <dt className="text-gray-500">{p.medioPago}</dt>
                      <dd className="font-medium">${p.monto.toFixed(2)}</dd>
                    </div>
                  ))}
                </>
              )}

              <hr className="border-gray-200" />
              <div className="flex justify-between">
                <dt className="text-gray-500">Gastos</dt>
                <dd className="font-medium text-red-600">-${reporteCierre.gastos.toFixed(2)}</dd>
              </div>

              <hr className="border-gray-200" />
              <div className="flex justify-between">
                <dt className="text-gray-500">Esperado</dt>
                <dd className="font-medium">${reporteCierre.esperado.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Contado efectivo</dt>
                <dd className="font-medium">${(reporteCierre.montoContadoEfectivo ?? 0).toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Contado tarjetas</dt>
                <dd className="font-medium">${(reporteCierre.montoContadoTarjetas ?? 0).toFixed(2)}</dd>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between">
                <dt className="text-gray-500">Diferencia</dt>
                <dd className={`font-semibold ${(reporteCierre.diferencia ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${(reporteCierre.diferencia ?? 0) >= 0 ? '+' : ''}{reporteCierre.diferencia?.toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Abrir nueva caja</h2>
            <form onSubmit={handleAbrir} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto inicial</label>
                <input
                  type="number" step="0.01" min="0"
                  value={montoInicial}
                  onChange={e => setMontoInicial(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-500 disabled:opacity-50"
              >
                {loading ? 'Abriendo...' : 'Abrir caja'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">No hay caja abierta</h2>
          <p className="text-sm text-gray-500 mb-4">Abrí una caja para comenzar a operar</p>
          <form onSubmit={handleAbrir} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto inicial</label>
              <input
                type="number" step="0.01" min="0"
                value={montoInicial}
                onChange={e => setMontoInicial(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
                />
              </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-500 disabled:opacity-50"
            >
              {loading ? 'Abriendo...' : 'Abrir caja'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
