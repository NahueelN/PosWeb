import { useState, useEffect, type FormEvent } from 'react'
import { api } from '../api/client'
import type { ProductoDto, OpenFoodFactsResultDto, CategoriaDto, UnidadMedidaDto } from '../types'

interface ProductFormEnrichedProps {
  prefillData?: OpenFoodFactsResultDto | null
  initialCodigo?: string
  onCreated: (producto: ProductoDto) => void
  onCancel: () => void
}

export default function ProductFormEnriched({
  prefillData,
  initialCodigo,
  onCreated,
  onCancel,
}: ProductFormEnrichedProps) {
  const [codigoBarra, setCodigoBarra] = useState(prefillData?.codigoBarras || initialCodigo || '')
  const [nombre, setNombre] = useState(prefillData?.descripcion || '')
  const [marca, setMarca] = useState(prefillData?.marca || '')
  const [contenido, setContenido] = useState(prefillData?.contenido?.toString() || '')
  const [precio, setPrecio] = useState('')
  const [costo, setCosto] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [unidadMedidaId, setUnidadMedidaId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [categorias, setCategorias] = useState<CategoriaDto[]>([])
  const [unidades, setUnidades] = useState<UnidadMedidaDto[]>([])

  useEffect(() => {
    api.categorias.listar().then(setCategorias).catch(() => {})
    api.unidadesMedida.listar().then(setUnidades).catch(() => {})
  }, [])

  // Preseleccionar unidad si el código coincide (ej: "ML" → UnidadMedida con COD="ML")
  useEffect(() => {
    if (prefillData?.unidad && unidades.length > 0) {
      const match = unidades.find(u =>
        u.codigo?.toUpperCase() === prefillData.unidad!.toUpperCase()
      )
      if (match) setUnidadMedidaId(match.id.toString())
    }
  }, [prefillData, unidades])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const precioNum = Number(precio)
    const costoNum = Number(costo)

    if (!precio || precioNum <= 0) {
      setError('El precio debe ser mayor a 0')
      return
    }
    if (!costo || costoNum < 0) {
      setError('El costo no puede ser negativo')
      return
    }

    setLoading(true)
    try {
      const created = await api.productos.crear({
        codigoBarra: codigoBarra.trim(),
        nombre: nombre.trim(),
        precio: precioNum,
        costo: costoNum,
        marca: marca.trim() || undefined,
        contenido: contenido ? Number(contenido) : undefined,
        categoriaId: categoriaId ? Number(categoriaId) : undefined,
        unidadMedidaId: unidadMedidaId ? Number(unidadMedidaId) : undefined,
      })
      onCreated(created)
    } catch (e: any) {
      setError(e.message || 'Error al crear producto')
    } finally {
      setLoading(false)
    }
  }

  const isReadonlyCodigo = !!(prefillData?.codigoBarras)

  return (
    <form onSubmit={handleSubmit}
      className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4 animate-[fadeIn_0.2s_ease]"
    >
      <h3 className="font-semibold text-gray-900 text-sm">
        {prefillData ? 'Completar producto' : 'Nuevo producto'}
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <input
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono"
          placeholder="Código barra"
          value={codigoBarra}
          onChange={(e) => setCodigoBarra(e.target.value)}
          readOnly={isReadonlyCodigo}
          required
        />
        <input
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          placeholder="Nombre *"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
        <input
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          placeholder="Marca"
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
        />
        <input
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          type="number" step="any"
          placeholder="Contenido (ej: 1750)"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
        />
        <select
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
          value={unidadMedidaId}
          onChange={(e) => setUnidadMedidaId(e.target.value)}
        >
          <option value="">Unidad de medida</option>
          {unidades.map(u => (
            <option key={u.id} value={u.id}>{u.descripcion}</option>
          ))}
        </select>
        <select
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none bg-white"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
        >
          <option value="">Categoría</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.descripcion}</option>
          ))}
        </select>
        <input
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          type="number" step="0.01"
          placeholder="Precio venta *"
          value={precio}
          onChange={(e) => setPrecio(e.target.value)}
          required
        />
        <input
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          type="number" step="0.01"
          placeholder="Costo *"
          value={costo}
          onChange={(e) => setCosto(e.target.value)}
          required
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creando...' : 'Crear producto'}
        </button>
      </div>
    </form>
  )
}
