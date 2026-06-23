import { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import type { CajaDto, SucursalDto, CierrePreviewDto } from '../types'

export default function CajaPage() {
  const { sucursal } = useOutletContext<{ sucursal: SucursalDto | null }>()
  const [caja, setCaja] = useState<CajaDto | null>(null)
  const [activa, setActiva] = useState(false)
  const [loading, setLoading] = useState(false)
  const { notifyError, notifySuccess } = useNotification()
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
      const [res, ultimo] = await Promise.all([
        api.cajas.activa(sucursal.id),
        api.cajas.ultimoCierre(sucursal.id)
      ])
      setCaja(res.caja)
      setActiva(res.activa)
      setReporteCierre(ultimo)
      if (res.activa && res.caja) {
        loadPreview(res.caja.id)
      }
    } catch (err: any) {
      notifyError(err.message || 'Error al cargar caja')
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
      notifySuccess('Caja abierta correctamente')
    } catch (err: any) {
      notifyError(err.message || 'Error al abrir caja')
    } finally {
      setLoading(false)
    }
  }

  async function handleCerrar(e: React.FormEvent) {
    e.preventDefault()
    if (!caja) return
    setLoading(true)

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
      notifyError(err.message || 'Error al cerrar caja')
    } finally {
      setLoading(false)
    }
  }

  const ef = parseFloat(montoEfectivo) || 0
  const tj = parseFloat(montoTarjetas) || 0
  const totalGastos = preview?.totalGastos ?? 0
  const efectivoVentas = preview?.desglosePagos.find(p => p.medioPago.toLowerCase().includes('efectivo'))?.monto ?? 0
  const tarjetasVentas = (preview?.totalVentas ?? 0) - efectivoVentas
  const efectivoEsperado = preview ? preview.montoInicial + efectivoVentas - totalGastos : 0
  const tarjetasEsperado = preview ? tarjetasVentas : 0
  const diffEfectivo = ef - efectivoEsperado
  const diffTarjetas = tj - tarjetasEsperado
  const saldoEsperado = preview ? preview.montoInicial + preview.totalVentas - totalGastos : 0
  const totalContado = ef + tj
  const diferenciaCierre = totalContado - saldoEsperado

  // Reporte derivado (siempre visible una vez que hay un cierre)
  const reporteSaldoEsperado = reporteCierre ? reporteCierre.montoInicial + reporteCierre.totalVentas - reporteCierre.gastos : 0
  const reporteContado = reporteCierre ? (reporteCierre.montoContadoEfectivo ?? 0) + (reporteCierre.montoContadoTarjetas ?? 0) : 0
  const reporteDiff = reporteContado - reporteSaldoEsperado

  // Reusable summary row
  function SummaryRow({ label, value, bold, accent, muted }: {
    label: string; value: string; bold?: boolean; accent?: 'green' | 'red' | 'blue'; muted?: boolean
  }) {
    return (
      <div className="flex justify-between items-center">
        <dt className={bold ? 'text-gray-800 font-semibold text-sm' : muted ? 'text-xs text-gray-400' : 'text-sm text-gray-500'}>{label}</dt>
        <dd className={`tabular-nums text-sm ${
          accent === 'green' ? 'text-emerald-600 font-bold' :
          accent === 'red' ? 'text-red-600 font-bold' :
          accent === 'blue' ? 'text-blue-600 font-bold' :
          bold ? 'font-bold text-gray-900' :
          muted ? 'text-gray-400' : 'font-medium text-gray-800'
        }`}>{value}</dd>
      </div>
    )
  }

  function SectionCard({ title, color, children }: { title: string; color: 'green' | 'orange' | 'blue' | 'indigo'; children: React.ReactNode }) {
    const borderColor = { green: 'border-l-green-500', orange: 'border-l-orange-500', blue: 'border-l-blue-500', indigo: 'border-l-indigo-500' }
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${borderColor[color]} p-5`}>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h3>
        <dl className="space-y-2">{children}</dl>
      </div>
    )
  }

  if (!sucursal) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Seleccioná una sucursal para gestionar la caja</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Caja</h1>
        <p className="text-sm text-gray-500 mt-0.5">Gestione la apertura, el cierre y el balance de caja.</p>
      </div>

      {loading && !caja && !reporteCierre ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Columna izquierda: Caja activa o Último cierre ── */}
          <div className="space-y-4">
            {activa && caja ? (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-green-500 p-5">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Caja abierta</h2>
                  <dl className="space-y-2">
                    <SummaryRow label="Apertura" value={new Date(caja.fechaApertura).toLocaleString()} />
                    <SummaryRow label="Usuario" value={caja.usuarioApertura} />
                    <SummaryRow label="Saldo inicial" value={`$${caja.montoInicial.toFixed(2)}`} />
                  </dl>
                </div>

                {loadingPreview ? (
                  <div className="text-sm text-gray-400">Cargando resumen...</div>
                ) : preview ? (
                  <>
                    <SectionCard title="Resumen de caja" color="indigo">
                      <SummaryRow label="Saldo inicial" value={`$${preview.montoInicial.toFixed(2)}`} />
                      <SummaryRow label="Ventas totales" value={`$${preview.totalVentas.toFixed(2)}`} accent="blue" />
                      <SummaryRow
                        label="Gastos"
                        value={totalGastos > 0 ? `-$${totalGastos.toFixed(2)}` : '$0.00'}
                        accent={totalGastos > 0 ? 'red' : undefined}
                      />
                      <hr className="border-gray-200" />
                      <SummaryRow label="Ganancia" value={`$${saldoEsperado.toFixed(2)}`} bold accent="green" />
                    </SectionCard>

                    {preview.desglosePagos.length > 0 && (
                      <SectionCard title="Medios de pago" color="green">
                        {preview.desglosePagos.map(p => (
                          <SummaryRow key={p.idMedioPago} label={p.medioPago} value={`$${p.monto.toFixed(2)}`} bold />
                        ))}
                      </SectionCard>
                    )}
                  </>
                ) : null}
              </>
            ) : reporteCierre ? (
              <>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-orange-500 p-5">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Último cierre</h2>
                  <dl className="space-y-2">
                    <SummaryRow label="Apertura" value={new Date(reporteCierre.fechaApertura).toLocaleString()} />
                    <SummaryRow label="Cierre" value={new Date(reporteCierre.fechaCierre!).toLocaleString()} />
                    <SummaryRow label="Usuario" value={reporteCierre.usuarioApertura} />
                  </dl>
                </div>
                <SectionCard title="Resumen de caja" color="indigo">
                  <SummaryRow label="Saldo inicial" value={`$${reporteCierre.montoInicial.toFixed(2)}`} />
                  <SummaryRow label="Ventas totales" value={`$${reporteCierre.totalVentas.toFixed(2)}`} accent="blue" />
                  <SummaryRow
                    label="Gastos"
                    value={`-$${reporteCierre.gastos.toFixed(2)}`}
                    accent={reporteCierre.gastos > 0 ? 'red' : undefined}
                  />
                  <hr className="border-gray-200" />
                  <SummaryRow label="Ganancia" value={`$${reporteSaldoEsperado.toFixed(2)}`} bold accent="green" />
                </SectionCard>
                {reporteCierre.desglosePagos.length > 0 && (
                  <SectionCard title="Medios de pago" color="green">
                    {reporteCierre.desglosePagos.map(p => (
                      <SummaryRow key={p.idMedioPago} label={p.medioPago} value={`$${p.monto.toFixed(2)}`} bold />
                    ))}
                  </SectionCard>
                )}
                <SectionCard title="Conteo final" color="orange">
                  <SummaryRow label="Efectivo en caja" value={`$${(reporteCierre.montoContadoEfectivo ?? 0).toFixed(2)}`} bold />
                  <SummaryRow label="Total tarjetas" value={`$${(reporteCierre.montoContadoTarjetas ?? 0).toFixed(2)}`} bold />
                  <hr className="border-gray-200" />
                  <SummaryRow
                    label="Diferencia de caja"
                    value={`${reporteDiff >= 0 ? '+' : ''}$${Math.abs(reporteDiff).toFixed(2)}`}
                    bold
                    accent={reporteDiff > 0 ? 'green' : reporteDiff < 0 ? 'red' : 'green'}
                  />
                </SectionCard>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium text-sm">Sin cierres anteriores</p>
                <p className="text-xs text-gray-400 mt-1">El reporte aparecerá después del primer cierre.</p>
              </div>
            )}
          </div>

          {/* ── Columna derecha: Conteo final o Abrir nueva caja ── */}
          {activa && caja ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Conteo final</h2>
              <form onSubmit={handleCerrar} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Efectivo en caja</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={montoEfectivo}
                    onChange={e => setMontoEfectivo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                  {preview && (ef > 0 || efectivoVentas > 0) && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                      <div className="flex justify-between text-gray-600">
                        <span>Esperado</span>
                        <span>${efectivoEsperado.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Contado</span>
                        <span>${ef.toFixed(2)}</span>
                      </div>
                      <hr className="border-gray-200" />
                      <div className="flex justify-between font-semibold">
                        <span>Diferencia</span>
                        <span className={diffEfectivo >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {diffEfectivo >= 0 ? '+' : ''}{diffEfectivo.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total tarjetas</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={montoTarjetas}
                    onChange={e => setMontoTarjetas(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                  {preview && (tj > 0 || tarjetasVentas > 0) && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                      <div className="flex justify-between text-gray-600">
                        <span>Esperado</span>
                        <span>${tarjetasEsperado.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Contado</span>
                        <span>${tj.toFixed(2)}</span>
                      </div>
                      <hr className="border-gray-200" />
                      <div className="flex justify-between font-semibold">
                        <span>Diferencia</span>
                        <span className={diffTarjetas >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {diffTarjetas >= 0 ? '+' : ''}{diffTarjetas.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gastos</label>
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

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-500 disabled:opacity-50"
                >
                  {loading ? 'Cerrando...' : 'Cerrar caja'}
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Abrir nueva caja</h2>
              <form onSubmit={handleAbrir} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saldo inicial</label>
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
      )}
    </div>
  )
}
