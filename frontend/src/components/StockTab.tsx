import { useState, useEffect } from 'react'
import { api } from '../api/client'
import type { ProductoDto } from '../types'

export default function StockTab({ notifyError }: { notifyError: (msg: string) => void }) {
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingProducto, setSavingProducto] = useState<number | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [nuevoValor, setNuevoValor] = useState(true)
  const [resultado, setResultado] = useState<{ afectados: number } | null>(null)
  const [expandido, setExpandido] = useState(false)

  useEffect(() => {
    api.productos.listar()
      .then(prods => {
        setProductos(prods)
        const todosActivos = prods.length > 0 && prods.every(p => p.seguirStock !== false)
        setExpandido(todosActivos)
      })
      .catch(() => notifyError('Error al cargar productos'))
      .finally(() => setLoading(false))
  }, [])

  const conStock = productos.filter(p => p.seguirStock !== false).length
  const sinStock = productos.filter(p => p.seguirStock === false).length
  const todosActivos = productos.length > 0 && conStock === productos.length

  function abrirConfirmacion(seguir: boolean) {
    setNuevoValor(seguir)
    setConfirmOpen(true)
  }

  async function aplicar() {
    setSaving(true)
    setConfirmOpen(false)
    try {
      const res = await api.productos.seguirStockGlobal(nuevoValor)
      setResultado(res)
      setProductos(prev => prev.map(p => ({ ...p, seguirStock: nuevoValor })))
    } catch (err: any) {
      notifyError(err.message || 'Error al actualizar')
    } finally {
      setSaving(false)
    }
  }

  async function toggleProducto(id: number, seguir: boolean) {
    setSavingProducto(id)
    try {
      const updated = await api.productos.seguirStockIndividual(id, seguir)
      setProductos(prev => prev.map(p => p.id === id ? updated : p))
    } catch (err: any) {
      notifyError(err.message || 'Error al actualizar producto')
    } finally {
      setSavingProducto(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-xl text-center text-sm text-slate-500">
        Cargando productos...
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Control de stock global</h2>
        <p className="text-sm text-slate-500">Activá o desactivá el seguimiento de stock para todos los productos.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{conStock}</p>
          <p className="text-xs text-emerald-600 font-medium">Con seguimiento</p>
        </div>
        <div className="bg-slate-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-slate-600">{sinStock}</p>
          <p className="text-xs text-slate-500 font-medium">Sin seguimiento</p>
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
        <div>
          <p className="text-sm font-medium text-slate-800">Seguimiento de stock</p>
          <p className="text-xs text-slate-500">
            {productos.length > 0 && conStock === productos.length
              ? 'Todos los productos controlan inventario'
              : sinStock === productos.length
                ? 'Ningún producto controla inventario'
                : `${conStock} de ${productos.length} productos con seguimiento`}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={todosActivos}
          onClick={() => abrirConfirmacion(!todosActivos)}
          disabled={saving || productos.length === 0}
          className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${
            todosActivos ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
              todosActivos ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Expandable individual product list */}
      <div>
        <button
          onClick={() => setExpandido(!expandido)}
          className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${expandido ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
          </svg>
          Control individual por producto ({productos.length})
        </button>
        {expandido && (
          <div className="mt-3 border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {productos.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No hay productos cargados.</p>
            ) : (
              productos.map(p => (
                <div key={p.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0 flex-1 mr-3">
                    <p className="text-sm text-slate-700 truncate">{p.nombre}</p>
                    <p className="text-xs text-slate-400 truncate">{p.codigoBarra}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={p.seguirStock !== false}
                    disabled={savingProducto === p.id}
                    onClick={() => toggleProducto(p.id, p.seguirStock === false)}
                    className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed ${
                      p.seguirStock !== false ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        p.seguirStock !== false ? 'translate-x-[18px]' : 'translate-x-[3px]'
                      }`}
                    />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {resultado && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl px-4 py-3 text-sm">
          {resultado.afectados} producto{resultado.afectados !== 1 ? 's' : ''} actualizado{resultado.afectados !== 1 ? 's' : ''}.
        </div>
      )}

      {/* Confirm dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setConfirmOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              {nuevoValor ? '¿Habilitar stock para todos?' : '¿Deshabilitar stock para todos?'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {nuevoValor
                ? 'Todos los productos volverán a controlar inventario. Las compras y ventas actualizarán el stock.'
                : 'Ningún producto controlará inventario. Se podrá vender y comprar sin restricciones de stock.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={aplicar}
                className={`px-4 py-2 text-white rounded-xl text-sm font-medium transition-colors ${
                  nuevoValor ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-600 hover:bg-slate-700'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
