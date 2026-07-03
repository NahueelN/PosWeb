import { useState, useEffect, useMemo, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../hooks/useCart'
import { useItemSnapshot } from '../hooks/useItemSnapshot'
import CartHost from '../components/hosts/CartHost'
import KeyboardHints from '../components/shared/KeyboardHints'
import ProductCard, { formatCodigoBarra } from '../components/shared/ProductCard'
import Dialog from '../components/ui/Dialog'
import Button from '../components/ui/Button'
import { MapPin, ChevronRight, Banknote, ArrowLeftRight, CreditCard, Smartphone, QrCode, X, Undo2, Trash2, Search, PackageSearch, Sparkles, Plus, AlertTriangle } from 'lucide-react'

interface Item {
  producto: ProductoDto
  cantidad: number
  comboId?: number
  comboNombre?: string
  comboPrecio?: number
  ofertaId?: number
  descuentoAplicado?: number
  precioOriginal?: number
}

type Step = 'sucursal' | 'venta' | 'resultado'

function estaVigenteHoy(fechaInicio: string | null | undefined, fechaFin: string | null | undefined, diasSemana: string | null | undefined, activo: boolean): boolean {
  if (!activo) return false
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  if (fechaInicio && hoy < new Date(fechaInicio)) return false
  if (fechaFin && hoy > new Date(fechaFin)) return false
  if (diasSemana && diasSemana.trim()) {
    const dias = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
    const diaActual = dias[hoy.getDay()]
    const diasOferta = diasSemana.split(',').map(d => d.trim().toUpperCase())
    if (!diasOferta.includes(diaActual)) return false
  }
  return true
}

export default function VentasPage() {
  const { sucursal: ctxSucursal } = useOutletContext<{ sucursal: SucursalDto | null }>()
  const [step, setStep] = useState<Step>(
    ctxSucursal ? 'venta' : 'sucursal'
  )

  const [sucursales, setSucursales] = useState<SucursalDto[]>([])
  const [ultimosItems, setUltimosItems] = useState<Item[]>([])
  const [resultado, setResultado] = useState<VentaResultadoDto | null>(null)
  const { notifyError } = useNotification()
  const { user } = useAuth()
  const confirmBtnRef = useRef<HTMLButtonElement>(null!)
  const medioRefs = useRef<(HTMLButtonElement | null)[]>([])
  const recibioInputRef = useRef<HTMLInputElement>(null!)
  const imprimirBtnRef = useRef<HTMLButtonElement>(null!)
  const nuevaVentaBtnRef = useRef<HTMLButtonElement>(null!)

  const cart = useCart<Item>({
    storageKey: 'venta_cart_items',
    storage: sessionStorage,
    getId: (i) => i.comboId ?? i.producto.id,
    getPrecioUnitario: (i) => i.producto.precio,
  })
  const total = cart.total

  // Caja
  const [cajaActiva, setCajaActiva] = useState<boolean | null>(null)
  const [cajaLoading, setCajaLoading] = useState(true)

  // Payments
  const [mediosPago, setMediosPago] = useState<MedioPagoDto[]>([])
  const [selectedMedio, setSelectedMedio] = useState<MedioPagoDto | null>(null)
  const [recibio, setRecibio] = useState('')
  const [unidades, setUnidades] = useState<UnidadMedidaDto[]>([])

  // Deuda flow
  const [showStockConfirm, setShowStockConfirm] = useState(false)
  const [stockConflictItems, setStockConflictItems] = useState<Item[]>([])
  const [showClientPopup, setShowClientPopup] = useState(false)
  const [clientesBusqueda, setClientesBusqueda] = useState('')
  const [clientesResultados, setClientesResultados] = useState<ClienteDto[]>([])
  const [buscandoClientes, setBuscandoClientes] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteDto | null>(null)
  // Nuevo cliente
  const [showNuevoCliente, setShowNuevoCliente] = useState(false)
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('')
  const [esOcasional, setEsOcasional] = useState(true)
  const [formCliente, setFormCliente] = useState({
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    ivaCondicion: 'ConsumidorFinal',
    telefono: '',
    domicilio: '',
  })

  // Product grid
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [combos, setCombos] = useState<ComboDto[]>([])
  const [ofertas, setOfertas] = useState<OfertaDto[]>([])
  const [productosLoading, setProductosLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const searchInputRef = useRef<HTMLInputElement>(null!)
  const productGridRef = useRef<HTMLDivElement>(null!)
  const cartListRef = useRef<HTMLDivElement>(null!)
  const cantidadRefs = useRef<Map<number, HTMLInputElement>>(new Map())
  const { markAdded, onFocusQty, onEscape } = useItemSnapshot()
  const stockCancelarRef = useRef<HTMLButtonElement>(null!)
  const [cantidadDrafts, setCantidadDrafts] = useState<Record<number, string>>({})
  const [comboUndoPopup, setComboUndoPopup] = useState<number | null>(null)
  const comboTriggerRef = useRef<HTMLButtonElement | null>(null)
  const clientesResultsRef = useRef<HTMLDivElement | null>(null)
  const openComboMenu = (comboId: number, trigger: HTMLButtonElement) => {
    comboTriggerRef.current = trigger
    setComboUndoPopup(comboId)
  }
  const closeComboMenu = () => {
    setComboUndoPopup(null)
    comboTriggerRef.current?.focus()
  }
  const pendingAllowSinStock = useRef(false)

  // Flag: si el cajero editó manualmente el monto recibido, NO sobreescribir al cambiar el total
  const recibioManuallyEdited = useRef(false)

  const unidadesMap = useMemo(() => {
    const m = new Map<number, string>()
    for (const u of unidades) m.set(u.id, u.codigo)
    return m
  }, [unidades])

  const ofertasMap = useMemo(() => {
    const ahora = new Date()
    const m = new Map<number, OfertaDto>()
    for (const o of ofertas) {
      if (estaVigenteHoy(o.fechaInicio, o.fechaFin, o.diasSemana, o.activo)) {
        m.set(o.productoId, o)
      }
    }
    return m
  }, [ofertas])

  const combosVigentes = useMemo(() =>
    combos.filter(c => estaVigenteHoy(c.fechaInicio, c.fechaFin, c.diasSemana, c.activo)),
    [combos])

  // Sincronizar Recibió con el total solo si el cajero no lo editó manualmente
  useEffect(() => {
    if (!recibioManuallyEdited.current) {
      setRecibio(total.toFixed(2))
    }
  }, [total])

  // Auto-focus al buscador al volver a la pantalla de venta
  useEffect(() => {
    if (step === 'venta') {
      const id = setTimeout(() => searchInputRef.current?.focus(), 150)
      return () => clearTimeout(id)
    }
  }, [step])

  // Atajo Ctrl+Enter (o Cmd+Enter) para confirmar venta desde cualquier foco
  useEffect(() => {
    if (step !== 'venta') return
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (selectedMedio && cart.items.length > 0) {
          e.preventDefault()
          confirmarVenta()
        }
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [step, selectedMedio, cart.items.length, confirmarVenta])

  // Computed: client-side filter by name or barcode
  const filteredProductos = useMemo(() => {
    if (!searchQuery.trim()) return productos
    const q = searchQuery.toLowerCase()
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.codigoBarra.toLowerCase().includes(q)
    )
  }, [productos, searchQuery])

  // Barcode auto-add: cuando el texto coincide exactamente con un código de barra,
  // agrega el producto al carrito automáticamente (sin requerir click)
  useEffect(() => {
    const q = searchQuery.trim()
    if (!q) return
    const match = productos.find(p => p.codigoBarra.toLowerCase() === q.toLowerCase())
    if (match) {
      agregarProducto(match)
    }
  }, [searchQuery, productos])

  const filteredCombos = useMemo(() => {
    if (!searchQuery.trim()) return combosVigentes
    const q = searchQuery.toLowerCase()
    return combosVigentes.filter(c =>
      c.descCombo.toLowerCase().includes(q) ||
      c.codCombo.toLowerCase().includes(q)
    )
  }, [combosVigentes, searchQuery])

  // Auto-detectar combo: si los productos individuales coinciden con un combo, reemplazar automáticamente
  const autoComboRef = useRef(false)
  const [dismissedCombos, setDismissedCombos] = useState<Set<number>>(new Set())
  // Clear dismissed combos when cart empties
  useEffect(() => {
    if (cart.items.length === 0 && dismissedCombos.size > 0) setDismissedCombos(new Set())
  }, [cart.items.length === 0])
  useEffect(() => {
    if (autoComboRef.current) { autoComboRef.current = false; return }
    if (cart.items.length === 0) return

    // Un-dismiss combos whose items are no longer all present in cart
    if (dismissedCombos.size > 0) {
      setDismissedCombos(prev => {
        const next = new Set(prev)
        for (const comboId of prev) {
          const combo = combos.find(c => c.id === comboId)
          if (!combo) { next.delete(comboId); continue }
          const stillPresent = combo.items.every(ci => {
            const cartItem = cart.items.find(i => !i.comboId && i.producto.id === ci.productoId)
            return cartItem && cartItem.cantidad >= ci.cantidad
          })
          if (!stillPresent) next.delete(comboId)
        }
        return next.size === prev.size ? prev : next
      })
    }

    const match = combosVigentes.find(combo => {
      if (cart.items.some(i => i.comboId === combo.id)) return false
      if (dismissedCombos.has(combo.id)) return false
      return combo.items.every(ci => {
        const cartItem = cart.items.find(i => !i.comboId && i.producto.id === ci.productoId)
        return cartItem && cartItem.cantidad >= ci.cantidad
      })
    })
    if (!match) return

    autoComboRef.current = true
    cart.setItems(prev => {
      const filtered = prev
        .map(i => {
          if (i.comboId) return i
          const ci = match.items.find(c => c.productoId === i.producto.id)
          if (!ci) return i
          const rest = i.cantidad - ci.cantidad
          if (rest <= 0) return null
          return { ...i, cantidad: rest }
        })
        .filter(Boolean) as Item[]
      return [...filtered, {
        producto: { id: 0, codigoBarra: match.codCombo, nombre: match.descCombo, precio: match.precio, costo: 0, stock: 999, activo: true },
        cantidad: 1,
        comboId: match.id,
        comboNombre: match.descCombo,
        comboPrecio: match.precio,
      } as Item]
    })
  }, [cart.items, combos])

  // --- Load data ---
  useEffect(() => {
    if (step === 'sucursal') {
      api.sucursales.listar().then(setSucursales).catch(() => {})
    }
    if (step === 'venta' && ctxSucursal) {
      setCajaLoading(true)
      api.cajas.activa(ctxSucursal.id)
        .then(res => setCajaActiva(res.activa))
        .catch(() => setCajaActiva(false))
        .finally(() => setCajaLoading(false))
      api.mediosPago.listar()
        .then(mp => {
          // Orden: Efectivo → Transferencia → resto por ID
          const prioridad = [1, 4]
          mp.sort((a, b) => {
            const ia = prioridad.indexOf(a.id)
            const ib = prioridad.indexOf(b.id)
            if (ia !== -1 && ib !== -1) return ia - ib
            if (ia !== -1) return -1
            if (ib !== -1) return 1
            return a.id - b.id
          })
          setMediosPago(mp)
        })
        .catch(() => {})

      api.unidadesMedida.listar()
        .then(setUnidades)
        .catch(() => {})

      // Load all products for grid browsing
      setProductosLoading(true)
      api.productos.listar(ctxSucursal.id)
        .then(setProductos)
        .catch(() => {})
        .finally(() => setProductosLoading(false))
      api.combos.listar()
        .then(setCombos)
        .catch(() => {})
      api.ofertas.listar()
        .then(setOfertas)
        .catch(() => {})
    }
  }, [step, ctxSucursal])

  useEffect(() => {
    if (ctxSucursal && step === 'sucursal') setStep('venta')
    if (!ctxSucursal && step !== 'sucursal') setStep('sucursal')
  }, [ctxSucursal, step])

  // Auto-scroll del carrito al último item cuando se agrega uno nuevo
  useEffect(() => {
    if (cartListRef.current) {
      cartListRef.current.scrollTop = cartListRef.current.scrollHeight
    }
  }, [cart.items])

  // Focus "Cancelar" cuando se abre el diálogo de stock insuficiente
  useEffect(() => {
    if (showStockConfirm) {
      setTimeout(() => stockCancelarRef.current?.focus(), 50)
    }
  }, [showStockConfirm])

  // Búsqueda de clientes
  useEffect(() => {
    if (!showClientPopup || clientesBusqueda.trim().length < 1) {
      setClientesResultados([])
      return
    }
    const timer = setTimeout(async () => {
      setBuscandoClientes(true)
      try {
        const res = await api.clientes.listar(clientesBusqueda.trim())
        setClientesResultados(res.items ?? [])
      } catch { /* ignore */ }
      setBuscandoClientes(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [clientesBusqueda, showClientPopup])

  async function crearClienteYRevertir() {
    if (nuevoClienteNombre.trim().length < 2) return
    try {
      const dto: ClienteDto = esOcasional
        ? {
            nombre: nuevoClienteNombre.trim(),
            tipoDocumento: 'ConsumidorFinal',
            numeroDocumento: '',
            ivaCondicion: 'ConsumidorFinal',
          }
        : {
            nombre: nuevoClienteNombre.trim(),
            tipoDocumento: formCliente.tipoDocumento,
            numeroDocumento: formCliente.numeroDocumento,
            ivaCondicion: formCliente.ivaCondicion,
            telefono: formCliente.telefono || undefined,
            domicilio: formCliente.domicilio || undefined,
          }
      const nuevo = await api.clientes.crear(dto)
      setClienteSeleccionado(nuevo)
      setShowNuevoCliente(false)
      setShowClientPopup(false)
      setNuevoClienteNombre('')
      setEsOcasional(true)
      setFormCliente({ tipoDocumento: 'DNI', numeroDocumento: '', ivaCondicion: 'ConsumidorFinal', telefono: '', domicilio: '' })
      ejecutarVenta(parseFloat(recibio) || 0, pendingAllowSinStock.current, nuevo)
    } catch (e: any) { notifyError(e.message) }
  }

  function seleccionarSucursal(s: SucursalDto) {
    localStorage.setItem('sucursalActiva', JSON.stringify(s))
    setStep('venta')
    window.location.reload()
  }

  function agregarProducto(producto: ProductoDto) {
    const existing = cart.items.find(i => !i.comboId && i.producto.id === producto.id)
    markAdded(producto.id, existing?.cantidad)
    const oferta = ofertasMap.get(producto.id)
    const item: Item = oferta
      ? {
          producto: { ...producto, precio: producto.precio * (1 - oferta.descuento / 100) },
          cantidad: 1,
          ofertaId: oferta.id,
          descuentoAplicado: oferta.descuento,
          precioOriginal: producto.precio,
        }
      : { producto, cantidad: 1 }
    cart.addItem(item)
    setSearchQuery('')
    // Flash visual en el buscador
    const el = searchInputRef.current
    if (el) { el.classList.remove('animate-barcode-flash'); void el.offsetWidth; el.classList.add('animate-barcode-flash') }
    setCantidadDrafts((prev) => {
      const next = { ...prev }
      delete next[producto.id]
      return next
    })
    // Enfocar el input de cantidad del producto recién agregado o actualizado
    setTimeout(() => {
      const input = cantidadRefs.current.get(producto.id)
      if (input) {
        input.focus()
        input.select()
      }
    }, 0)
  }

  function agregarCombo(combo: ComboDto) {
    markAdded(combo.id)
    cart.addItem({
      producto: { id: 0, codigoBarra: combo.codCombo, nombre: combo.descCombo, precio: combo.precio, costo: 0, stock: 999, activo: true },
      cantidad: 1,
      comboId: combo.id,
      comboNombre: combo.descCombo,
      comboPrecio: combo.precio,
    } as Item)
    setSearchQuery('')
    setTimeout(() => {
      const input = cantidadRefs.current.get(combo.id)
      if (input) {
        input.focus()
        input.select()
      }
    }, 0)
  }

  function handleCambiarCantidad(productoId: number, cantidad: number, comboId?: number) {
    cart.updateQuantity(comboId ?? productoId, Math.max(0, cantidad))
  }

  function quitarItem(productoId: number, comboId?: number) {
    cart.removeItem(comboId ?? productoId)
  }

  async function deshacerCombo(comboId: number) {
    const combo = combos.find(c => c.id === comboId)
    if (!combo) return
    setDismissedCombos(prev => new Set(prev).add(comboId))

    // Fetch real product data first so prices are correct from the start
    const detalles = await Promise.all(
      combo.items.map(ci =>
        ci.productoId ? api.productos.detalle(ci.productoId).catch(() => null) : Promise.resolve(null)
      )
    )

    cart.setItems(prev => {
      const sinCombo = prev.filter(i => i.comboId !== comboId)
      const individuales = combo.items.map((ci, idx) => {
        const p = detalles[idx]
        const producto = p
          ? { id: p.id, codigoBarra: p.codigoBarra, nombre: p.nombre, precio: p.precio, costo: p.costo, stock: p.stock, activo: p.activo }
          : { id: ci.productoId, codigoBarra: '', nombre: ci.productoNombre ?? `Producto #${ci.productoId}`, precio: 0, costo: 0, stock: 999, activo: true }
        return { producto, cantidad: ci.cantidad }
      }) as Item[]
      return [...sinCombo, ...individuales]
    })
  }

  // --- Payment ---
  function selectMedio(mp: MedioPagoDto) {
    setSelectedMedio(mp)
    setTimeout(() => recibioInputRef.current?.focus(), 0)
  }

  function handleMedioKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const prev = idx - 1
      if (prev >= 0) medioRefs.current[prev]?.focus()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      const next = idx + 1
      if (next < mediosPago.length) medioRefs.current[next]?.focus()
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault() // no-op: medios are in a horizontal row
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      selectMedio(mediosPago[idx])
    }
  }

  async function confirmarVenta() {
    if (!ctxSucursal || cart.items.length === 0) return

    if (!cajaActiva) {
      try {
        const res = await api.cajas.activa(ctxSucursal.id)
        if (!res.activa) {
          notifyError('No hay caja abierta. Andá a Caja y abrí una primero.')
          return
        }
        setCajaActiva(true)
      } catch {
        notifyError('No hay caja abierta. Andá a Caja y abrí una primero.')
        return
      }
    }

    const recibioValor = parseFloat(recibio) || 0

    // Validate: must select a payment method
    if (!selectedMedio) {
      notifyError('Seleccioná un medio de pago antes de confirmar.')
      return
    }

    // Check stock before sending (skip if already accepted in this session)
    if (!pendingAllowSinStock.current) {
      const sinStock = cart.items.filter(i => i.cantidad > i.producto.stock)
      if (sinStock.length > 0) {
        setStockConflictItems(sinStock)
        setShowStockConfirm(true)
        return
      }
    }

    // If total payment wasn't received, ask about debt first
    if (recibioValor < total && !clienteSeleccionado) {
      setShowClientPopup(true)
      return
    }

    await ejecutarVenta(recibioValor, pendingAllowSinStock.current)
    pendingAllowSinStock.current = false
  }

  function continuarVenta() {
    const recibioValor = parseFloat(recibio) || 0
    if (selectedMedio && recibioValor < total && !clienteSeleccionado) {
      setShowClientPopup(true)
      return
    }
    ejecutarVenta(recibioValor, pendingAllowSinStock.current)
    pendingAllowSinStock.current = false
  }

  async function ejecutarVenta(recibioValor: number, allowSinStock = false, cliente?: ClienteDto) {
    if (!ctxSucursal) return
    try {
      const pagosDto: PagoVentaDto[] = []

      if (selectedMedio && recibioValor > 0) {
        const monto = recibioValor < total ? recibioValor : total
        pagosDto.push({
          medioPagoId: selectedMedio.id,
          monto,
        })
        if (selectedMedio.pagaVuelto && recibioValor > total) {
          pagosDto[0].conCambio = recibioValor
        }
      }

      const res = await api.ventas.crear({
        sucursalId: ctxSucursal.id,
        items: cart.items.map((i) => ({
          productoId: i.producto.id,
          cantidad: i.cantidad,
          comboId: i.comboId,
          ofertaId: i.ofertaId,
        })),
        pagos: pagosDto.length > 0 ? pagosDto : undefined,
        clienteId: (cliente ?? clienteSeleccionado)?.id,
        allowSinStock,
      })
      setResultado(res)
      setUltimosItems([...cart.items])
      cart.clearCart()
      setSelectedMedio(null)
      setRecibio('')
      setClienteSeleccionado(null)
      setShowClientPopup(false)
      setStep('resultado')
    } catch (e: any) { notifyError(e.message) }
  }

  function formatCurrency(n: number): string {
    return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handlePrint = () => window.print()

  function nuevaVenta() {
    setResultado(null)
    setUltimosItems([])
    cart.clearCart()
    setSelectedMedio(null)
    setRecibio('')
    setClienteSeleccionado(null)
    setShowClientPopup(false)
    recibioManuallyEdited.current = false
    setStep('venta')
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  function handleVentaSectionKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
      recibioManuallyEdited.current = false
      if (selectedMedio) {
        setSelectedMedio(null)
        setRecibio(total.toFixed(2))
      }
      searchInputRef.current?.focus()
    }
  }

  // ========== PANTALLA: SELECCIONAR SUCURSAL ==========
  if (step === 'sucursal') {
    return (
      <div className="max-w-md mx-auto mt-8 px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mx-auto">
            <MapPin size={32} strokeWidth={1.5} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Seleccioná tu sucursal</h2>
            <p className="text-sm text-gray-500 mt-1">Esta elección queda guardada para las próximas ventas</p>
          </div>
          <div className="space-y-2">
            {sucursales.map((s) => (
              <button key={s.id} onClick={() => seleccionarSucursal(s)}
                className="w-full text-left px-4 py-3.5 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-medium text-gray-800">{s.nombre}</p>
                  <p className="text-xs text-gray-400">Código: {s.codigo} · #{s.numero}</p>
                </div>
                <ChevronRight size={20} strokeWidth={2} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ========== PANTALLA: RESULTADO (FACTURA) ==========
  if (step === 'resultado' && resultado) {
    const COL = 40
    const fmtPeso = (n: number) => {
      const s = '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      return s.padStart(14)
    }
    const LR = (left: string, right: string) => {
      const avail = COL - left.length
      return left + (avail > 0 ? right.padStart(avail) : ' ' + right)
    }
    const f = (iso: string) => {
      const d = new Date(iso)
      return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    }

    const line  = '─'.repeat(COL)
    const dline = '═'.repeat(COL)
    const totalItems = ultimosItems.reduce((s, i) => s + i.cantidad, 0)

    return (
      <div className="max-w-3xl mx-auto mt-8 px-4">
        <div className="no-print text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full text-lg font-semibold">
            VENTA REGISTRADA
          </div>
        </div>

        <div className="receipt bg-white py-6 px-4 max-w-[80mm] mx-auto font-mono text-[11px] leading-[1.45] text-gray-900"
             style={{ fontFamily: "'Courier New', Courier, monospace" }}>
          <div className="text-center font-bold text-[13px]">{resultado.empresaNombre ?? 'PosWeb'}</div>

          <div className="text-center font-bold text-[12px] mt-2 mb-3">TICKET DE COMPRA</div>

          <div>Fecha: {f(resultado.fecha)}</div>
          <div>Ticket #: {String(resultado.ventaId).padStart(6, '0')}</div>
          <div>Vendedor: {user?.nombre ?? '—'}</div>
          <div className="mb-2">{line}</div>

          {ultimosItems.map((item, i) => {
            const name = item.producto.nombre.length > 26 ? item.producto.nombre.slice(0, 23) + '...' : item.producto.nombre
            return (
              <div key={i}>
                <div>{String(item.cantidad).padStart(2)}   {name}</div>
                <div>{LR(fmtPeso(item.producto.precio) + ' c/u', fmtPeso(item.producto.precio * item.cantidad))}</div>
              </div>
            )
          })}

          <div className="mt-1 mb-1">{line}</div>
          <div>Artículos: {totalItems}</div>
          <div className="mt-2 mb-1">{dline}</div>

          <div className="font-bold text-[15px] py-1">{LR('TOTAL', fmtPeso(resultado.total))}</div>

          <div className="mt-1 mb-2">{dline}</div>

          {resultado.pagos.map((p, i) => (
            <div key={i}>{LR('Pago:', p.medioPagoNombre.toUpperCase())}</div>
          ))}
          {resultado.cambio > 0 && (
            <>
              <div>{LR('Pagó:', fmtPeso(resultado.total + resultado.cambio))}</div>
              <div>{LR('Cambio:', fmtPeso(resultado.cambio))}</div>
            </>
          )}

          <div className="text-center mt-4 font-bold">¡GRACIAS POR SU COMPRA!</div>
          <div className="text-center text-[9px] mt-1">NO VÁLIDO COMO FACTURA</div>
        </div>

        {/* Action buttons - hidden when printing */}
        <div className="no-print flex justify-center gap-3 mt-6 flex-wrap">
          <Button
            ref={imprimirBtnRef}
            variant="secondary"
            size="md"
            onClick={handlePrint}
            onKeyDown={e => {
              if (e.key === 'ArrowRight') {
                e.preventDefault()
                nuevaVentaBtnRef.current?.focus()
              }
            }}
          >
            Imprimir
          </Button>
          <Button
            ref={nuevaVentaBtnRef}
            variant="primary"
            size="md"
            onClick={nuevaVenta}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault()
                imprimirBtnRef.current?.focus()
              }
            }}
          >
            Nueva venta
          </Button>
        </div>
      </div>
    )
  }

  // ========== PANTALLA: VENTA ==========
  const paymentSlot = (
    <>
      {/* Medio de pago */}
      <div>
        <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Medio de pago">
          {mediosPago.map((mp, idx) => {
            const estaSeleccionado = selectedMedio?.id === mp.id
            const iconMap: Record<number, React.ReactNode> = {
              1: <Banknote size={16} strokeWidth={1.75} />,
              2: <ArrowLeftRight size={16} strokeWidth={1.75} />,
              3: <CreditCard size={16} strokeWidth={1.75} />,
              4: <Smartphone size={16} strokeWidth={1.75} />,
              5: <QrCode size={16} strokeWidth={1.75} />,
            }
            const icon = iconMap[mp.id] ?? <Banknote size={16} strokeWidth={1.75} />
            return (
              <button
                key={mp.id}
                ref={(el) => { medioRefs.current[idx] = el }}
                type="button"
                onClick={() => selectMedio(mp)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); confirmBtnRef.current?.focus(); return }
                  if (idx === 0 && e.key === 'Tab' && e.shiftKey) { e.preventDefault(); searchInputRef.current?.focus(); return }
                  handleMedioKeyDown(e, idx)
                }}
                className={[
                  'flex flex-col items-center justify-center gap-[5px] rounded-xl border py-2.5 px-1 transition-all duration-150 select-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(0.52_0.255_278_/_0.30)] focus-visible:ring-offset-1',
                  estaSeleccionado
                    ? 'border-[oklch(0.52_0.255_278)] bg-[oklch(0.52_0.255_278)] text-white shadow-[0_2px_8px_-2px_oklch(0.52_0.255_278_/_0.40)]'
                    : 'border-gray-200 bg-white text-gray-400 hover:border-[oklch(0.52_0.255_278_/_0.35)] hover:bg-[oklch(0.52_0.255_278_/_0.05)] hover:text-[oklch(0.52_0.255_278)]',
                ].join(' ')}
                aria-pressed={estaSeleccionado}
              >
                {icon}
                <span className="text-[9px] font-bold uppercase tracking-wide leading-none">{mp.nombre}</span>
              </button>
            )
          })}
        </div>
      </div>
      <p className="text-[10px] text-gray-400 leading-tight text-center">
        Pagos inferiores al total o vacíos generan deuda. Podés revisarla en la pestaña Deudas.
      </p>
      {(() => {
        const r = parseFloat(recibio || '0')
        if (r < total && total > 0) return <p className="text-xs text-amber-600 text-center font-medium">↗ Queda una deuda de ${(total - r).toFixed(2)}</p>
        if (r >= total && total > 0) return <p className="text-xs text-green-600 text-center font-medium">✓ Deuda saldada</p>
        return null
      })()}
    </>
  )

  return (
    <>
    <CartHost
      cart={cart as any}
      confirmLabel="Confirmar venta"
      onConfirm={confirmarVenta}
      confirmDisabled={!selectedMedio}
      confirmRef={confirmBtnRef}
      cartRef={cartListRef}
      pageShell={{ title: 'Ventas', subtitle: 'Seleccioná productos para confirmar la operación', caja: { loading: cajaLoading, activa: cajaActiva, closedMessage: 'Andá a la sección Caja para abrir una.' } }}
      montoValue={recibio}
      onMontoChange={v => { setRecibio(v); setClienteSeleccionado(null); recibioManuallyEdited.current = true }}
      montoInputRef={recibioInputRef}
      onMontoButtonClick={() => { setRecibio('0'); recibioManuallyEdited.current = false }}
      searchInputRef={searchInputRef}
      confirmOverride={!cajaActiva ? (
        <div className="w-full py-3 bg-gray-300 text-gray-500 font-semibold rounded-xl text-sm text-center">Sin caja abierta</div>
      ) : undefined}
      headerExtra={clienteSeleccionado ? (
        <div className="flex items-center text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg">
          <span className="font-medium">Cliente: {clienteSeleccionado.nombre}</span>
          <button onClick={() => setClienteSeleccionado(null)} className="text-indigo-400 hover:text-indigo-600 ml-2">✕</button>
        </div>
      ) : undefined}
      paymentSlot={paymentSlot}
      getItemProps={(i) => {
        const itemId = i.comboId ?? i.producto.id
        const tieneOferta = i.ofertaId && i.precioOriginal
        return {
          nombre: i.producto.nombre,
          codigo: formatCodigoBarra(i.producto, unidadesMap),
          precioUnitario: tieneOferta
            ? `$${i.producto.precio.toFixed(2)} c/u  (${i.descuentoAplicado}% OFF)`
            : `$${i.producto.precio.toFixed(2)} c/u`,
          subtotal: `$${(i.producto.precio * i.cantidad).toFixed(2)}`,
          cantidad: i.cantidad,
        onCantidadChange: (c: number) => { setCantidadDrafts((prev) => { const next = { ...prev }; delete next[itemId]; return next }); handleCambiarCantidad(itemId, c, i.comboId) },
        onEnter: () => searchInputRef.current?.focus(),
        onFocusQty: () => onFocusQty(itemId, i.cantidad),
        onEscape: () => onEscape(
          itemId,
          i.cantidad,
          (qty) => handleCambiarCantidad(itemId, qty, i.comboId),
          () => quitarItem(itemId, i.comboId)
        ),
          inputRef: (el: HTMLInputElement | null) => {
            if (el) cantidadRefs.current.set(itemId, el); else cantidadRefs.current.delete(itemId)
          },
        stockWarning: i.cantidad > i.producto.stock ? `Stock insuficiente: ${i.producto.stock} disponible${i.producto.stock !== 1 ? 's' : ''}` : undefined,
        badge: (
          <>
            {i.comboId && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold mr-1">COMBO</span>}
            {i.ofertaId && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold mr-1">{i.descuentoAplicado}% OFF</span>}
          </>
        ),
        details: i.comboId ? (() => {
          const combo = combos.find(c => c.id === i.comboId)
          if (combo?.items.length) {
            return (
              <div className="mt-1 space-y-0.5">
                {combo.items.map((item, j) => (
                  <div key={j} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="w-1 h-1 rounded-full bg-purple-300 shrink-0" />
                    <span className="truncate">{item.productoNombre ?? `x${item.productoId}`}</span>
                    <span className="text-gray-300">x{item.cantidad}</span>
                  </div>
                ))}
              </div>
            )
          }
          return undefined
        })() : undefined,
        onRemove: () => quitarItem(i.producto.id, i.comboId),
        removeButton: i.comboId ? (
        <div className="relative">
            <button type="button"
              aria-haspopup="menu"
              aria-expanded={comboUndoPopup === i.comboId}
              onClick={(e) => {
                const isOpen = comboUndoPopup === i.comboId
                isOpen ? closeComboMenu() : openComboMenu(i.comboId!, e.currentTarget)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  const isOpen = comboUndoPopup === i.comboId
                  isOpen ? closeComboMenu() : openComboMenu(i.comboId!, e.currentTarget)
                }
              }}
              className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
              <X size={16} />
            </button>
            {comboUndoPopup === i.comboId && (
              <>
                <div className="fixed inset-0 z-30"
                  onClick={closeComboMenu}
                  onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeComboMenu() }}} />
                <div role="menu" aria-label="Acciones del combo"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeComboMenu(); return }
                    const items = e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
                    const idx = Array.from(items).indexOf(document.activeElement as HTMLButtonElement)
                    if (e.key === 'ArrowDown') { e.preventDefault(); items[(idx + 1) % items.length]?.focus(); return }
                    if (e.key === 'ArrowUp') { e.preventDefault(); items[(idx - 1 + items.length) % items.length]?.focus(); return }
                  }}
                  className="absolute right-0 top-full mt-1 z-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[200px]">
                  <button autoFocus role="menuitem" tabIndex={-1}
                    onClick={() => { deshacerCombo(i.comboId!); closeComboMenu() }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); deshacerCombo(i.comboId!); closeComboMenu() }}}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-purple-50 text-purple-700 font-medium focus:bg-purple-50 focus:outline-none">
                    <Undo2 size={16} className="shrink-0" />
                    Deshacer combo
                  </button>
                  <div className="border-t border-gray-100 mx-2" />
                  <button role="menuitem" tabIndex={-1}
                    onClick={() => { quitarItem(i.producto.id, i.comboId); closeComboMenu() }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); quitarItem(i.producto.id, i.comboId); closeComboMenu() }}}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600 focus:bg-red-50 focus:outline-none">
                    <Trash2 size={16} className="shrink-0" />
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        ) : undefined
      }}}
      getItemKey={(i) => i.comboId ? `combo-${i.comboId}` : i.producto.id}
      topContent={
        <div className="relative">
          <Search size={20} strokeWidth={2} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input ref={searchInputRef} id="search-producto"
            autoComplete="off"
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-10 text-[13.5px] text-gray-900 placeholder:text-gray-400 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)]"
            placeholder="Buscá producto por código de barra o nombre…" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Escape') { if (searchQuery) { e.preventDefault(); setSearchQuery(''); searchInputRef.current?.focus() } return }
              if (e.key === 'Tab' && !e.shiftKey && cart.items.length > 0) { e.preventDefault(); medioRefs.current[0]?.focus() }
              if (e.key === 'ArrowDown' || e.key === 'Enter') {
                e.preventDefault()
                const q = searchQuery.trim().toUpperCase()
                if (e.key === 'Enter' && q) { const combo = combos.find(c => c.codCombo === q); if (combo) { agregarCombo(combo); setSearchQuery(''); return }; setSearchQuery('') }
                if (e.key === 'Enter' && !q && cart.items.length > 0) { medioRefs.current[0]?.focus(); return }
                setTimeout(() => { productGridRef.current?.querySelector<HTMLButtonElement>('button')?.focus() }, 0)
              }
            }}
            autoFocus />
          {searchQuery && (
            <button type="button" onClick={() => { setSearchQuery(''); searchInputRef.current?.focus() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      }
    >
      {/* Product Grid */}
      <div className="flex-1 min-h-0">
        <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-full overflow-y-auto p-4">
            <KeyboardHints showEnter={cart.items.length > 0} />
            {productosLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-gray-500 text-sm">Cargando productos…</span>
              </div>
            ) : filteredProductos.length === 0 && filteredCombos.length === 0 && searchQuery.trim() ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <PackageSearch size={24} strokeWidth={1.5} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-sm">Sin resultados para esta búsqueda</p>
              </div>
            ) : filteredProductos.length === 0 && filteredCombos.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <PackageSearch size={24} strokeWidth={1.5} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium text-sm">No hay productos disponibles</p>
              </div>
            ) : (
              <div ref={productGridRef}
                className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                onKeyDown={(e) => {
                  const buttons = Array.from(productGridRef.current?.querySelectorAll('button') ?? [])
                  const currentIdx = buttons.indexOf(e.target as HTMLButtonElement)
                  if (currentIdx === -1) return
                  const gridEl = productGridRef.current
                  if (!gridEl) return
                  let cols = 2
                  try { cols = getComputedStyle(gridEl).gridTemplateColumns.split(' ').length } catch {}
                  if (e.key === 'ArrowRight') { e.preventDefault(); const next = Math.min(currentIdx + 1, buttons.length - 1); if (next !== currentIdx) buttons[next]?.focus() }
                  else if (e.key === 'ArrowLeft') { e.preventDefault(); if (currentIdx > 0) buttons[currentIdx - 1]?.focus() }
                  else if (e.key === 'ArrowDown') { e.preventDefault(); const next = Math.min(currentIdx + cols, buttons.length - 1); if (next !== currentIdx) buttons[next]?.focus() }
                  else if (e.key === 'ArrowUp') { e.preventDefault(); if (currentIdx - cols < 0) { searchInputRef.current?.focus() } else { buttons[currentIdx - cols]?.focus() } }
                  else if (e.key === 'Escape') { e.preventDefault(); searchInputRef.current?.focus() }
                  else if (e.key === 'Tab' && !e.shiftKey && cart.items.length > 0) { e.preventDefault(); medioRefs.current[0]?.focus() }
                  else if (e.key === 'Tab' && e.shiftKey && currentIdx === 0) { e.preventDefault(); searchInputRef.current?.focus() }
                }}>
                {filteredProductos.map((p) => (
                  <ProductCard key={p.id} producto={p} unidadesMap={unidadesMap} onClick={() => agregarProducto(p)}
                    price={<span className="text-[16px] font-bold">${p.precio.toFixed(2)}</span>} />
                ))}
                {filteredCombos.map((c) => (
                  <button key={`combo-${c.id}`} onClick={() => agregarCombo(c)}
                    className="group relative flex flex-col text-left w-full bg-white rounded-xl border border-purple-200 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.11),0_2px_6px_-2px_rgba(0,0,0,0.06)] active:scale-[0.972] active:shadow-[0_1px_3px_0_rgba(0,0,0,0.07)] active:translate-y-0 active:duration-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30 focus-visible:ring-offset-2 shadow-[0_1px_3px_0_rgba(0,0,0,0.07),0_1px_2px_-1px_rgba(0,0,0,0.05)]">
                    <span className="absolute top-2.5 right-2.5 z-10 flex items-center gap-0.5 rounded-md bg-[oklch(0.52_0.255_278_/_0.10)] px-1.5 py-[3px] text-[9px] font-bold uppercase tracking-widest text-[oklch(0.52_0.255_278)] leading-none border border-[oklch(0.52_0.255_278_/_0.15)]">
                      <Sparkles size={7} strokeWidth={3} />
                      COMBO
                    </span>
                    <div className="flex flex-1 flex-col gap-0 p-3.5 pb-3 pr-14">
                      <p className="text-[13px] font-semibold text-gray-900 leading-snug line-clamp-2 min-h-[2.6em]">{c.descCombo}</p>
                      <p className="mt-1.5 font-mono text-[9.5px] text-gray-400/50 tracking-[0.08em] truncate">{c.codCombo}</p>
                    </div>
                    <div className="flex items-center justify-between px-3.5 py-2.5 mt-auto rounded-b-xl border-t border-purple-100 bg-purple-50/30 group-hover:bg-purple-100/40 transition-colors duration-150">
                      <span className="text-[15px] font-bold text-purple-700 leading-none tabular-nums">${c.precio.toFixed(2)}</span>
                      <span className="flex h-[26px] w-[26px] items-center justify-center rounded-lg bg-purple-200 text-purple-500 group-hover:bg-purple-600 group-hover:text-white group-hover:shadow-sm group-hover:shadow-purple-500/25 transition-all duration-150" aria-hidden="true">
                        <Plus size={12} strokeWidth={2.75} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CartHost>

      {/* Stock confirmation dialog */}
      <Dialog
        open={showStockConfirm}
        onClose={() => {
          setShowStockConfirm(false)
          setStockConflictItems([])
        }}
        title="Stock insuficiente"
        description="Estos productos no tienen stock suficiente:"
        footer={
          <>
            <Button
              ref={stockCancelarRef}
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowStockConfirm(false)
                setStockConflictItems([])
                const first = stockConflictItems[0]
                if (first) {
                  const input = cantidadRefs.current.get(first.producto.id)
                  if (input) {
                    cartListRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
                    input.focus()
                    input.select()
                  }
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowStockConfirm(false)
                setStockConflictItems([])
                pendingAllowSinStock.current = true
                continuarVenta()
              }}
            >
              Continuar
            </Button>
          </>
        }
      >
        <div className="bg-red-50 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
          {stockConflictItems.map(i => (
            <div key={i.producto.id} className="flex justify-between text-sm">
              <span className="text-gray-700 font-medium truncate mr-2">{i.producto.nombre}</span>
              <span className="text-gray-500 shrink-0">disp: {i.producto.stock} · pedido: {i.cantidad}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-4">¿Vender igual sin stock?</p>
      </Dialog>

      {/* Client popup */}
      <Dialog
        open={showClientPopup}
        onClose={() => { setShowClientPopup(false); setClientesBusqueda(''); setClientesResultados([]) }}
        title="Cobro pendiente"
        description="El pago recibido no cubre el total. Seleccioná un cliente para registrar la deuda."
      >
        {/* Debt summary */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Total</span>
            <span className="font-semibold text-gray-900">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Pagado</span>
            <span className="font-semibold text-emerald-600">${(parseFloat(recibio) || 0).toFixed(2)}</span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between">
            <span className="text-gray-500">Pendiente</span>
            <span className="font-semibold text-red-600">${(total - (parseFloat(recibio) || 0)).toFixed(2)}</span>
          </div>
        </div>
        {/* Search */}
        <input
          autoFocus
          type="text"
          placeholder="Buscá por nombre o teléfono..."
          value={clientesBusqueda}
          onChange={e => setClientesBusqueda(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && clientesResultados.length > 0) {
              e.preventDefault()
              clientesResultsRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
            }
          }}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)] outline-none mb-3"
        />

        {/* Loading */}
        {buscandoClientes && (
          <div className="space-y-2 py-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-gray-200 rounded w-3/5" />
                  <div className="h-2.5 bg-gray-100 rounded w-2/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results header */}
        {!buscandoClientes && clientesResultados.length > 0 && (
          <p className="text-xs text-gray-400 mb-1 px-1">
            {clientesResultados.length} resultado{clientesResultados.length !== 1 ? 's' : ''}
          </p>
        )}

        {/* Results */}
        {!buscandoClientes && clientesResultados.length === 0 && clientesBusqueda.trim().length >= 1 && (
          <p className="text-sm text-gray-400 text-center py-8">
            No se encontraron clientes con ese nombre
          </p>
        )}
        <div ref={clientesResultsRef} className="flex-1 overflow-y-auto space-y-1 min-h-0"
          onKeyDown={(e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
            const buttons = e.currentTarget.querySelectorAll<HTMLButtonElement>('button')
            if (buttons.length < 2) return
            const idx = Array.from(buttons).indexOf(document.activeElement as HTMLButtonElement)
            if (idx < 0) { buttons[0]?.focus(); return }
            e.preventDefault()
            const next = e.key === 'ArrowDown' ? Math.min(idx + 1, buttons.length - 1) : Math.max(idx - 1, 0)
            buttons[next]?.focus()
          }}
        >
          {clientesResultados.map(cl => (
            <button
              key={cl.id}
              onClick={() => {
                setClienteSeleccionado(cl)
                setShowClientPopup(false)
                setClientesBusqueda('')
                setClientesResultados([])
                ejecutarVenta(parseFloat(recibio) || 0, pendingAllowSinStock.current, cl)
                pendingAllowSinStock.current = false
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-3"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 ${
                ['bg-indigo-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-sky-500','bg-violet-500','bg-teal-500','bg-orange-500'][(cl.id ?? 0) % 8]
              }`}>
                {cl.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{cl.nombre}</p>
                <p className="text-xs text-gray-400 truncate">
                  {cl.tipoDocumento} {cl.numeroDocumento}
                  {cl.codCliente && ` · #${cl.codCliente}`}
                  {cl.telefono && ` · ${cl.telefono}`}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Nuevo cliente */}
        <button onClick={() => { setShowNuevoCliente(true); setShowClientPopup(false); setEsOcasional(true) }} className="mt-3 w-full py-2 text-sm font-semibold text-[oklch(0.52_0.255_278)] border border-dashed border-[oklch(0.52_0.255_278_/_0.30)] rounded-lg hover:bg-[oklch(0.52_0.255_278_/_0.05)] transition-colors">
          + Nuevo cliente
        </button>
      </Dialog>

      {/* Nuevo cliente form */}
      <Dialog
        open={showNuevoCliente}
        onClose={() => { setShowNuevoCliente(false); setNuevoClienteNombre(''); setEsOcasional(true) }}
        title="Nuevo cliente"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => { setShowNuevoCliente(false); setNuevoClienteNombre(''); setEsOcasional(true) }}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={crearClienteYRevertir}
              disabled={nuevoClienteNombre.trim().length < 2}
            >
              Crear y seleccionar
            </Button>
          </>
        }
      >
        {/* Nombre */}
        <input
          autoFocus
          type="text"
          placeholder="Nombre del cliente"
          value={nuevoClienteNombre}
          onChange={e => setNuevoClienteNombre(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && nuevoClienteNombre.trim().length >= 2) {
              e.preventDefault()
              crearClienteYRevertir()
            }
          }}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)] outline-none mb-1"
        />
        {nuevoClienteNombre.trim().length < 2 && nuevoClienteNombre.length > 0 && (
          <p className="text-xs text-red-500 mb-2">Al menos 2 caracteres</p>
        )}

        {/* Ocasional checkbox */}
        <label className="flex items-center gap-2 cursor-pointer mt-2 mb-3">
          <input
            type="checkbox"
            checked={esOcasional}
            onChange={e => setEsOcasional(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[oklch(0.52_0.255_278)] focus:ring-[oklch(0.52_0.255_278_/_0.30)]"
          />
          <span className="text-sm text-gray-700">Cliente ocasional (solo nombre, sin DNI)</span>
        </label>

        {/* Full form when ocasional is OFF */}
        {!esOcasional && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tipo documento</label>
                <select
                  value={formCliente.tipoDocumento}
                  onChange={e => setFormCliente({ ...formCliente, tipoDocumento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                >
                  <option value="DNI">DNI</option>
                  <option value="CUIT">CUIT</option>
                  <option value="CUIL">CUIL</option>
                  <option value="ConsumidorFinal">Consumidor Final</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">N° documento</label>
                <input
                  type="text"
                  value={formCliente.numeroDocumento}
                  onChange={e => setFormCliente({ ...formCliente, numeroDocumento: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  disabled={formCliente.tipoDocumento === 'ConsumidorFinal'}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Condición IVA</label>
              <select
                value={formCliente.ivaCondicion}
                onChange={e => setFormCliente({ ...formCliente, ivaCondicion: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
              >
                <option value="ResponsableInscripto">Responsable Inscripto</option>
                <option value="Monotributo">Monotributo</option>
                <option value="Exento">Exento</option>
                <option value="ConsumidorFinal">Consumidor Final</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formCliente.telefono}
                  onChange={e => setFormCliente({ ...formCliente, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Domicilio</label>
                <input
                  type="text"
                  value={formCliente.domicilio}
                  onChange={e => setFormCliente({ ...formCliente, domicilio: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </>
  )
}
