import { useState, useEffect, Fragment } from 'react'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import type { VentaHistorialDto, VentaDetalleDto, PagedResult, SucursalDto } from '../types'

function isWithinLastMonth(dateStr: string): boolean {
  const date = new Date(dateStr)
  const limit = new Date()
  limit.setMonth(limit.getMonth() - 1)
  return date >= limit
}

function toDateInputValue(date: Date): string {
  return date.toISOString().split('T')[0]
}

function defaultDesde(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return toDateInputValue(d)
}

function defaultHasta(): string {
  return toDateInputValue(new Date())
}

export default function HistorialVentasPage() {
  // Filters
  const [fechaDesde, setFechaDesde] = useState(defaultDesde)
  const [fechaHasta, setFechaHasta] = useState(defaultHasta)
  const [sucursalId, setSucursalId] = useState<number | undefined>(undefined)
  const [sucursales, setSucursales] = useState<SucursalDto[]>([])

  // Data
  const [page, setPage] = useState(1)
  const [data, setData] = useState<PagedResult<VentaHistorialDto> | null>(null)
  const [loading, setLoading] = useState(true)
  const { notifyError, notifySuccess } = useNotification()
  const [searchId, setSearchId] = useState(0)

  // Detail expand
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [detailCache, setDetailCache] = useState<Map<number, VentaDetalleDto>>(new Map())
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null)

  // Load sucursales on mount
  useEffect(() => {
    api.sucursales.listar()
      .then(setSucursales)
      .catch(() => {})
  }, [])

  // Fetch data when page or searchId changes
  useEffect(() => {
    fetchData()
  }, [page, searchId])

  async function fetchData() {
    setLoading(true)
    try {
      const result = await api.ventas.historial({
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        sucursalId: sucursalId || undefined,
        page,
        pageSize: 20,
      })
      setData(result)
    } catch (e: any) {
      notifyError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch() {
    setPage(1)
    setSearchId((prev) => prev + 1)
    setExpandedId(null)
  }

  function handleClear() {
    setFechaDesde(defaultDesde())
    setFechaHasta(defaultHasta())
    setSucursalId(undefined)
  }

  async function handleToggleExpand(ventaId: number) {
    if (expandedId === ventaId) {
      setExpandedId(null)
      return
    }
    setExpandedId(ventaId)

    // Lazy-load detail
    if (!detailCache.has(ventaId)) {
      setDetailLoadingId(ventaId)
      try {
        const detalle = await api.ventas.detalle(ventaId)
        setDetailCache((prev) => {
          const next = new Map(prev)
          next.set(ventaId, detalle)
          return next
        })
      } catch {
        // Silently fail detail loading
      } finally {
        setDetailLoadingId(null)
      }
    }
  }

  const [undoVentaId, setUndoVentaId] = useState<number | null>(null)
  const [undoLoading, setUndoLoading] = useState(false)

  async function handleUndo(conDevolucion: boolean) {
    if (undoVentaId === null) return
    setUndoLoading(true)
    try {
      await api.ventas.deshacer(undoVentaId, conDevolucion)
      notifySuccess(conDevolucion
        ? 'Venta anulada con devolución de dinero'
        : 'Venta anulada sin devolución')
      setUndoVentaId(null)
      fetchData()
    } catch (e: any) {
      notifyError(e.message)
    } finally {
      setUndoLoading(false)
    }
  }

  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Historial de Ventas</h2>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sucursal</label>
            <select
              value={sucursalId ?? ''}
              onChange={(e) => setSucursalId(e.target.value ? Number(e.target.value) : undefined)}
              className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
            >
              <option value="">Todas</option>
              {sucursales.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleSearch}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Buscar
          </button>
          <button
            onClick={handleClear}
            className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {data && !loading && (
        <p className="text-sm text-gray-500">
          Mostrando {data.totalCount} ventas (página {data.page} de {totalPages})
        </p>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">N° Venta</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Sucursal</th>
                  <th className="px-4 py-3">Artículos</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3"><div className="h-4 w-16 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-36 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-28 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-12 bg-gray-100 rounded animate-pulse" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 bg-gray-100 rounded animate-pulse ml-auto" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-4 bg-gray-100 rounded animate-pulse" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && data && data.items.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No hay ventas en este período</p>
          <p className="text-sm text-gray-400 mt-1">Probá con otros filtros o fechas</p>
        </div>
      )}

      {/* Table */}
      {!loading && data && data.items.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">N° Venta</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Sucursal</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Artículos</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 w-10"></th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.items.map((venta) => (
                  <Fragment key={venta.ventaId}>
                    <tr
                      onClick={() => handleToggleExpand(venta.ventaId)}
                      className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${venta.anulada ? 'bg-red-50/50' : ''}`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        #{venta.ventaId}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">
                        {new Date(venta.fecha).toLocaleString('es-AR')}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">
                        {venta.sucursalNombre}
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs">
                        {venta.usuarioNombre || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {venta.cantidadItems} items
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        ${venta.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {venta.anulada ? (
                          <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Anulada</span>
                        ) : (
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${expandedId === venta.ventaId ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!venta.anulada && isWithinLastMonth(venta.fecha) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setUndoVentaId(venta.ventaId) }}
                            className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors"
                            title="Deshacer venta"
                          >
                            Deshacer
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expandedId === venta.ventaId && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 bg-gray-50">
                          {detailLoadingId === venta.ventaId ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                              <span className="ml-2 text-sm text-gray-500">Cargando detalle…</span>
                            </div>
                          ) : detailCache.has(venta.ventaId) ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-gray-700">
                                  Detalle de Venta #{venta.ventaId}
                                </h4>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setExpandedId(null) }}
                                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  Cerrar
                                </button>
                              </div>

                              {/* Detail items table */}
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-left text-gray-500 uppercase tracking-wider border-b border-gray-200">
                                      <th className="px-2 py-1.5 font-medium">Código Barra</th>
                                      <th className="px-2 py-1.5 font-medium">Producto</th>
                                      <th className="px-2 py-1.5 font-medium text-right">Cant.</th>
                                      <th className="px-2 py-1.5 font-medium text-right">P/U</th>
                                      <th className="px-2 py-1.5 font-medium text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {detailCache.get(venta.ventaId)!.items.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-gray-100/50">
                                        <td className="px-2 py-1.5 font-mono text-gray-500">{item.codigoBarra}</td>
                                        <td className="px-2 py-1.5 font-medium text-gray-800">{item.productoNombre}</td>
                                        <td className="px-2 py-1.5 text-right text-gray-700">{item.cantidad}</td>
                                        <td className="px-2 py-1.5 text-right text-gray-700">${item.precioUnitario.toFixed(2)}</td>
                                        <td className="px-2 py-1.5 text-right font-semibold text-gray-900">${item.subtotal.toFixed(2)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="font-semibold text-gray-900 border-t-2 border-gray-300">
                                      <td colSpan={4} className="px-2 py-2 text-right text-sm">Total:</td>
                                      <td className="px-2 py-2 text-right text-sm">
                                        ${detailCache.get(venta.ventaId)!.total.toFixed(2)}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && data && data.items.length > 0 && (
        <div className="flex items-center justify-center gap-4 py-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-600">
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 bg-white hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Siguiente →
          </button>
        </div>
      )}

      {/* Undo confirmation modal */}
      {undoVentaId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setUndoVentaId(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Deshacer venta #{undoVentaId}</h3>
            <p className="text-sm text-gray-600 mb-6">
              El stock se restaurará automáticamente. ¿Devolver el dinero en efectivo?
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleUndo(true)}
                disabled={undoLoading}
                className="w-full bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {undoLoading ? 'Procesando...' : 'Deshacer con devolución'}
              </button>
              <button
                onClick={() => handleUndo(false)}
                disabled={undoLoading}
                className="w-full bg-amber-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                {undoLoading ? 'Procesando...' : 'Deshacer sin devolución'}
              </button>
              <button
                onClick={() => setUndoVentaId(null)}
                disabled={undoLoading}
                className="w-full bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
