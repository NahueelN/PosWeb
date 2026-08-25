import { useState, useEffect, useRef, type FormEvent, type ReactNode } from 'react'
import { api } from '../api/client'
import type { ProductoDto, OpenFoodFactsResultDto, CategoriaDto, UnidadMedidaDto } from '../types'
import { Loader2, Check, X, Package, Plus, Trash2 } from 'lucide-react'
import Dialog from './ui/Dialog'
import DialogPrimaryField from './ui/DialogPrimaryField'
import Button from './ui/Button'
import SelectAltaCruzada from './ui/SelectAltaCruzada'
import { useNotification } from '../context/NotificationContext'

function FieldSection({ title, className = '', children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">{title}</h3>
      {children}
    </div>
  )
}

interface ProductFormModalProps {
  open: boolean
  openContext?: 'manual' | 'scanner' | 'off' | 'edit'
  prefillData?: OpenFoodFactsResultDto | null
  initialCodigo?: string
  editingProduct?: ProductoDto | null
  sucursalId?: number
  defaultEsPesable?: boolean
  onCreated: (producto: ProductoDto) => void
  onDelete?: (producto: ProductoDto) => void
  onClose: () => void
}

export default function ProductFormModal({
  open,
  openContext,
  prefillData,
  initialCodigo,
  editingProduct,
  sucursalId,
  defaultEsPesable,
  onCreated,
  onDelete,
  onClose,
}: ProductFormModalProps) {
  const context = openContext ?? (editingProduct ? 'edit' : prefillData ? 'off' : initialCodigo ? 'scanner' : 'manual')
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
  const [esBulto, setEsBulto] = useState(false)
  const [productoBultoId, setProductoBultoId] = useState('')
  const [productosBulto, setProductosBulto] = useState<ProductoDto[]>([])
  const [loading, setLoading] = useState(false)
  const { notifyError } = useNotification()

  const isEditing = !!editingProduct

  const [categorias, setCategorias] = useState<CategoriaDto[]>([])
  const [unidades, setUnidades] = useState<UnidadMedidaDto[]>([])

  const [showNuevaCategoria, setShowNuevaCategoria] = useState(false)
  const [nuevaCategoriaDesc, setNuevaCategoriaDesc] = useState('')
  const [loadingCategoria, setLoadingCategoria] = useState(false)
  const [showNuevaUnidad, setShowNuevaUnidad] = useState(false)
  const [nuevaUnidadCodigo, setNuevaUnidadCodigo] = useState('')
  const [nuevaUnidadDesc, setNuevaUnidadDesc] = useState('')
  const [loadingUnidad, setLoadingUnidad] = useState(false)

  // Barcode uniqueness check
  const [barcodeStatus, setBarcodeStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const barcodeTimerRef = useRef<ReturnType<typeof setTimeout>>(null)

  const focusAppliedRef = useRef(false)

  type FieldKey =
    | 'codigoBarra'
    | 'codigoProducto'
    | 'nombre'
    | 'marca'
    | 'categoria'
    | 'unidadMedida'
    | 'contenido'
    | 'descripcion'
    | 'costo'
    | 'margen'
    | 'precio'
    | 'seguirStock'
    | 'stock'
    | 'esPesable'
    | 'esBulto'
    | 'productoBulto'

  const FLOW_ORDERS: Record<'manual' | 'scanner' | 'off' | 'edit', FieldKey[]> = {
    manual: ['nombre', 'codigoBarra', 'codigoProducto', 'esPesable', 'esBulto', 'productoBulto', 'marca', 'categoria', 'unidadMedida', 'contenido', 'descripcion', 'costo', 'margen', 'precio', 'seguirStock', 'stock'],
    scanner: ['codigoBarra', 'nombre', 'codigoProducto', 'esPesable', 'esBulto', 'productoBulto', 'marca', 'categoria', 'unidadMedida', 'contenido', 'descripcion', 'costo', 'margen', 'precio', 'seguirStock', 'stock'],
    off: ['codigoBarra', 'nombre', 'marca', 'esPesable', 'esBulto', 'productoBulto', 'categoria', 'unidadMedida', 'contenido', 'descripcion', 'costo', 'margen', 'precio', 'seguirStock', 'stock', 'codigoProducto'],
    edit: ['precio', 'costo', 'stock', 'nombre', 'esPesable', 'esBulto', 'productoBulto', 'marca', 'categoria', 'unidadMedida', 'contenido', 'descripcion', 'codigoBarra', 'codigoProducto', 'seguirStock', 'margen'],
  }

  const INITIAL_FOCUS_PRIORITY: Record<'manual' | 'scanner' | 'off' | 'edit', FieldKey[]> = {
    manual: ['nombre', 'codigoBarra', 'codigoProducto', 'esPesable', 'esBulto', 'productoBulto', 'marca', 'categoria', 'unidadMedida', 'contenido', 'descripcion', 'costo', 'margen', 'precio', 'seguirStock', 'stock'],
    scanner: ['codigoBarra', 'nombre', 'codigoProducto', 'esPesable', 'esBulto', 'productoBulto', 'marca', 'categoria', 'unidadMedida', 'contenido', 'descripcion', 'costo', 'margen', 'precio', 'seguirStock', 'stock'],
    off: ['codigoBarra', 'nombre', 'marca', 'esPesable', 'esBulto', 'productoBulto', 'categoria', 'unidadMedida', 'contenido', 'descripcion', 'costo', 'margen', 'precio', 'seguirStock', 'stock'],
    edit: ['precio', 'costo', 'stock', 'nombre', 'esPesable', 'esBulto', 'productoBulto', 'marca', 'categoria', 'unidadMedida', 'contenido', 'descripcion'],
  }

  const SPATIAL_COORDS: Record<FieldKey, { row: number, col: number }> = {
    nombre: { row: 0, col: 0 },
    codigoBarra: { row: 1, col: 0 },
    codigoProducto: { row: 1, col: 1 },
    esPesable: { row: 2, col: 0 },
    esBulto: { row: 2, col: 0 },
    productoBulto: { row: 2, col: 1 },
    marca: { row: 3, col: 0 },
    categoria: { row: 3, col: 1 },
    unidadMedida: { row: 4, col: 0 },
    contenido: { row: 4, col: 1 },
    descripcion: { row: 5, col: 0 },
    costo: { row: 0, col: 1 },
    margen: { row: 1, col: 1 },
    precio: { row: 2, col: 1 },
    seguirStock: { row: 3, col: 1 },
    stock: { row: 4, col: 1 },
  }

  function getFieldContainer(key: FieldKey): HTMLElement | null {
    return document.querySelector<HTMLElement>(`[data-field="${key}"]`)
  }

  function getFocusableFieldElement(key: FieldKey): HTMLElement | null {
    const container = getFieldContainer(key)
    if (!container) return null
    if (container.matches('input, select, textarea, button, [tabindex]')) return container
    return container.querySelector<HTMLElement>('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])')
  }

  function isFieldDisabled(key: FieldKey): boolean {
    const el = getFocusableFieldElement(key)
    if (!el) return true
    return (el as HTMLInputElement).disabled || (el as HTMLInputElement).readOnly
  }

  function isFieldVisible(key: FieldKey): boolean {
    const el = getFocusableFieldElement(key)
    if (!el) return false
    return !!el.offsetParent || el.getClientRects().length > 0
  }

  function focusField(key: FieldKey) {
    const el = getFocusableFieldElement(key)
    el?.focus()
  }

  function getFlowOrder() {
    return FLOW_ORDERS[context]
  }

  function isKnownValue(key: FieldKey): boolean {
    switch (key) {
      case 'codigoBarra': return !!(codigoBarra.trim() || prefillData?.codigoBarras || initialCodigo || editingProduct?.codigoBarra)
      case 'codigoProducto': return !!(codigoProducto.trim() || editingProduct?.codigoProducto)
      case 'nombre': return !!(nombre.trim() || prefillData?.descripcion || editingProduct?.nombre)
      case 'marca': return !!(marca.trim() || prefillData?.marca || editingProduct?.marca)
      case 'categoria': return !!(categoriaId || prefillData?.categoriaIdSugerido || editingProduct?.categoriaId)
      case 'unidadMedida': return !!(unidadMedidaId || prefillData?.unidad || editingProduct?.unidadMedidaId)
      case 'contenido': return !!(contenido.trim() || prefillData?.contenido != null || editingProduct?.contenido != null)
      case 'descripcion': return !!(descripcion.trim() || editingProduct?.descAdicional)
      case 'costo': return !!(costo.trim() || editingProduct?.costo != null)
      case 'margen': return !!(margen.trim() || editingProduct?.margenGanancia != null)
      case 'precio': return !!(precio.trim() || editingProduct?.precio != null)
      case 'seguirStock': return true
      case 'esPesable': return true
      case 'esBulto': return true
      case 'productoBulto': return !!productoBultoId
      case 'stock': return !!(stock.trim() || editingProduct?.stock != null)
      default: return false
    }
  }

  function getFirstPendingField(): FieldKey | null {
    const order = INITIAL_FOCUS_PRIORITY[context]
    for (const key of order) {
      if (!isFieldVisible(key) || isFieldDisabled(key)) continue
      if (key === 'codigoBarra' && (esPesable || esBulto)) continue
      if (isKnownValue(key)) continue
      return key
    }
    return null
  }

  function moveByFlow(currentKey: FieldKey, direction: 1 | -1) {
    const order = getFlowOrder().filter(key => isFieldVisible(key) && !isFieldDisabled(key))
    const currentIdx = order.indexOf(currentKey)
    if (currentIdx === -1) return
    const next = order[currentIdx + direction]
    if (next) focusField(next)
  }

  function moveSpatial(currentKey: FieldKey, key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight') {
    const current = SPATIAL_COORDS[currentKey]
    if (!current) return
    const candidates = getFlowOrder()
      .filter(candidate => candidate !== currentKey)
      .filter(candidate => isFieldVisible(candidate) && !isFieldDisabled(candidate))
      .map(candidate => ({ key: candidate, ...SPATIAL_COORDS[candidate] }))
      .filter(candidate => candidate.row != null && candidate.col != null)

    const directional = candidates.filter(candidate => {
      switch (key) {
        case 'ArrowUp': return candidate.row < current.row
        case 'ArrowDown': return candidate.row > current.row
        case 'ArrowLeft': return candidate.col < current.col
        case 'ArrowRight': return candidate.col > current.col
      }
    })

    if (directional.length === 0) return

    const scored = directional.map(candidate => {
      const rowDist = Math.abs(candidate.row - current.row)
      const colDist = Math.abs(candidate.col - current.col)
      const primary = key === 'ArrowLeft' || key === 'ArrowRight' ? colDist : rowDist
      const secondary = key === 'ArrowLeft' || key === 'ArrowRight' ? rowDist : colDist
      return { ...candidate, score: primary * 10 + secondary }
    }).sort((a, b) => a.score - b.score)

    focusField(scored[0].key)
  }

  function handleFormKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    const target = e.target as HTMLElement
    if (target.tagName !== 'INPUT' && target.tagName !== 'SELECT' && target.tagName !== 'TEXTAREA') return

    const currentKey = target.closest('[data-field]')?.getAttribute('data-field') as FieldKey | null
    if (!currentKey) return

    if (target.tagName === 'TEXTAREA' && e.key !== 'Tab' && e.key !== 'Enter') return

    if (e.key === 'Tab') {
      e.preventDefault()
      moveByFlow(currentKey, e.shiftKey ? -1 : 1)
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      const order = getFlowOrder().filter(key => isFieldVisible(key) && !isFieldDisabled(key))
      const idx = order.indexOf(currentKey)
      if (idx >= 0 && idx < order.length - 1) {
        focusField(order[idx + 1])
      } else {
        const form = (e.target as HTMLElement).closest('form')
        form?.requestSubmit()
      }
      return
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      moveSpatial(currentKey, e.key)
    }
  }

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      focusAppliedRef.current = false
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
        setEsBulto(editingProduct.esBulto ?? false)
        setProductoBultoId(editingProduct.productoBultoId?.toString() || '')
        setDescripcion(editingProduct.descAdicional || '')
        setMargen(editingProduct.margenGanancia?.toString() || '')
        setBloquearMargen(false)
        setBarcodeStatus('idle')
      } else {
        setCodigoBarra(prefillData?.codigoBarras || initialCodigo || '')
        setNombre(prefillData?.descripcion || '')
        setMarca(prefillData?.marca || '')
        setContenido(prefillData?.contenido?.toString() || '')
        setPrecio(context === 'off' ? '0' : '')
        setCosto(context === 'off' ? '0' : '')
        setCategoriaId('')
        setUnidadMedidaId('')
        setDescripcion('')
        setStock('')
        setSeguirStock(true)
        setEsPesable(defaultEsPesable ?? false)
        setEsBulto(false)
        setProductoBultoId('')
        setMargen('')
        setBloquearMargen(false)
        setBarcodeStatus('idle')
        api.productos.obtenerProximoCodigo()
          .then(res => setCodigoProducto(res.codigo))
          .catch(() => setCodigoProducto(''))
      }
    }
  }, [open, prefillData, initialCodigo, editingProduct])

  useEffect(() => {
    api.categorias.listar().then(setCategorias).catch(() => {})
    api.unidadesMedida.listar().then(setUnidades).catch(() => {})
    api.productos.listar(undefined, undefined).then(ps => setProductosBulto(ps.filter(p => !p.esBulto))).catch(() => {})
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

  // Force KG for pesables (KG = id 2 from seed data), force Unidad for bultos (Unidad = id 1)
  const unidadEfectiva = esPesable ? '2' : esBulto ? '1' : unidadMedidaId

  // Auto-fill margen when category changes
  useEffect(() => {
    if (!categoriaId) return
    const cat = categorias.find(c => c.id === Number(categoriaId))
    if (cat?.margenGanancia != null) {
      setMargen(cat.margenGanancia.toString())
    }
  }, [categoriaId, categorias])

  // When costo or margen changes → recalculate PRECIO (never touches margen)
  useEffect(() => {
    const costoNum = parseFloat(costo)
    const margenNum = parseFloat(margen)
    if (!isNaN(costoNum) && costoNum > 0 && !isNaN(margenNum) && margenNum > 0) {
      const calculado = Math.round(costoNum * (1 + margenNum / 100) * 100) / 100
      setPrecio(calculado.toString())
    }
  }, [costo, margen])

  // When precio changes (user typed it) → recalculate MARGEN
  // costo is deliberately NOT a dependency to avoid the cascade:
  //   costo changes → effect1 updates precio → this does NOT fire again
  useEffect(() => {
    if (bloquearMargen) return
    const costoNum = parseFloat(costo)
    const precioNum = parseFloat(precio)
    if (!isNaN(costoNum) && costoNum > 0 && !isNaN(precioNum) && precioNum > 0) {
      const margenCalculado = ((precioNum - costoNum) / costoNum) * 100
      setMargen((Math.round(margenCalculado * 100) / 100).toString())
    }
  }, [precio, bloquearMargen])

  // Auto-focus first editable field when modal opens
  useEffect(() => {
    if (!open || focusAppliedRef.current) return
    const timer = setTimeout(() => {
      const first = context === 'off'
        ? 'costo'
        : getFirstPendingField() ?? getFlowOrder().find(key => isFieldVisible(key) && !isFieldDisabled(key)) ?? null
      if (first) {
        focusField(first)
        focusAppliedRef.current = true
      }
    }, 0)
    return () => clearTimeout(timer)
  }, [open, context, codigoBarra, nombre, marca, contenido, precio, costo, stock, categoriaId, unidadMedidaId, descripcion, margen, esPesable, esBulto, productoBultoId, editingProduct, prefillData, initialCodigo])

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

  async function handleCrearCategoria() {
    const desc = nuevaCategoriaDesc.trim()
    if (!desc) return
    setLoadingCategoria(true)
    try {
      const nueva = await api.categorias.crear({ descripcion: desc })
      const list = await api.categorias.listar()
      setCategorias(list)
      setCategoriaId(nueva.id.toString())
      setShowNuevaCategoria(false)
      setNuevaCategoriaDesc('')
    } catch {
      notifyError('Error al crear categoría')
    } finally {
      setLoadingCategoria(false)
    }
  }

  async function handleCrearUnidad() {
    const cod = nuevaUnidadCodigo.trim()
    const desc = nuevaUnidadDesc.trim()
    if (!desc) return
    setLoadingUnidad(true)
    try {
      const nueva = await api.unidadesMedida.crear({ codigo: cod || undefined, descripcion: desc })
      const list = await api.unidadesMedida.listar()
      setUnidades(list)
      setUnidadMedidaId(nueva.id.toString())
      setShowNuevaUnidad(false)
      setNuevaUnidadCodigo('')
      setNuevaUnidadDesc('')
    } catch {
      notifyError('Error al crear unidad de medida')
    } finally {
      setLoadingUnidad(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const precioNum = Number(precio)
    const costoNum = Number(costo)

    if (!esBulto && !codigoBarra.trim() && !codigoProducto.trim()) {
      notifyError('Debe proporcionar código de barras o código personalizado')
      return
    }
    if (!nombre.trim()) {
      notifyError('El nombre del producto es obligatorio')
      return
    }
    if (!esBulto && (!precio || precioNum <= 0)) {
      notifyError('El precio debe ser mayor a 0')
      return
    }
    if (!esBulto && (!costo || costoNum < 0)) {
      notifyError('El costo no puede ser negativo')
      return
    }

    if (esBulto && !productoBultoId) {
      notifyError('Debe seleccionar un producto unidad para el bulto')
      return
    }

    setLoading(true)
    try {
      const dto = {
        codigoBarra: codigoBarra.trim(),
        nombre: nombre.trim(),
        precio: esBulto ? 0 : precioNum,
        costo: esBulto ? 0 : costoNum,
        marca: marca.trim() || undefined,
        contenido: contenido ? Number(contenido) : undefined,
        categoriaId: categoriaId ? Number(categoriaId) : undefined,
        unidadMedidaId: unidadEfectiva ? Number(unidadEfectiva) : undefined,
        descAdicional: descripcion.trim() || undefined,
        codigoProducto: codigoProducto.startsWith('PROD') && codigoProducto.length > 4 ? codigoProducto.trim() : undefined,
        margenGanancia: margen ? Number(margen) : undefined,
        seguirStock,
        esPesable,
        esBulto,
        productoBultoId: esBulto && productoBultoId ? Number(productoBultoId) : undefined,
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
      notifyError(e.message || (isEditing ? 'Error al actualizar producto' : 'Error al crear producto'))
    } finally {
      setLoading(false)
    }
  }

  const precioNum = parseFloat(precio)
  const costoNum = parseFloat(costo)
  const precioInferiorCosto = !isNaN(precioNum) && precioNum > 0 && !isNaN(costoNum) && costoNum > 0 && precioNum < costoNum
  const gananciaEstimada = !isNaN(precioNum) && precioNum > 0 && !isNaN(costoNum) && costoNum >= 0
    ? precioNum - costoNum
    : 0

  if (!open) return null

  const isReadonlyCodigo = !!(prefillData?.codigoBarras) || isEditing
  const canSubmit = nombre.trim()
    && (isEditing || esPesable || esBulto || (barcodeStatus !== 'checking' && barcodeStatus !== 'taken'))

  return (
    <><Dialog
      open={open}
      onClose={onClose}
      closeOnBackdrop={false}
      title="PRODUCTO"
      icon={Package}
      highlight={nombre || (isEditing ? 'Editar producto' : 'Nuevo producto')}
      width="xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <div>
            {editingProduct && onDelete && (
              <Button variant="destructive" size="md" icon={<Trash2 size={16} />} type="button" onClick={() => onDelete(editingProduct)}>
                Eliminar
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="md" className="min-w-[128px]" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" size="md" className="min-w-[128px]" icon={loading ? undefined : <Plus size={18} />} type="submit" form="producto-form" disabled={!canSubmit || loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin" />
                  {isEditing ? 'Guardando...' : 'Creando...'}
                </span>
              ) : isEditing ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="producto-form" onSubmit={handleSubmit} onKeyDown={handleFormKeyDown}>
        {/* ── Dos columnas ── */}
        <div className="flex gap-4">

          {/* ══════ COLUMNA IZQUIERDA ══════ */}
          <div className="flex-[7] min-w-0 flex flex-col gap-3">

            {/* ── 1. IDENTIFICACIÓN ── */}
            <FieldSection title="Identificación">
              {/* Nombre — protagonista */}
              <DialogPrimaryField label="Nombre del producto *" data-field="nombre">
                <input type="text" value={nombre} onChange={e => setNombre(e.target.value.toUpperCase())}
                  className="w-full h-10 px-3 border border-gray-300 rounded-lg text-base outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400 placeholder:text-gray-300 uppercase placeholder:normal-case"
                  placeholder="Ej: Leche La Serenísima Entera 1L" />
              </DialogPrimaryField>

              {/* Código de barras + Código interno */}
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Código de barras
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={codigoBarra}
                      onChange={e => setCodigoBarra(e.target.value)}
                      readOnly={isReadonlyCodigo}
                      required
                      data-field="codigoBarra"
                      className={`w-full h-7 px-1.5 border rounded-md text-sm font-mono pr-6 outline-none transition-all duration-150 ${
                        isReadonlyCodigo
                          ? 'bg-gray-50 text-gray-500 border-gray-200'
                          : 'bg-white border-gray-200 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400'
                      }`}
                      placeholder="Código de barras"
                    />
                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2">
                      {barcodeStatus === 'checking' && (
                        <Loader2 size={11} className="text-gray-400 animate-spin" />
                      )}
                      {barcodeStatus === 'available' && (
                        <Check size={11} strokeWidth={2.5} className="text-green-500" />
                      )}
                      {barcodeStatus === 'taken' && (
                        <X size={11} strokeWidth={2.5} className="text-red-500" />
                      )}
                    </span>
                  </div>
                  {barcodeStatus === 'taken' && (
                    <p className="text-[11px] text-red-600 mt-0.5">Este código ya está registrado</p>
                  )}
                  {barcodeStatus === 'available' && codigoBarra.trim() && !isReadonlyCodigo && (
                    <p className="text-[11px] text-green-600 mt-0.5">Código disponible</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Código interno
                  </label>
                  <div className="relative">
                    <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400 select-none">PROD</span>
                    <input
                      type="text"
                      value={codigoProducto.startsWith('PROD') ? codigoProducto.substring(4) : codigoProducto}
                      onChange={e => {
                        const val = e.target.value.trim()
                        setCodigoProducto(val ? 'PROD' + val : '')
                      }}
                      data-field="codigoProducto"
                      className="w-full h-7 pl-[31px] pr-1.5 border border-gray-300 rounded-md text-sm font-mono outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400"
                      placeholder="Auto-generado"
                    />
                  </div>
                </div>
              </div>
            </FieldSection>

            {/* ── 2. CLASIFICACIÓN Y ATRIBUTOS ── */}
            <FieldSection title="Clasificación y atributos">
              {/* Se vende por peso / Es bulto — checkboxes en la misma línea */}
              <div className="flex items-center gap-4 mb-1.5">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={esPesable}
                    onChange={e => { setEsPesable(e.target.checked); if (e.target.checked) setEsBulto(false) }}
                    data-field="esPesable"
                    disabled={esBulto}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary-ring)] transition-shadow disabled:opacity-40"
                  />
                  <span className={`text-sm font-medium transition-colors ${esBulto ? 'text-gray-300' : 'text-gray-800 group-hover:text-[var(--color-primary)]'}`}>Se vende por peso</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={esBulto}
                    onChange={e => { setEsBulto(e.target.checked); if (e.target.checked) setEsPesable(false) }}
                    data-field="esBulto"
                    disabled={esPesable || isEditing}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary-ring)] transition-shadow disabled:opacity-40"
                  />
                  <span className={`text-sm font-medium transition-colors ${esPesable || isEditing ? 'text-gray-300' : 'text-gray-800 group-hover:text-[var(--color-primary)]'}`}>Es bulto</span>
                </label>
                {esPesable && <span className="text-[11px] text-gray-400 font-normal">— Producto por KG. Ej: Fiambres o verduras</span>}
                {esBulto && <span className="text-[11px] text-gray-400 font-normal">— producto sin stock, costo ni precio; representa un empaque</span>}
              </div>

              {/* Fila 1: Marca + Categoría */}
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Marca
                  </label>
                  <input type="text" value={marca} onChange={e => setMarca(e.target.value)}
                    data-field="marca"
                    className="w-full h-7 px-1.5 border border-gray-300 rounded-md text-sm outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400"
                    placeholder="Marca" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                    Categoría
                  </label>
                  <SelectAltaCruzada
                    value={categoriaId}
                    onChange={setCategoriaId}
                    options={categorias.map(c => ({ value: String(c.id), label: c.descripcion }))}
                    placeholder="Sin categoría"
                    onCreate={() => setShowNuevaCategoria(true)}
                    createTitle="Nueva categoría"
                    dataField="categoria"
                  />
                </div>
              </div>

              {/* Fila 2: Unidad de medida + Contenido */}
              <div className={`grid ${esPesable ? 'grid-cols-1' : 'grid-cols-2'} gap-1.5 mt-1.5`}>
                <div>
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${esPesable ? 'text-gray-400' : 'text-gray-700'}`}>
                    Unidad de medida{esPesable ? ' (KG)' : esBulto ? ' (UNIDAD)' : ''}
                  </label>
                  <SelectAltaCruzada
                    value={unidadEfectiva}
                    onChange={setUnidadMedidaId}
                    options={esPesable || esBulto
                      ? [{ value: esPesable ? '2' : '1', label: esPesable ? 'KG - kilogramo' : 'Unidad - unidades' }]
                      : unidades.map(u => ({ value: String(u.id), label: `${u.codigo} - ${u.descripcion}` }))}
                    placeholder={esPesable || esBulto ? undefined : 'Sin unidad'}
                    disabled={esPesable || esBulto}
                    showCreate={!esPesable}
                    onCreate={() => setShowNuevaUnidad(true)}
                    createTitle="Nueva unidad de medida"
                    dataField="unidadMedida"
                  />
                </div>
                {!esPesable && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Contenido
                    </label>
                    <input type="number" step="0.01" value={contenido} onChange={e => setContenido(e.target.value)}
                      data-field="contenido"
                      className="w-full h-7 px-1.5 border border-gray-300 rounded-md text-sm outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400"
                      placeholder="ej: 1750" />
                  </div>
                )}
              </div>
            </FieldSection>

            {/* ── 3. OBSERVACIONES — ocupa el espacio restante ── */}
            <FieldSection title="Observaciones" className="flex-1 flex flex-col">
              <div className="flex-1 flex">
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                  data-field="descripcion"
                  rows={3}
                  className="w-full resize-none px-1.5 py-1 border border-gray-300 rounded-md text-sm outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400 placeholder:text-gray-300"
                  placeholder="Ej: lote 2024, fecha de vencimiento, observaciones (opcional)" />
              </div>
            </FieldSection>
          </div>

          {/* ══════ COLUMNA DERECHA ══════ */}
          <div className="flex-[3] min-w-0 flex flex-col gap-3">

            {/* ── 4. PRECIOS Y GANANCIA (o Producto unidad si es bulto) ── */}
            {esBulto ? (
              <FieldSection title="Producto unidad del bulto">
                <select value={productoBultoId} onChange={e => setProductoBultoId(e.target.value)}
                  data-field="productoBulto"
                  className="w-full h-9 px-2 border border-gray-300 rounded-md text-sm bg-white outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400">
                  <option value="">Seleccionar producto...</option>
                  {productosBulto.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}{p.marca ? ` (${p.marca})` : ''}</option>
                  ))}
                </select>
                <p className="text-[11px] text-gray-400 mt-1.5">El producto unidad representa lo que contiene cada bulto (ej: 1 vino dentro de una caja de 6).</p>
              </FieldSection>
            ) : (
              <FieldSection title="Precios">
                {/* Costo + Margen */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${esBulto ? 'text-gray-400' : 'text-gray-700'}`}>
                      {esPesable ? 'Costo por kg' : 'Costo'}
                    </label>
                    <div className="relative">
                      <input type="number" step="0.01" min="0" value={costo} onChange={e => setCosto(e.target.value)}
                        data-field="costo"
                        disabled={esBulto}
                        className="w-full h-7 px-2 border border-gray-300 rounded-md text-sm outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:bg-gray-100 disabled:text-gray-400"
                        placeholder={esBulto ? '—' : '0.00'} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                      Margen
                    </label>
                    <div className="relative">
                      <input type="number" step="0.01" min="0" value={margen} onChange={e => setMargen(e.target.value)}
                        data-field="margen"
                        className="w-full h-7 px-2 pr-7 border border-gray-300 rounded-md text-sm outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="Auto" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">%</span>
                    </div>
                  </div>
                </div>

                {/* PRECIO DE VENTA — focal */}
                <div className="mt-2.5">
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${esBulto ? 'text-gray-400' : 'text-gray-700'}`}>
                    Precio de venta
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl text-gray-300 select-none font-light">$</span>
                    <input type="number" step="0.01" min="0" value={precio} onChange={e => setPrecio(e.target.value)}
                      data-field="precio"
                      disabled={esBulto}
                      className={`w-full h-12 pl-9 pr-3 rounded-xl text-3xl font-bold outline-none transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none caret-[var(--color-primary)] disabled:bg-gray-100 disabled:text-gray-400 ${
                        esBulto
                          ? 'text-gray-400 bg-gray-100 border border-gray-200'
                          : precioInferiorCosto
                            ? 'text-red-700 bg-red-50/50 border border-red-300 focus:ring-2 focus:ring-red-500/20 focus:bg-red-50'
                            : 'text-gray-900 bg-white border border-gray-300 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] focus:bg-white hover:border-gray-400'
                      }`}
                      placeholder={esBulto ? '—' : '0,00'} />
                    {precioInferiorCosto && !esBulto && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" title="Precio menor al costo">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>

                {/* Ganancia estimada */}
                <div className="flex items-center justify-between mt-2.5">
                  <span className="text-[11px] font-medium text-gray-500">Ganancia estimada</span>
                  <span className={`text-sm font-bold ${gananciaEstimada > 0 ? 'text-emerald-600' : gananciaEstimada < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    ${gananciaEstimada > 0 ? gananciaEstimada.toFixed(2) : gananciaEstimada < 0 ? gananciaEstimada.toFixed(2) : '0.00'}
                  </span>
                </div>
              </FieldSection>
            )}

            {/* ── 5. INVENTARIO ── */}
            <FieldSection title="Inventario">
              <div className="flex items-center gap-2">
                <label className={`flex items-center gap-1.5 select-none group ${esBulto ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    checked={seguirStock}
                    onChange={e => setSeguirStock(e.target.checked)}
                    data-field="seguirStock"
                    disabled={esBulto}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-[var(--color-primary)] focus:ring-[var(--color-primary-ring)] transition-shadow disabled:opacity-40"
                  />
                  <span className={`text-sm font-medium transition-colors ${esBulto ? 'text-gray-400' : 'text-gray-800 group-hover:text-[var(--color-primary)]'}`}>Controlar inventario</span>
                </label>
                <span className="text-[11px] text-gray-400 font-normal">— descuenta stock</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`text-sm font-medium whitespace-nowrap ${esBulto ? 'text-gray-400' : 'text-gray-800'}`}>
                  {isEditing ? 'Stock' : 'Stock inicial'}{esPesable ? ' (kg)' : ''}
                </span>
                <input type="number" min="0" step="1" value={(seguirStock && !esBulto) ? stock : ''} onChange={e => setStock(e.target.value)}
                  disabled={!seguirStock || esBulto}
                  data-field="stock"
                  className={`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none flex-1 h-7 px-1.5 border rounded-md text-sm outline-none transition-all duration-150 ${
                    (!seguirStock || esBulto)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                      : 'bg-white border-gray-200 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400'
                  }`}
                  placeholder={seguirStock ? '0' : 'Sin control'} />
              </div>
            </FieldSection>
          </div>
        </div>
      </form>
    </Dialog>

    {/* ── Alta cruzada: Nueva categoría ── */}
    <Dialog
      open={showNuevaCategoria}
      onClose={() => { setShowNuevaCategoria(false); setNuevaCategoriaDesc('') }}
      title="Nueva categoría"
      width="sm"
      footer={
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm"
            onClick={() => { setShowNuevaCategoria(false); setNuevaCategoriaDesc('') }}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm"
            disabled={!nuevaCategoriaDesc.trim() || loadingCategoria}
            onClick={handleCrearCategoria}>
            {loadingCategoria ? (
              <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Creando...</span>
            ) : 'Crear categoría'}
          </Button>
        </div>
      }>
      <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción *</label>
      <input type="text" value={nuevaCategoriaDesc}
        onChange={e => setNuevaCategoriaDesc(e.target.value.toUpperCase())}
        onKeyDown={e => { if (e.key === 'Enter' && nuevaCategoriaDesc.trim()) handleCrearCategoria() }}
        className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase placeholder:normal-case"
        placeholder="Ej: LÁCTEOS" autoFocus />
    </Dialog>

    {/* ── Alta cruzada: Nueva unidad de medida ── */}
    <Dialog
      open={showNuevaUnidad}
      onClose={() => { setShowNuevaUnidad(false); setNuevaUnidadCodigo(''); setNuevaUnidadDesc('') }}
      title="Nueva unidad de medida"
      width="sm"
      footer={
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm"
            onClick={() => { setShowNuevaUnidad(false); setNuevaUnidadCodigo(''); setNuevaUnidadDesc('') }}>
            Cancelar
          </Button>
          <Button variant="primary" size="sm"
            disabled={!nuevaUnidadDesc.trim() || loadingUnidad}
            onClick={handleCrearUnidad}>
            {loadingUnidad ? (
              <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" />Creando...</span>
            ) : 'Crear unidad'}
          </Button>
        </div>
      }>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Código</label>
          <input type="text" value={nuevaUnidadCodigo}
            onChange={e => setNuevaUnidadCodigo(e.target.value.toUpperCase())}
            className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 uppercase placeholder:normal-case"
            placeholder="Ej: L" autoFocus />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Descripción *</label>
          <input type="text" value={nuevaUnidadDesc}
            onChange={e => setNuevaUnidadDesc(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && nuevaUnidadDesc.trim()) handleCrearUnidad() }}
            className="w-full h-9 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            placeholder="Ej: Litro" />
        </div>
      </div>
    </Dialog>
    </>
  )
}
