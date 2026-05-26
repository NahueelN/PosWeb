import { useState, useEffect, useMemo, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import ProductCardPanel from '../components/ProductCardPanel'
import type { ProductoDto } from '../types'

interface EditState {
  id: number
  codigoBarra: string
  nombre: string
  precio: string
  costo: string
  tamano: string
}

export default function ProductosPage() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [codigoBarra, setCodigoBarra] = useState('')
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [costo, setCosto] = useState('')
  const [tamano, setTamano] = useState('')
  const [error, setError] = useState('')
  const [postCreateProduct, setPostCreateProduct] = useState<ProductoDto | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)

  const [query, setQuery] = useState('')

  const filteredProductos = useMemo(() => {
    if (!query.trim()) return productos
    const q = query.toLowerCase()
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.codigoBarra.toLowerCase().includes(q)
    )
  }, [productos, query])

  useEffect(() => { listar() }, [])

  async function listar() {
    try {
      setError('')
      setProductos(await api.productos.listar())
    } catch (e: any) { setError(e.message) }
  }

  async function handleCrear(e: FormEvent) {
    e.preventDefault()
    try {
      setError('')
      const created = await api.productos.crear({
        codigoBarra, nombre, tamano: tamano || undefined,
        precio: Number(precio), costo: Number(costo),
      })
      setCodigoBarra(''); setNombre(''); setPrecio(''); setCosto(''); setTamano('')
      setPostCreateProduct(created)
      setShowForm(false)
      await listar()
    } catch (e: any) { setError(e.message) }
  }

  async function handleEliminar(id: number) {
    try {
      setError('')
      await api.productos.eliminar(id)
      await listar()
    } catch (e: any) { setError(e.message) }
  }

  function startEdit(p: ProductoDto) {
    setEditState({
      id: p.id,
      codigoBarra: p.codigoBarra,
      nombre: p.nombre,
      precio: p.precio.toString(),
      costo: p.costo.toString(),
      tamano: p.tamano || '',
    })
    setError('')
  }

  function cancelEdit() {
    setEditState(null)
    setError('')
  }

  async function saveEdit() {
    if (!editState) return
    const id = editState.id
    try {
      setError('')
      const updated = await api.productos.actualizar(id, {
        codigoBarra: editState.codigoBarra,
        nombre: editState.nombre,
        precio: parseFloat(editState.precio),
        costo: parseFloat(editState.costo),
        tamano: editState.tamano || undefined,
      })
      setProductos(prev => prev.map(p => p.id === updated.id ? updated : p))
      setEditState(null)
    } catch (e: any) { setError(e.message) }
  }

  function focusCard(id: number) {
    setTimeout(() => {
      document.querySelector<HTMLElement>(`[data-card-id="${id}"]`)?.focus()
    }, 0)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Productos</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {query
              ? `${filteredProductos.length} de ${productos.length} productos`
              : `${productos.length} productos activos`
            }
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nuevo producto
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
          </svg>
          {error}
        </div>
      )}

      {postCreateProduct && (
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-2xl px-4 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold">Producto creado en catálogo</p>
            <p className="text-sm text-indigo-800">
              {postCreateProduct.nombre} ya existe como producto, pero el stock por sucursal se inicializa aparte.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => navigate(`/stock?productoId=${postCreateProduct.id}`)}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Inicializar stock por sucursal
            </button>
            <button
              type="button"
              onClick={() => setPostCreateProduct(null)}
              className="px-4 py-2.5 bg-white border border-indigo-200 rounded-xl text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              Después
            </button>
          </div>
        </div>
      )}

      {/* Formulario crear */}
      {showForm && (
        <form onSubmit={handleCrear}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4 animate-[fadeIn_0.2s_ease]"
        >
          <h3 className="font-semibold text-gray-900 text-sm">Nuevo producto</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <input className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Código barra" value={codigoBarra} onChange={(e) => setCodigoBarra(e.target.value)} required />
            <input className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            <input className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Tamaño (ej: 500ml, 1kg)" value={tamano} onChange={(e) => setTamano(e.target.value)} />
            <input className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              type="number" step="0.01" placeholder="Precio" value={precio} onChange={(e) => setPrecio(e.target.value)} required />
            <input className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              type="number" step="0.01" placeholder="Costo" value={costo} onChange={(e) => setCosto(e.target.value)} required />
            <button type="submit"
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Crear
            </button>
          </div>
          <p className="text-xs text-gray-500">
            El stock se configura después, por sucursal, desde la pantalla de Stock.
          </p>
        </form>
      )}

      {/* Panel de productos con búsqueda y grilla */}
      {filteredProductos.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium text-sm">No hay productos</p>
        </div>
      ) : (
        <ProductCardPanel
          searchQuery={query}
          onSearchChange={setQuery}
          showHints={true}
        >
          {filteredProductos.map((p) => {
            const isEditing = editState?.id === p.id
            const stockColor = p.stock === 0 ? 'red' : p.stock <= 5 ? 'amber' : 'emerald'

            if (isEditing) {
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border-2 border-indigo-400 p-3 space-y-2 shadow-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      cancelEdit()
                      focusCard(p.id)
                    } else if (e.key === 'Enter') {
                      e.preventDefault()
                      saveEdit().then(() => setTimeout(() => focusCard(p.id), 30))
                    }
                  }}
                >
                  <input
                    value={editState!.codigoBarra}
                    onChange={e => setEditState({ ...editState!, codigoBarra: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    placeholder="Código"
                  />
                  <input
                    value={editState!.nombre}
                    onChange={e => setEditState({ ...editState!, nombre: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    placeholder="Nombre"
                  />
                  <div className="flex gap-1.5">
                    <input
                      value={editState!.tamano}
                      onChange={e => setEditState({ ...editState!, tamano: e.target.value })}
                      className="flex-1 min-w-0 px-2 py-1 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="500ml"
                    />
                    <input
                      type="number" step="0.01"
                      value={editState!.precio}
                      onChange={e => setEditState({ ...editState!, precio: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      autoFocus
                      className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="$"
                    />
                    <input
                      type="number" step="0.01"
                      value={editState!.costo}
                      onChange={e => setEditState({ ...editState!, costo: e.target.value })}
                      className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      placeholder="Costo"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={saveEdit}
                      className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )
            }

            return (
                <button
                  key={p.id}
                  type="button"
                  data-card
                  data-card-id={p.id}
                  onClick={() => startEdit(p)}
                className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.98] focus:ring-2 focus:ring-indigo-500/30 focus:outline-none group"
                title={p.nombre}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-gray-900 text-base leading-tight truncate">
                    {p.nombre}
                  </p>
                  {p.tamano && (
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded shrink-0 mt-0.5">{p.tamano}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 font-mono truncate mt-1">
                  {p.codigoBarra}
                </div>
                <div className="flex items-end justify-between mt-3 gap-3">
                  <p className="text-2xl font-bold text-indigo-600">${p.precio.toFixed(2)}</p>
                  <span className={`inline-flex items-center gap-1.5 text-sm font-semibold rounded-full px-3 py-1 ${
                    stockColor === 'red'
                      ? 'bg-red-50 text-red-600'
                      : stockColor === 'amber'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      stockColor === 'red' ? 'bg-red-500' : stockColor === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />
                    {p.stock === 0 ? 'sin stock' : `${p.stock}`}
                  </span>
                </div>
                {/* Acciones en hover */}
                <div className="flex justify-end gap-3 mt-2 opacity-0 group-hover:opacity-100 transition-opacity -mb-1">
                  <span className="text-xs font-medium text-gray-400 cursor-default">{p.costo > 0 ? `Costo $${p.costo.toFixed(2)}` : ''}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleEliminar(p.id) }}
                    className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </button>
            )
          })}
        </ProductCardPanel>
      )}
    </div>
  )
}
