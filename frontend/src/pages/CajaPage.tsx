import { useState, useEffect, useCallback, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import type { CajaDto, SucursalDto, CierrePreviewDto } from '../types'
import { formatDate, formatCurrency } from '../formats'

export default function CajaPage() {
  const { sucursal } = useOutletContext<{ sucursal: SucursalDto | null }>()
  const [caja, setCaja] = useState<CajaDto | null>(null)
  const [activa, setActiva] = useState(false)
  const [loading, setLoading] = useState(false)
  const { notifyError, notifySuccess } = useNotification()
  const [reporteCierre, setReporteCierre] = useState<CajaDto | null>(null)
  const [preview, setPreview] = useState<CierrePreviewDto | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)

  // Historial
  const [historial, setHistorial] = useState<CajaDto[]>([])
  const [historialLoading, setHistorialLoading] = useState(false)
  const [busquedaHistorial, setBusquedaHistorial] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [ordenarPor, setOrdenarPor] = useState<'fecha' | 'usuario' | 'inicial' | 'ventas' | 'ganancia' | null>(null)
  const [ordenDir, setOrdenDir] = useState<'asc' | 'desc'>('desc')

  const toggleOrden = (campo: 'fecha' | 'usuario' | 'inicial' | 'ventas' | 'ganancia') => {
    if (ordenarPor !== campo) { setOrdenarPor(campo); setOrdenDir('asc') }
    else if (ordenDir === 'asc') { setOrdenDir('desc') }
    else { setOrdenarPor(null) }
  }

  const historialFiltrado = useMemo(() => {
    let lista = busquedaHistorial.trim()
      ? historial.filter(c => {
          const q = busquedaHistorial.toLowerCase()
          return (c.usuarioApertura || '').toLowerCase().includes(q) ||
            c.montoInicial.toString().includes(q) ||
            c.totalVentas.toString().includes(q) ||
            (c.totalVentas - c.gastos).toString().includes(q)
        })
      : [...historial]
    if (ordenarPor) {
      lista.sort((a, b) => {
        let cmp = 0
        if (ordenarPor === 'fecha') cmp = (a.fechaCierre ?? a.fechaApertura).localeCompare(b.fechaCierre ?? b.fechaApertura)
        else if (ordenarPor === 'usuario') cmp = (a.usuarioApertura || '').localeCompare(b.usuarioApertura || '')
        else if (ordenarPor === 'inicial') cmp = a.montoInicial - b.montoInicial
        else if (ordenarPor === 'ventas') cmp = a.totalVentas - b.totalVentas
        else cmp = (a.totalVentas - a.gastos) - (b.totalVentas - b.gastos)
        return ordenDir === 'asc' ? cmp : -cmp
      })
    }
    return lista
  }, [historial, busquedaHistorial, ordenarPor, ordenDir])

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
      loadHistorial()
    } catch (err: any) {
      notifyError(err.message || 'Error al cargar caja')
    } finally {
      setLoading(false)
    }
  }, [sucursal, fechaDesde, fechaHasta])

  const loadHistorial = useCallback(async () => {
    if (!sucursal) return
    setHistorialLoading(true)
    try {
      const res = await api.cajas.historial(sucursal.id, fechaDesde || undefined, fechaHasta || undefined)
      setHistorial(res.items)
    } catch {
      setHistorial([])
    } finally {
      setHistorialLoading(false)
    }
  }, [sucursal, fechaDesde, fechaHasta])

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

  // Reporte derivado
  const ventaCountR = reporteCierre?.desglosePagos?.reduce((s, p) => s + (p.cantidadVentas ?? 1), 0) ?? 0
  const ventasEfectivoR = reporteCierre?.desglosePagos?.find(p => p.medioPago.toLowerCase().includes('efectivo'))?.monto ?? 0
  const ventasDebitoR = reporteCierre?.desglosePagos?.filter(p => p.medioPago.toLowerCase().includes('débito') || p.medioPago.toLowerCase().includes('debito'))?.reduce((s, p) => s + p.monto, 0) ?? 0
  const ventasCreditoR = reporteCierre?.desglosePagos?.filter(p => p.medioPago.toLowerCase().includes('crédito') || p.medioPago.toLowerCase().includes('credito'))?.reduce((s, p) => s + p.monto, 0) ?? 0
  const ventasTransferenciaR = reporteCierre?.desglosePagos?.filter(p => p.medioPago.toLowerCase().includes('transferencia'))?.reduce((s, p) => s + p.monto, 0) ?? 0
  const ventasFiadasR = reporteCierre?.desglosePagos?.filter(p => p.medioPago.toLowerCase().includes('fiado') || p.medioPago.toLowerCase().includes('deuda'))?.reduce((s, p) => s + p.monto, 0) ?? 0
  const ventasOtrasR = (reporteCierre?.totalVentas ?? 0) - ventasEfectivoR - ventasDebitoR - ventasCreditoR - ventasTransferenciaR - ventasFiadasR
  const efectivoEsperadoR = reporteCierre ? reporteCierre.montoInicial + ventasEfectivoR - reporteCierre.gastos : 0
  const contadoEfectivoR = reporteCierre?.montoContadoEfectivo ?? 0
  const diffEfectivoR = contadoEfectivoR - efectivoEsperadoR

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
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-green-500 p-5 space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Caja abierta</h2>
                </div>
                <dl className="space-y-2">
                  <SummaryRow label="Apertura" value={new Date(caja.fechaApertura).toLocaleString()} />
                  <SummaryRow label="Usuario" value={caja.usuarioApertura} />
                  <SummaryRow label="Saldo inicial" value={`$${caja.montoInicial.toFixed(2)}`} />
                </dl>

                {loadingPreview ? (
                  <div className="text-sm text-gray-400">Cargando resumen...</div>
                ) : preview ? (
                  <>
                    <hr className="border-gray-200" />
                    <div>
                      <h3 className="text-base font-bold text-gray-700 mb-2">Resumen de caja</h3>
                      <dl className="space-y-2">
                        <SummaryRow label="Saldo inicial" value={`$${preview.montoInicial.toFixed(2)}`} />
                        <SummaryRow label="Ventas totales" value={`$${preview.totalVentas.toFixed(2)}`} accent="blue" />
                        <SummaryRow
                          label="Gastos"
                          value={totalGastos > 0 ? `-$${totalGastos.toFixed(2)}` : '$0.00'}
                          accent={totalGastos > 0 ? 'red' : undefined}
                        />
                        <hr className="border-gray-200" />
                        <SummaryRow label="Ganancia" value={`$${(preview.totalVentas - totalGastos).toFixed(2)}`} bold accent="green" />
                      </dl>
                    </div>

                    {preview.desglosePagos.length > 0 && (
                      <>
                        <hr className="border-gray-200" />
                        <div>
                          <h3 className="text-base font-bold text-gray-700 mb-2">Medios de pago</h3>
                          <dl className="space-y-2">
                            {preview.desglosePagos.map(p => (
                              <SummaryRow key={p.idMedioPago} label={p.medioPago} value={`$${p.monto.toFixed(2)}`} bold />
                            ))}
                          </dl>
                        </div>
                      </>
                    )}
                  </>
                ) : null}
              </div>
            ) : reporteCierre ? (
              <>
                {/* ── 1. Resultado del cierre ── */}
                <div className={`rounded-2xl p-6 text-center ${
                  diffEfectivoR === 0 ? 'bg-emerald-50 border-2 border-emerald-300' :
                  Math.abs(diffEfectivoR) < 10 ? 'bg-amber-50 border-2 border-amber-300' :
                  'bg-red-50 border-2 border-red-300'
                }`}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1 text-gray-600">Resultado del cierre</p>
                  <p className={`text-4xl font-black ${
                    diffEfectivoR === 0 ? 'text-emerald-600' :
                    diffEfectivoR > 0 ? 'text-amber-600' :
                    'text-red-600'
                  }`}>
                    {diffEfectivoR === 0 ? '$0.00' : `${diffEfectivoR > 0 ? '+' : ''}$${Math.abs(diffEfectivoR).toFixed(2)}`}
                  </p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${
                    diffEfectivoR === 0 ? 'bg-emerald-200 text-emerald-800' :
                    Math.abs(diffEfectivoR) < 10 ? 'bg-amber-200 text-amber-800' :
                    'bg-red-200 text-red-800'
                  }`}>
                    {diffEfectivoR === 0 ? 'Caja cerrada correctamente' :
                     diffEfectivoR > 0 ? 'Caja cerrada con sobrante' :
                     'Caja cerrada con faltante'}
                  </span>
                  <p className="mt-3 text-sm text-gray-500">
                    Total vendido <span className="font-bold text-gray-700">${reporteCierre.totalVentas.toFixed(2)}</span>
                  </p>
                </div>

                {/* ── 2. Apertura y cierre ── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="text-base font-bold text-gray-700 mb-3">Apertura y cierre</h3>
                  <dl className="space-y-2">
                    <SummaryRow label="Apertura" value={new Date(reporteCierre.fechaApertura).toLocaleString()} />
                    <SummaryRow label="Cierre" value={new Date(reporteCierre.fechaCierre!).toLocaleString()} />
                    <SummaryRow label="Usuario apertura" value={reporteCierre.usuarioApertura} />
                    {reporteCierre.usuarioCierre && (
                      <SummaryRow label="Usuario cierre" value={reporteCierre.usuarioCierre} />
                    )}
                  </dl>
                </div>

                {/* ── 3. Resumen de ventas ── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="text-base font-bold text-gray-700 mb-3">Resumen de ventas</h3>
                  <dl className="space-y-2">
                    {ventasEfectivoR > 0 && (
                      <SummaryRow label="Efectivo" value={`$${ventasEfectivoR.toFixed(2)}`} bold />
                    )}
                    {ventasDebitoR > 0 && (
                      <SummaryRow label="Débito" value={`$${ventasDebitoR.toFixed(2)}`} bold />
                    )}
                    {ventasCreditoR > 0 && (
                      <SummaryRow label="Crédito" value={`$${ventasCreditoR.toFixed(2)}`} bold />
                    )}
                    {ventasTransferenciaR > 0 && (
                      <SummaryRow label="Transferencia" value={`$${ventasTransferenciaR.toFixed(2)}`} bold />
                    )}
                    {ventasFiadasR > 0 && (
                      <SummaryRow label="Fiado" value={`$${ventasFiadasR.toFixed(2)}`} bold />
                    )}
                    {ventasOtrasR > 0 && (
                      <SummaryRow label="Otros" value={`$${ventasOtrasR.toFixed(2)}`} bold />
                    )}
                    <hr className="border-gray-200" />
                    <SummaryRow label="Total vendido" value={`$${reporteCierre.totalVentas.toFixed(2)}`} bold accent="blue" />
                  </dl>
                </div>

                {/* ── 4. Movimientos de caja ── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="text-base font-bold text-gray-700 mb-3">Movimientos de caja</h3>
                  <dl className="space-y-2">
                    <SummaryRow label="Fondo inicial" value={`$${reporteCierre.montoInicial.toFixed(2)}`} />
                    <SummaryRow
                      label="Gastos"
                      value={`-$${reporteCierre.gastos.toFixed(2)}`}
                      accent={reporteCierre.gastos > 0 ? 'red' : undefined}
                    />
                  </dl>
                </div>

                {/* ── 5. Conteo de efectivo ── */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="text-base font-bold text-gray-700 mb-3">Conteo de efectivo</h3>
                  <dl className="space-y-2">
                    <SummaryRow
                      label="Efectivo esperado"
                      value={`$${efectivoEsperadoR.toFixed(2)}`}
                      muted
                    />
                    <SummaryRow label="Efectivo contado" value={`$${contadoEfectivoR.toFixed(2)}`} bold />
                    <hr className="border-gray-200" />
                    <SummaryRow
                      label="Diferencia de caja"
                      value={`${diffEfectivoR >= 0 ? '+' : ''}$${Math.abs(diffEfectivoR).toFixed(2)}`}
                      bold
                      accent={diffEfectivoR > 0 ? 'green' : diffEfectivoR < 0 ? 'red' : 'green'}
                    />
                  </dl>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                    Efectivo esperado = Fondo inicial + Ventas en efectivo − Gastos
                  </p>
                </div>
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

      {/* ── Historial de cierres ── */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-6">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900">
              Historial de cierres{historial.length > 0 ? ` (${historial.length})` : ''}
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
            <div className="flex items-center gap-2 text-xs">
              <label className="text-gray-500">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
              />
              <label className="text-gray-500">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
              />
              {(fechaDesde || fechaHasta) && (
                <button
                  onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                  className="text-gray-400 hover:text-gray-600 px-1"
                  title="Limpiar filtro de fechas"
                >✕</button>
              )}
            </div>
          </div>
          {historialLoading ? (
            <p className="text-sm text-gray-400 text-center py-6">Cargando historial...</p>
          ) : historial.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No hay cierres anteriores</p>
          ) : historialFiltrado.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin resultados para "{busquedaHistorial}"</p>
          ) : (
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="pb-2 pr-3 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleOrden('fecha')}>
                      Cierre{ordenarPor === 'fecha' ? (ordenDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                    <th className="pb-2 pr-3 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleOrden('usuario')}>
                      Usuario{ordenarPor === 'usuario' ? (ordenDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                    <th className="pb-2 pr-3 text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleOrden('inicial')}>
                      Saldo inicial{ordenarPor === 'inicial' ? (ordenDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                    <th className="pb-2 pr-3 text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleOrden('ventas')}>
                      Ventas{ordenarPor === 'ventas' ? (ordenDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                    <th className="pb-2 text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleOrden('ganancia')}>
                      Ganancia{ordenarPor === 'ganancia' ? (ordenDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historialFiltrado.map(c => (
                    <tr key={c.id} className="hover:bg-gray-100/80 hover:ring-1 hover:ring-gray-300 hover:ring-inset transition-all">
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        <span className="text-gray-600 text-xs">{formatDate(c.fechaCierre ?? c.fechaApertura)}</span>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        <span className="text-gray-500 text-xs">{c.usuarioApertura || '-'}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        <span className="text-xs">{formatCurrency(c.montoInicial)}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        <span className="text-xs">{formatCurrency(c.totalVentas)}</span>
                      </td>
                      <td className="py-2.5 text-right">
                        <span className={`text-xs font-medium ${(c.totalVentas - c.gastos) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(c.totalVentas - c.gastos)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
