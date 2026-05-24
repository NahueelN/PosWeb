import { useState, useEffect, useMemo, useRef } from 'react'
import { useOutletContext, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import type { StockSucursalDto, SucursalDto } from '../types'

export default function StockPage() {
  const { sucursal: ctxSucursal } = useOutletContext<{ sucursal: SucursalDto | null }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sucursalId, setSucursalId] = useState(ctxSucursal?.id ?? 0)
  const [sucursales, setSucursales] = useState<SucursalDto[]>([])
  const [stockList, setStockList] = useState<StockSucursalDto[]>([])
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Inline edit state
  const [editProductoId, setEditProductoId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const appliedTargetFilterRef = useRef(false)

  const STOCK_LIMITE = 5
  const targetProductoId = Number(searchParams.get('productoId') ?? 0)

  // Load sucursales on mount
  useEffect(() => {
    api.sucursales.listar()
      .then(setSucursales)
      .catch(() => {})
  }, [])

  // Load stock when sucursal changes
  useEffect(() => {
    if (sucursalId > 0) {
      loadStock()
    } else {
      setStockList([])
    }
  }, [sucursalId])

  async function loadStock() {
    setLoading(true)
    setError('')
    try {
      const data = await api.stock.listar(sucursalId)
      setStockList(data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const filtered = stockList.filter((s) =>
    !filter.trim()
      ? true
      : s.productoNombre.toLowerCase().includes(filter.toLowerCase()) ||
        s.codigoBarra.toLowerCase().includes(filter.toLowerCase())
  )

  const targetProducto = useMemo(
    () => stockList.find((item) => item.productoId === targetProductoId) ?? null,
    [stockList, targetProductoId],
  )

  const bajoCount = stockList.filter((s) => s.stock <= STOCK_LIMITE).length

  useEffect(() => {
    if (!targetProducto || appliedTargetFilterRef.current) return

    setFilter(targetProducto.productoNombre)
    appliedTargetFilterRef.current = true
  }, [targetProducto])

  function startEdit(item: StockSucursalDto) {
    setEditProductoId(item.productoId)
    setEditValue(String(item.stock))
  }

  function cancelEdit() {
    setEditProductoId(null)
    setEditValue('')
  }

  async function saveEdit(item: StockSucursalDto) {
    const nuevoStock = parseInt(editValue, 10)
    if (isNaN(nuevoStock) || nuevoStock < 0) return

    try {
      setError('')
      await api.stock.ajustar(item.productoId, item.sucursalId, nuevoStock)
      setEditProductoId(null)
      setEditValue('')
      await loadStock()
    } catch (e: any) {
      setError(e.message)
    }
  }

  function clearTargetProducto() {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('productoId')
    setSearchParams(nextParams)
  }

  // No sucursal selected
  if (!sucursalId) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Stock por Sucursal</h2>
        </div>

        {/* Sucursal selector */}
        <div className="max-w-xs">
          <select
            value={sucursalId}
            onChange={(e) => setSucursalId(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
          >
            <option value={0}>Seleccioná una sucursal</option>
            {sucursales.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Empty state */}
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 11.625l2.25-2.25M12 11.625l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">Seleccioná una sucursal para ver el stock</p>
          <p className="text-sm text-gray-400 mt-1">Elegí una sucursal del selector de arriba</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Stock por Sucursal</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {stockList.length} productos
            {bajoCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-medium">
                <span>·</span>
                <span>{bajoCount} con stock bajo</span>
              </span>
            )}
          </p>
        </div>
      </div>

      {targetProducto && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold">Inicialización intencional de stock</p>
            <p className="text-sm text-indigo-800">
              {targetProducto.productoNombre} {targetProducto.inicializado
                ? 'ya tiene stock para esta sucursal.'
                : 'todavía no tiene stock inicializado para esta sucursal.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!targetProducto.inicializado && editProductoId !== targetProducto.productoId && (
              <button
                type="button"
                onClick={() => startEdit(targetProducto)}
                className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Cargar stock ahora
              </button>
            )}
            <button
              type="button"
              onClick={clearTargetProducto}
              className="px-4 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              Ver todo el catálogo
            </button>
          </div>
        </div>
      )}

      {/* Sucursal selector + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={sucursalId}
          onChange={(e) => setSucursalId(Number(e.target.value))}
          className="sm:w-56 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
        >
          <option value={0}>Seleccioná sucursal</option>
          {sucursales.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>

        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            placeholder="Filtrar por nombre o código…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        <button
          onClick={loadStock}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-sm text-gray-500">Cargando stock…</span>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Stock Actual</th>
                  <th className="px-4 py-3">Editar</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      {stockList.length === 0
                        ? 'No hay productos activos en esta sucursal'
                        : 'No se encontraron productos con ese filtro'}
                    </td>
                  </tr>
                )}
                {filtered.map((item) => (
                  <tr
                    key={item.productoId}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      item.stock <= STOCK_LIMITE ? 'bg-amber-50' : ''
                    } ${
                      item.productoId === targetProductoId ? 'ring-2 ring-inset ring-indigo-300 bg-indigo-50/70' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">
                      {item.codigoBarra}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.productoNombre}
                    </td>
                    <td className="px-4 py-3">
                      {editProductoId === item.productoId ? (
                        <input
                          type="number"
                          min={0}
                          className="w-20 border border-indigo-300 rounded-lg px-2 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(item)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                        />
                      ) : (
                        <div className="flex flex-col">
                          <span className={`font-semibold ${
                            item.stock <= STOCK_LIMITE ? 'text-amber-700' : 'text-gray-900'
                          }`}>
                            {item.stock}
                          </span>
                          {!item.inicializado && (
                            <span className="text-xs text-gray-500">Sin movimiento todavía</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editProductoId === item.productoId ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => saveEdit(item)}
                            className="text-xs bg-indigo-600 text-white px-2.5 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 font-medium transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(item)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                        >
                          {item.inicializado ? 'Editar' : 'Inicializar'}
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {!item.inicializado ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-700">
                            Sin inicializar
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            Inicializado
                          </span>
                        )}
                        {item.stock <= STOCK_LIMITE && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            Stock bajo
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Total count */}
      {!loading && stockList.length > 0 && (
        <p className="text-sm text-gray-500">
          Mostrando {filtered.length} de {stockList.length} productos
          {filter.trim() && filtered.length !== stockList.length && (
            <span> · <button onClick={() => setFilter('')} className="text-indigo-600 hover:text-indigo-800 underline">Limpiar filtro</button></span>
          )}
        </p>
      )}
    </div>
  )
}
