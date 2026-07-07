import { useState, useEffect, useCallback, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import { PageShell } from '../components/shared'
import type { CajaDto, SucursalDto, CierrePreviewDto, MedioPagoDto } from '../types'
import { formatDate, formatCurrency } from '../formats'
import { Clock, Plus } from 'lucide-react'

export default function CajaPage() {
  const { sucursal: ctxSucursal } = useOutletContext<{ sucursal: SucursalDto | null }>()
  const [sucursalLocal, setSucursalLocal] = useState<SucursalDto | null>(null)
  const sucursal = ctxSucursal ?? sucursalLocal

  // Auto-cargar primera sucursal si no hay en contexto
  useEffect(() => {
    if (ctxSucursal || sucursalLocal) return
    api.sucursales.listar().then(lst => {
      if (lst.length > 0) {
        localStorage.setItem('sucursalActiva', JSON.stringify(lst[0]))
        setSucursalLocal(lst[0])
      }
    }).catch(() => {})
  }, [ctxSucursal, sucursalLocal])
  const [caja, setCaja] = useState<CajaDto | null>(null)
  const [activa, setActiva] = useState(false)
  const [loading, setLoading] = useState(false)
  const { notifyError, notifySuccess } = useNotification()
  const [reporteCierre, setReporteCierre] = useState<CajaDto | null>(null)
  const [preview, setPreview] = useState<CierrePreviewDto | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [mediosPago, setMediosPago] = useState<MedioPagoDto[]>([])

  // Historial
  const [historial, setHistorial] = useState<CajaDto[]>([])
  const [historialLoading, setHistorialLoading] = useState(false)
  const [busquedaHistorial, setBusquedaHistorial] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [ordenarPor, setOrdenarPor] = useState<'fecha' | 'usuario' | 'inicial' | 'ventas' | 'ganancia' | null>(null)
  const [ordenDir, setOrdenDir] = useState<'asc' | 'desc'>('desc')
  const [cierreDetalle, setCierreDetalle] = useState<CajaDto | null>(null)

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
      api.mediosPago.listar().then(setMediosPago).catch(() => {})
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
      loadHistorial()
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
      loadHistorial()
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

  if (!sucursal) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Seleccioná una sucursal para gestionar la caja</p>
      </div>
    )
  }

  const cantidadVentas = preview?.desglosePagos?.reduce((s, p) => s + (p.cantidadVentas ?? 1), 0) ?? 0

  return (
    <PageShell
      title="Caja"
      subtitle="Gestione la apertura, el cierre y el balance de caja."
      loading={loading && !caja && !reporteCierre}
    >
      {!loading && (
        <>
          {/* ── Status banner ── */}
          {!activa && !reporteCierre && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Clock size={20} strokeWidth={2} className="text-blue-500" />
              </div>
              <div>
                <p className="text-lg font-bold text-blue-800">Esperando apertura</p>
                <p className="text-sm text-blue-600">Abra la caja para comenzar a operar</p>
              </div>
            </div>
          )}

          {/* ── Simple hero (caja activa) ── */}
          {activa && caja && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
              <div className="flex items-end justify-between flex-wrap gap-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Total vendido</p>
                  <p className="text-4xl font-bold text-blue-600">
                    ${(preview?.totalVentas ?? 0).toFixed(2)}
                  </p>
                </div>
                <div className="flex items-end gap-6">
                  {totalGastos > 0 && (
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Gastos</p>
                      <p className="text-2xl font-bold text-red-600">-${totalGastos.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-xs text-gray-400 mb-0.5">Operaciones</p>
                    <p className="text-2xl font-bold text-gray-700">{cantidadVentas}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Main content ── */}
          {activa && caja && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Resumen financiero */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Resumen financiero</h3>
                  {loadingPreview ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span className="ml-2 text-sm text-gray-400">Cargando...</span>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <dl className="space-y-2">
                        <SummaryRow label="Saldo inicial" value={`$${caja.montoInicial.toFixed(2)}`} />
                        {/* Medios de pago — todos visibles, indentados como subcuenta */}
                        <div className="pl-4 border-l-2 border-gray-200 space-y-1.5">
                          {mediosPago.map(mp => {
                            const monto = preview?.desglosePagos?.find(p => p.idMedioPago === mp.id)?.monto ?? 0
                            return (
                              <div key={mp.id} className="flex justify-between items-center">
                                <dt className="text-sm text-gray-500">{mp.nombre}</dt>
                                <dd className="text-sm tabular-nums text-gray-700">${monto.toFixed(2)}</dd>
                              </div>
                            )
                          })}
                        </div>
                        <SummaryRow
                          label="Gastos"
                          value={totalGastos > 0 ? `-$${totalGastos.toFixed(2)}` : '$0.00'}
                          accent={totalGastos > 0 ? 'red' : undefined}
                        />
                        <hr className="border-gray-200" />
                        <SummaryRow
                          label="Total esperado"
                          value={`$${(caja.montoInicial + (preview?.totalVentas ?? 0) - totalGastos).toFixed(2)}`}
                          bold
                        />
                      </dl>
                    </div>
                  )}
                </div>

                {/* Conteo final */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">Conteo final</h3>
                  <form onSubmit={handleCerrar} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Efectivo en caja</label>
                      <input type="number" step="0.01" min="0" value={montoEfectivo}
                        onChange={e => setMontoEfectivo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" required placeholder="0.00" />
                      {preview && (ef > 0 || efectivoVentas > 0) && (
                        <div className="mt-2 bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                          <div className="flex justify-between text-gray-600"><span>Esperado</span><span>${efectivoEsperado.toFixed(2)}</span></div>
                          <div className="flex justify-between text-gray-600"><span>Contado</span><span>${ef.toFixed(2)}</span></div>
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
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total tarjetas</label>
                      <input type="number" step="0.01" min="0" value={montoTarjetas}
                        onChange={e => setMontoTarjetas(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" required placeholder="0.00" />
                      {preview && (tj > 0 || tarjetasVentas > 0) && (
                        <div className="mt-2 bg-gray-50 rounded-lg p-3 text-sm space-y-1">
                          <div className="flex justify-between text-gray-600"><span>Esperado</span><span>${tarjetasEsperado.toFixed(2)}</span></div>
                          <div className="flex justify-between text-gray-600"><span>Contado</span><span>${tj.toFixed(2)}</span></div>
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
                      <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Gastos</label>
                      <div className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700">
                        {totalGastos > 0
                          ? <span className="font-medium text-red-600">-${totalGastos.toFixed(2)}</span>
                          : <span className="text-gray-400">$0.00</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Los gastos se cargan desde la solapa <strong>Gastos</strong></p>
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-500 disabled:opacity-50 transition-colors">
                      {loading ? 'Cerrando...' : 'Cerrar caja'}
                    </button>
                  </form>
                </div>
              </div>
            </>
            )}

          {/* ── Último cierre ── */}
          {reporteCierre && !activa && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 cursor-pointer hover:border-indigo-300 transition-colors"
              onClick={() => setCierreDetalle(reporteCierre)}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Último cierre</h3>
                  <p className="text-sm text-gray-700">
                    {formatDate(reporteCierre.fechaCierre ?? reporteCierre.fechaApertura)}
                    {reporteCierre.usuarioCierre && ` — ${reporteCierre.usuarioCierre}`}
                  </p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Vendido</p>
                    <p className="font-semibold text-gray-900">${reporteCierre.totalVentas.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-400">Ganancia</p>
                    <p className={`font-semibold ${(reporteCierre.totalVentas - reporteCierre.gastos) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${(reporteCierre.totalVentas - reporteCierre.gastos).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!activa && (
            /* ── Hero Abrir caja ── */
            <div className="max-w-md mx-auto mb-6">
              <div className="bg-white rounded-2xl shadow-sm border-2 border-green-200 p-6 sm:p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <Plus size={28} strokeWidth={2} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Abrir nueva caja</h2>
                <p className="text-sm text-gray-500 mb-5">Ingrese el saldo inicial para comenzar</p>
                <form onSubmit={handleAbrir} className="space-y-4">
                  <div className="text-left">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Saldo inicial</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                      <input type="number" step="0.01" min="0" value={montoInicial}
                        onChange={e => setMontoInicial(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-lg font-semibold text-right focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none"
                        required placeholder="0.00" autoFocus />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors text-base">
                    {loading ? 'Abriendo...' : 'Abrir caja'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ── Historial de cierres ── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h3 className="text-lg font-semibold text-gray-900">
                Historial de cierres{historial.length > 0 ? ` (${historial.length})` : ''}
              </h3>
              {historial.length > 0 && (
                <input type="text" value={busquedaHistorial} onChange={e => setBusquedaHistorial(e.target.value)}
                  placeholder="Buscar..." className="w-48 px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all shadow-sm" />
              )}
              <div className="flex items-center gap-2 text-xs">
                <label className="text-gray-500">Desde</label>
                <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none" />
                <label className="text-gray-500">Hasta</label>
                <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none" />
                {(fechaDesde || fechaHasta) && (
                  <button onClick={() => { setFechaDesde(''); setFechaHasta('') }}
                    className="text-gray-400 hover:text-gray-600 px-1" title="Limpiar filtro de fechas">✕</button>
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
                      <th className="pb-2 pr-3 text-gray-400">Apertura</th>
                      <th className="pb-2 pr-3 text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleOrden('inicial')}>
                        Inicial{ordenarPor === 'inicial' ? (ordenDir === 'asc' ? ' ▲' : ' ▼') : ''}
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
                      <tr key={c.id}
                        onClick={() => setCierreDetalle(c)}
                        className="hover:bg-indigo-50 cursor-pointer transition-colors">
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          <span className="text-gray-600 text-xs">{formatDate(c.fechaCierre ?? c.fechaApertura)}</span>
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          <span className="text-gray-500 text-xs">{c.usuarioApertura || '-'}</span>
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          <span className="text-gray-500 text-xs">{formatDate(c.fechaApertura)}</span>
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

          {/* ── Detalle de cierre (modal) ── */}
          {cierreDetalle && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
              onClick={() => setCierreDetalle(null)}>
              <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Detalle del cierre</h2>
                    <button onClick={() => setCierreDetalle(null)}
                      className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                  </div>

                  <dl className="space-y-2 mb-6">
                    <SummaryRow label="Fecha cierre" value={formatDate(cierreDetalle.fechaCierre ?? cierreDetalle.fechaApertura)} />
                    <SummaryRow label="Usuario" value={cierreDetalle.usuarioCierre || cierreDetalle.usuarioApertura || '-'} />
                    {cierreDetalle.fechaApertura && (
                      <SummaryRow label="Apertura" value={new Date(cierreDetalle.fechaApertura).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit' })} />
                    )}
                    {cierreDetalle.fechaCierre && (
                      <SummaryRow label="Cierre" value={new Date(cierreDetalle.fechaCierre).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit' })} />
                    )}
                  </dl>

                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Resumen financiero</h3>
                    <dl className="space-y-2">
                      <SummaryRow label="Saldo inicial" value={`$${cierreDetalle.montoInicial.toFixed(2)}`} />
                      <SummaryRow label="Ventas" value={`$${cierreDetalle.totalVentas.toFixed(2)}`} accent="blue" />
                      <SummaryRow label="Gastos" value={cierreDetalle.gastos > 0 ? `-$${cierreDetalle.gastos.toFixed(2)}` : '$0.00'} accent={cierreDetalle.gastos > 0 ? 'red' : undefined} />
                      <hr className="border-gray-200" />
                      <SummaryRow label="Ganancia" value={`$${(cierreDetalle.totalVentas - cierreDetalle.gastos).toFixed(2)}`} bold accent="green" />
                    </dl>
                  </div>

                  {cierreDetalle.montoContadoEfectivo != null && (() => {
                    const eR = cierreDetalle.montoInicial
                      + (cierreDetalle.desglosePagos?.find(p => p.medioPago.toLowerCase().includes('efectivo'))?.monto ?? 0)
                      - cierreDetalle.gastos
                    const cR = cierreDetalle.montoContadoEfectivo
                    const dR = cR - eR
                    return (
                      <div className="bg-gray-50 rounded-xl p-4 mb-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Conteo de efectivo</h3>
                        <dl className="space-y-2">
                          <SummaryRow label="Efectivo esperado" value={`$${eR.toFixed(2)}`} muted />
                          <SummaryRow label="Efectivo contado" value={`$${cR.toFixed(2)}`} bold />
                          <hr className="border-gray-200" />
                          <SummaryRow
                            label="Diferencia de caja"
                            value={`${dR >= 0 ? '+' : ''}$${Math.abs(dR).toFixed(2)}`}
                            bold
                            accent={dR === 0 ? undefined : dR > 0 ? 'green' : 'red'}
                          />
                        </dl>
                      </div>
                    )
                  })()}

                  {cierreDetalle.desglosePagos?.length ? (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Medios de pago</h3>
                      <dl className="space-y-2">
                        {cierreDetalle.desglosePagos.map(p => (
                          <SummaryRow key={p.idMedioPago} label={p.medioPago} value={`$${p.monto.toFixed(2)}`} />
                        ))}
                      </dl>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </PageShell>
  )
}
