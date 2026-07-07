import { useState, useEffect, useRef, type FormEvent } from 'react'
import { api } from '../api/client'
import type { ProductoDto, OpenFoodFactsResultDto, CategoriaDto, UnidadMedidaDto } from '../types'
import { Loader2, Check, X } from 'lucide-react'
import Dialog from './ui/Dialog'
import Button from './ui/Button'

interface ProductFormModalProps {
  open: boolean
  prefillData?: OpenFoodFactsResultDto | null
  initialCodigo?: string
  editingProduct?: ProductoDto | null
  sucursalId?: number
  defaultEsPesable?: boolean
  onCreated: (producto: ProductoDto) => void
  onClose: () => void
}

export default function ProductFormModal({
  open,
  prefillData,
  initialCodigo,
  editingProduct,
  sucursalId,
  defaultEsPesable,
  onCreated,
  onClose,
}: ProductFormModalProps) {
  const [codigoBarra, setCodigoBarra] = useState(prefillData?.codigoBarras || initialCodigo || '')
  const [codigoProducto, setCodigoProducto] = useState('')
  const [nombre, setNombre] = useState(prefillData?.descripcion || '')
  const [marca, setMarca] = useState(prefillData?.marca || '')
  const [contenido, setContenido] = useState(prefillData?.contenido?.toString() || '')
  const [precio, setPrecio] = useState('')
  const [costo, setCosto] = useState('')
  const [stock, setStock] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [unidadMedidaId, setUnidadMedidaId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [margen, setMargen] = useState('')
  const [bloquearMargen, setBloquearMargen] = useState(false)
  const [seguirStock, setSeguirStock] = useState(true)
  const [esPesable, setEsPesable] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const isEditing = !!editingProduct

  const [categorias, setCategorias] = useState<CategoriaDto[]>([])
  const [unidades, setUnidades] = useState<UnidadMedidaDto[]>([])

  // Barcode uniqueness check
  const [barcodeStatus, setBarcodeStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const barcodeTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const nombreRef = useRef<HTMLInputElement>(null)

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      if (editingProduct) {
        setCodigoBarra(editingProduct.codigoBarra)
        setCodigoProducto(editingProduct.codigoProducto || '')
        setNombre(editingProduct.nombre)
        setMarca(editingProduct.marca || '')
        setContenido(editingProduct.contenido?.toString() || '')
        setPrecio(editingProduct.precio?.toString() || '')
        setCosto(editingProduct.costo?.toString() || '')
        setCategoriaId(editingProduct.categoriaId?.toString() || '')
        setUnidadMedidaId(editingProduct.unidadMedidaId?.toString() || '')
        setStock(editingProduct.stock?.toString() || '')
        setSeguirStock(editingProduct.seguirStock ?? true)
        setEsPesable(editingProduct.esPesable ?? false)
        setDescripcion(editingProduct.descAdicional || '')
        setMargen(editingProduct.margenGanancia?.toString() || '')
        setBloquearMargen(false)
        setBarcodeStatus('idle')
      } else {
        setCodigoBarra(prefillData?.codigoBarras || initialCodigo || '')
        setNombre(prefillData?.descripcion || '')
        setMarca(prefillData?.marca || '')
        setContenido(prefillData?.contenido?.toString() || '')
        setPrecio('')
        setCosto('')
        setCategoriaId('')
        setUnidadMedidaId('')
        setDescripcion('')
        setStock('')
        setSeguirStock(true)
        setEsPesable(defaultEsPesable ?? false)
        setMargen('')
        setBloquearMargen(false)
        setBarcodeStatus('idle')
        api.productos.obtenerProximoCodigo()
          .then(res => setCodigoProducto(res.codigo))
          .catch(() => setCodigoProducto(''))
      }
      setError('')
    }
  }, [open, prefillData, initialCodigo, editingProduct])

  useEffect(() => {
    api.categorias.listar().then(setCategorias).catch(() => {})
    api.unidadesMedida.listar().then(setUnidades).catch(() => {})
  }, [])

  // Preselect unit from OFF data
  useEffect(() => {
    if (prefillData?.unidad && unidades.length > 0) {
      const match = unidades.find(u =>
        u.codigo?.toUpperCase() === prefillData.unidad!.toUpperCase()
      )
      if (match) setUnidadMedidaId(match.id.toString())
    }
  }, [prefillData, unidades])

  // Preselect category from OFF data
  useEffect(() => {
    if (prefillData?.categoriaIdSugerido && categorias.length > 0) {
      const match = categorias.find(c => c.id === prefillData.categoriaIdSugerido)
      if (match) setCategoriaId(match.id.toString())
    }
  }, [prefillData, categorias])

  // Force KG for pesables (KG = id 2 from seed data)
  const unidadEfectiva = esPesable ? '2' : unidadMedidaId

  // Auto-fill margen when category changes
  useEffect(() => {
    if (!categoriaId) return
    const cat = categorias.find(c => c.id === Number(categoriaId))
    if (cat?.margenGanancia != null) {
      setMargen(cat.margenGanancia.toString())
    }
  }, [categoriaId, categorias])

  // Auto-calculate precio from costo + margen
  useEffect(() => {
    const costoNum = parseFloat(costo)
    const margenNum = parseFloat(margen)
    if (!isNaN(costoNum) && costoNum > 0 && !isNaN(margenNum) && margenNum > 0) {
      const calculado = costoNum * (1 + margenNum / 100)
      setPrecio(Math.ceil(calculado).toString())
    }
  }, [costo, margen])

  // Auto-calculate margen from precio + costo when entered manually
  useEffect(() => {
    if (bloquearMargen) return
    const costoNum = parseFloat(costo)
    const precioNum = parseFloat(precio)
    if (!isNaN(costoNum) && costoNum > 0 && !isNaN(precioNum) && precioNum > 0) {
      const margenActual = parseFloat(margen) || 0
      const precioDesdeMargen = Math.ceil(costoNum * (1 + margenActual / 100))
      // Only recalculate if precio differs from what margen would produce
      if (precioNum !== precioDesdeMargen) {
        const margenCalculado = ((precioNum - costoNum) / costoNum) * 100
        setMargen(Math.ceil(margenCalculado).toString())
      }
    }
  }, [precio, costo, bloquearMargen])

  // Barcode uniqueness check (debounced)
  useEffect(() => {
    const codigo = codigoBarra.trim()
    if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current)
    if (!codigo || prefillData?.codigoBarras || isEditing) {
      setBarcodeStatus('idle')
      return
    }
    setBarcodeStatus('checking')
    barcodeTimerRef.current = setTimeout(async () => {
      try {
        const existing = await api.productos.obtenerPorBarra(codigo)
        if (existing) setBarcodeStatus('taken')
        else setBarcodeStatus('available')
      } catch {
        setBarcodeStatus('available')
      }
    }, 400)
    return () => { if (barcodeTimerRef.current) clearTimeout(barcodeTimerRef.current) }
  }, [codigoBarra, prefillData])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    const precioNum = Number(precio)
    const costoNum = Number(costo)

    if (!esPesable && !codigoBarra.trim()) {
      setError('El código de barras es obligatorio')
      return
    }
    if (!nombre.trim()) {
      setError('El nombre del producto es obligatorio')
      return
    }
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
      const dto = {
        codigoBarra: codigoBarra.trim(),
        nombre: nombre.trim(),
        precio: precioNum,
        costo: costoNum,
        marca: marca.trim() || undefined,
        contenido: contenido ? Number(contenido) : undefined,
        categoriaId: categoriaId ? Number(categoriaId) : undefined,
        unidadMedidaId: unidadEfectiva ? Number(unidadEfectiva) : undefined,
        descAdicional: descripcion.trim() || undefined,
        codigoProducto: codigoProducto.startsWith('PROD') && codigoProducto.length > 4 ? codigoProducto.trim() : undefined,
        margenGanancia: margen ? Number(margen) : undefined,
        seguirStock,
        esPesable,
      }
      const result = isEditing
        ? await api.productos.actualizar(editingProduct!.id, dto)
        : await api.productos.crear(dto)

      // Adjust stock if value provided, sucursalId is available, and stock tracking is enabled
      if (seguirStock && sucursalId) {
        const stockNum = stock.trim() !== '' ? parseInt(stock) : NaN
        if (!isNaN(stockNum)) {
          try {
            await api.stock.ajustar(result.id, sucursalId, stockNum)
            result.stock = stockNum
          } catch {
            result.stock = isEditing ? editingProduct!.stock : 0
          }
        } else if (isEditing) {
          result.stock = editingProduct!.stock
        }
      } else if (isEditing) {
        result.stock = editingProduct!.stock
      }

      onCreated(result)
    } catch (e: any) {
      setError(e.message || (isEditing ? 'Error al actualizar producto' : 'Error al crear producto'))
    } finally {
      setLoading(false)
    }
  }

  const precioNum = parseFloat(precio)
  const costoNum = parseFloat(costo)
  const precioInferiorCosto = !isNaN(precioNum) && precioNum > 0 && !isNaN(costoNum) && costoNum > 0 && precioNum < costoNum

  if (!open) return null

  const isReadonlyCodigo = !!(prefillData?.codigoBarras) || isEditing
  const canSubmit = nombre.trim()
    && (isEditing || esPesable || (barcodeStatus !== 'checking' && barcodeStatus !== 'taken'))
    && (esPesable || codigoBarra.trim())

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? 'Editar producto' : prefillData ? 'Completar producto' : 'Nuevo producto'}
      width="lg"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" size="sm" type="submit" form="producto-form" disabled={!canSubmit || loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                {isEditing ? 'Guardando...' : 'Creando...'}
              </span>
            ) : isEditing ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </>
      }
    >
      <form id="producto-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo de producto toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          <button
            type="button"
            onClick={() => setEsPesable(false)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              !esPesable
                ? 'bg-white shadow text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Producto normal
          </button>
          <button
            type="button"
            onClick={() => setEsPesable(true)}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              esPesable
                ? 'bg-white shadow text-indigo-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Producto por peso
          </button>
        </div>
          {/* Código de barras + Código interno */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Código de barras</label>
              <div className="relative">
                <input
                  type="text"
                  value={codigoBarra}
                  onChange={e => setCodigoBarra(e.target.value)}
                  readOnly={isReadonlyCodigo}
                  required
                  className={`w-full px-3 py-2 border rounded-lg text-sm font-mono pr-8 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none ${
                    isReadonlyCodigo ? 'bg-gray-50 text-gray-500' : ''
                  }`}
                  placeholder="Código de barras"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2">
                  {barcodeStatus === 'checking' && (
                    <Loader2 size={16} className="text-gray-400 animate-spin" />
                  )}
                  {barcodeStatus === 'available' && (
                    <Check size={16} strokeWidth={2.5} className="text-green-500" />
                  )}
                  {barcodeStatus === 'taken' && (
                    <X size={16} strokeWidth={2.5} className="text-red-500" />
                  )}
                </span>
              </div>
              {barcodeStatus === 'taken' && (
                <p className="text-xs text-red-600 mt-0.5">Este código ya está registrado</p>
              )}
              {barcodeStatus === 'available' && codigoBarra.trim() && !isReadonlyCodigo && (
                <p className="text-xs text-green-600 mt-0.5">Código disponible</p>
              )}
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Código interno</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-mono text-gray-400 select-none">PROD</span>
                <input
                  type="text"
                  value={codigoProducto.startsWith('PROD') ? codigoProducto.substring(4) : codigoProducto}
                  onChange={e => {
                    const val = e.target.value.trim()
                    setCodigoProducto(val ? 'PROD' + val : '')
                  }}
                  className="w-full pl-14 pr-3 py-2 border rounded-lg text-sm font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  placeholder="Auto-generado"
                />
              </div>
            </div>
          </div>

          {/* Nombre — full width */}
          <div>
            <label className="text-xs font-semibold text-gray-700">Nombre *</label>
            <input ref={nombreRef} type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              autoFocus={isEditing}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              placeholder="Nombre del producto" />
          </div>

          {/* Marca + Categoría */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-700">Marca</label>
              <input type="text" value={marca} onChange={e => setMarca(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                placeholder="Marca" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700">Categoría</label>
              <select value={categoriaId} onChange={e => setCategoriaId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none">
                <option value="">Sin categoría</option>
                {categorias.map(c => (
                  <option key={c.id} value={c.id}>{c.descripcion}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contenido + Unidad + Stock */}
          <div className={`grid ${esPesable ? 'grid-cols-2' : 'grid-cols-3'} gap-3`}>
            {!esPesable && (
              <div>
                <label className="text-xs font-semibold text-gray-700">Contenido</label>
                <input type="number" step="0.01" value={contenido} onChange={e => setContenido(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  placeholder="ej: 1750" />
              </div>
            )}
            <div>
              <label className={`text-xs font-semibold ${esPesable ? 'text-gray-400' : 'text-gray-700'}`}>Unidad de medida{esPesable ? ' (KG)' : ''}</label>
              <select value={unidadEfectiva} onChange={e => setUnidadMedidaId(e.target.value)}
                disabled={esPesable}
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none ${
                  esPesable
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}>
                {esPesable ? (
                  <option value="2">KG - kilogramo</option>
                ) : (
                  <>
                    <option value="">Sin unidad</option>
                    {unidades.map(u => (
                      <option key={u.id} value={u.id}>{u.codigo} - {u.descripcion}</option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div>
              <label className={`text-xs font-semibold ${!seguirStock ? 'text-gray-400' : 'text-gray-700'}`}>
                {isEditing ? 'Stock' : 'Stock inicial'}{esPesable ? ' (en kg)' : ''}
              </label>
              <input type="number" min="0" step="1" value={seguirStock ? stock : ''} onChange={e => setStock(e.target.value)}
                disabled={!seguirStock}
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  !seguirStock
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
                placeholder={seguirStock ? '0' : 'Sin control'} />
            </div>
          </div>

          {/* Seguir Stock */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={seguirStock}
                onChange={e => setSeguirStock(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-700">Seguir stock</span>
              <span className="text-xs text-gray-400">(desmarcar para productos sin control de inventario)</span>
            </label>
          </div>

          {/* Margen + Costo + Precio */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700">Margen %</label>
                <div className="relative">
                  <input type="number" step="0.01" min="0" value={margen} onChange={e => setMargen(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="Auto" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">{esPesable ? 'Costo por kg *' : 'Costo *'}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">$</span>
                  <input type="number" step="0.01" min="0" value={costo} onChange={e => setCosto(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">{esPesable ? 'Precio por kg *' : 'Precio venta *'}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 select-none">$</span>
                  <input type="number" step="0.01" min="0" value={precio} onChange={e => setPrecio(e.target.value)}
                    className={`w-full pl-7 py-2 border rounded-lg text-sm focus:ring-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-gray-900 ${
                      precioInferiorCosto
                        ? 'pr-8 border-red-400 text-red-700 focus:ring-red-500/20 focus:border-red-500'
                        : 'pr-3 focus:ring-indigo-500/20 focus:border-indigo-500'
                    }`}
                    placeholder="0.00" />
                  {precioInferiorCosto && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-red-500" title="Precio menor al costo">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                      </svg>
                    </span>
                  )}
                </div>
            </div>
            </div>
            <p className="text-[11px] text-gray-400 whitespace-nowrap">
              En configuración podés asignar y actualizar los márgenes de ganancia por categoría.
            </p>

          </div>

          {/* Descripción adicional — full width abajo */}
          <div>
            <label className="text-xs font-semibold text-gray-700">Descripción adicional</label>
            <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              placeholder="Descripción" />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}
      </form>
    </Dialog>
  )
}
