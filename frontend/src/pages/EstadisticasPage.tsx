import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import type { SucursalDto, EstadisticasDto } from '../types'

function formatCurrency(n: number) {
  return '$' + n.toFixed(2)
}

function formatDate(d: string) {
  const date = new Date(d)
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function exportarCSV(data: EstadisticasDto) {
  const lines: string[] = []

  lines.push('Estadísticas,' + formatDate(data.desde) + ' - ' + formatDate(data.hasta))
  lines.push('')
  lines.push('Total ventas,' + data.totalVentas)
  lines.push('Facturación,' + formatCurrency(data.facturacion))
  lines.push('Costo total,' + formatCurrency(data.costoTotal))
  lines.push('Resultado neto,' + formatCurrency(data.resultadoNeto))
  lines.push('Ticket promedio,' + formatCurrency(data.ticketPromedio))
  if (data.mejorDia) {
    lines.push('Mejor día,' + formatDate(data.mejorDia) + ',' + formatCurrency(data.mejorDiaFacturacion))
  }
  lines.push('')
  lines.push('#,Producto,Código,Cantidad,Subtotal')
  data.topProductos.forEach((p, i) => {
    lines.push([i + 1, p.productoNombre, p.codigoBarra, p.cantidadVendida, formatCurrency(p.subtotal)].join(','))
  })

  const bom = '\uFEFF'
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `estadisticas_${data.desde}_${data.hasta}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function EstadisticasPage() {
  const { sucursal: ctxSucursal } = useOutletContext<{ sucursal: SucursalDto | null }>()
  const { notifyError } = useNotification()

  const hoy = new Date().toISOString().slice(0, 10)
  const hace30 = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

  const [sucursales, setSucursales] = useState<SucursalDto[]>([])
  const [sucursalId, setSucursalId] = useState<number | null>(ctxSucursal?.id ?? null)
  const [desde, setDesde] = useState(hace30)
  const [hasta, setHasta] = useState(hoy)
  const [data, setData] = useState<EstadisticasDto | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.sucursales.listar().then(setSucursales).catch(() => {})
  }, [])

  useEffect(() => {
    if (ctxSucursal) setSucursalId(ctxSucursal.id)
  }, [ctxSucursal])

  async function consultar() {
    if (!desde || !hasta) return
    setLoading(true)
    try {
      const res = await api.estadisticas.obtener(desde, hasta, sucursalId ?? undefined)
      setData(res)
    } catch (e: any) {
      notifyError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Estadísticas</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {sucursalId ? sucursales.find(s => s.id === sucursalId)?.nombre : 'Todas las sucursales'}
          </p>
        </div>
        {data && (
          <button
            onClick={() => exportarCSV(data)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Exportar
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Sucursal</label>
            <select
              value={sucursalId ?? ''}
              onChange={e => setSucursalId(e.target.value ? Number(e.target.value) : null)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
            >
              <option value="">Todas las sucursales</option>
              {sucursales.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>
          <button
            onClick={consultar}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard label="Ventas" value={data.totalVentas.toString()} />
            <KpiCard label="Facturación" value={formatCurrency(data.facturacion)} />
            <KpiCard label="Costo total" value={formatCurrency(data.costoTotal)} />
            <KpiCard
              label="Resultado neto"
              value={formatCurrency(data.resultadoNeto)}
              positive={data.resultadoNeto >= 0}
            />
            <KpiCard label="Ticket promedio" value={formatCurrency(data.ticketPromedio)} />
          </div>

          {/* Mejor día */}
          {data.mejorDia && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Mejor día del período</h3>
              <p className="text-2xl font-bold text-indigo-700">
                {formatDate(data.mejorDia)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Facturación: <span className="font-semibold text-gray-900">{formatCurrency(data.mejorDiaFacturacion)}</span>
              </p>
            </div>
          )}

          {/* Top 10 productos */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Top 10 productos más vendidos</h3>
            {data.topProductos.length === 0 ? (
              <p className="text-sm text-gray-400">Sin ventas en este período</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-2 pr-4 font-medium">#</th>
                      <th className="pb-2 pr-4 font-medium">Producto</th>
                      <th className="pb-2 pr-4 font-medium">Código</th>
                      <th className="pb-2 pr-4 font-medium text-right">Cantidad</th>
                      <th className="pb-2 pr-4 font-medium text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProductos.map((p, i) => (
                      <tr key={p.productoId} className="border-b border-gray-50">
                        <td className="py-2.5 pr-4 font-bold text-gray-400">{i + 1}</td>
                        <td className="py-2.5 pr-4 font-medium text-gray-900">{p.productoNombre}</td>
                        <td className="py-2.5 pr-4 text-gray-500 font-mono text-xs">{p.codigoBarra}</td>
                        <td className="py-2.5 pr-4 text-right text-gray-700">{p.cantidadVendida}</td>
                        <td className="py-2.5 pr-4 text-right font-medium text-indigo-700">
                          {formatCurrency(p.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {!data && !loading && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">Seleccioná un rango de fechas y presioná Consultar</p>
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-xl font-bold ${positive === false ? 'text-red-600' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  )
}
