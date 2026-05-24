import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import type { ProductoDto } from '../types'

interface EditState {
  id: number
  codigoBarra: string
  nombre: string
  precio: string
  costo: string
}

export default function ProductosPage() {
  const navigate = useNavigate()
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [codigoBarra, setCodigoBarra] = useState('')
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [costo, setCosto] = useState('')
  const [error, setError] = useState('')
  const [postCreateProduct, setPostCreateProduct] = useState<ProductoDto | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editState, setEditState] = useState<EditState | null>(null)

  const [query, setQuery] = useState('')
  const [sugerencias, setSugerencias] = useState<ProductoDto[]>([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const sugerenciasRef = useRef<HTMLDivElement>(null!)

  useEffect(() => { listar() }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sugerenciasRef.current && !sugerenciasRef.current.contains(e.target as Node)) {
        setMostrarSugerencias(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function listar() {
    try {
      setError('')
      setProductos(await api.productos.listar())
    } catch (e: any) { setError(e.message) }
  }

  function handleQueryChange(value: string) {
    setQuery(value)
    setMostrarSugerencias(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) { setSugerencias([]); setBuscandoSugerencias(false); return }
    setBuscandoSugerencias(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.productos.buscar(value.trim())
        setSugerencias(res)
      } catch { setSugerencias([]) }
      finally { setBuscandoSugerencias(false) }
    }, 200)
  }

  function seleccionarSugerencia(p: ProductoDto) {
    setProductos([p])
    setQuery(`${p.codigoBarra} — ${p.nombre}`)
    setMostrarSugerencias(false)
  }

  function mostrarTodos() {
    setQuery('')
    setSugerencias([])
    setMostrarSugerencias(false)
    listar()
  }

  async function handleCrear(e: FormEvent) {
    e.preventDefault()
    try {
      setError('')
      const created = await api.productos.crear({
        codigoBarra, nombre,
        precio: Number(precio), costo: Number(costo),
      })
      setCodigoBarra(''); setNombre(''); setPrecio(''); setCosto('')
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
    })
    setError('')
  }

  function cancelEdit() {
    setEditState(null)
    setError('')
  }

  async function saveEdit() {
    if (!editState) return
    try {
      setError('')
      const updated = await api.productos.actualizar(editState.id, {
        codigoBarra: editState.codigoBarra,
        nombre: editState.nombre,
        precio: parseFloat(editState.precio),
        costo: parseFloat(editState.costo),
      })
      setProductos(prev => prev.map(p => p.id === updated.id ? updated : p))
      setEditState(null)
    } catch (e: any) { setError(e.message) }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Productos</h2>
          <p className="text-sm text-gray-500 mt-0.5">{productos.length} productos activos</p>
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

      {/* Buscador */}
      <div className="relative" ref={sugerenciasRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Buscá por código de barra o nombre…"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onFocus={() => query.trim() && setMostrarSugerencias(true)}
            />
            {buscandoSugerencias && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={mostrarTodos}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Todos
          </button>
        </div>

        {mostrarSugerencias && sugerencias.length > 0 && (
          <div className="absolute z-10 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
            {sugerencias.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => seleccionarSugerencia(p)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-indigo-50 border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors"
              >
                <span className="font-mono text-xs text-gray-400 w-28 truncate">{p.codigoBarra}</span>
                <span className="flex-1 font-medium text-gray-800 truncate">{p.nombre}</span>
                <span className="font-semibold text-gray-900">${p.precio.toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Código barra" value={codigoBarra} onChange={(e) => setCodigoBarra(e.target.value)} required />
            <input className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
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

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {productos.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-400">
                    No hay productos
                  </td>
                </tr>
              )}
              {productos.map((p) => {
                const isEditing = editState?.id === p.id
                return (
                  <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors ${isEditing ? 'bg-indigo-50/50' : ''}`}>
                    {isEditing ? (
                      <>
                        <td className="px-4 py-2">
                          <input
                            value={editState!.codigoBarra}
                            onChange={e => setEditState({ ...editState!, codigoBarra: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-mono"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            value={editState!.nombre}
                            onChange={e => setEditState({ ...editState!, nombre: e.target.value })}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number" step="0.01"
                            value={editState!.precio}
                            onChange={e => setEditState({ ...editState!, precio: e.target.value })}
                            className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-4 py-2 text-right space-x-2">
                          <button onClick={saveEdit} className="text-sm text-green-600 hover:text-green-800 font-medium">Guardar</button>
                          <button onClick={cancelEdit} className="text-sm text-gray-400 hover:text-gray-600">Cancelar</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.codigoBarra}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{p.nombre}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">${p.precio.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right space-x-2">
                          <button onClick={() => startEdit(p)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Editar</button>
                          <button onClick={() => handleEliminar(p.id)} className="text-sm text-gray-400 hover:text-red-500">Eliminar</button>
                        </td>
                      </>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
