import { useState, useEffect, useMemo, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import { useCart } from '../hooks/useCart'
import CartHost from '../components/hosts/CartHost'

interface Item {
  producto: ProductoDto
  cantidad: number
  comboId?: number
  comboNombre?: string
  comboPrecio?: number
}

type Step = 'sucursal' | 'venta' | 'resultado'

export default function VentasPage() {
  const { sucursal: ctxSucursal } = useOutletContext<{ sucursal: SucursalDto | null }>()
  const [step, setStep] = useState<Step>(
    ctxSucursal ? 'venta' : 'sucursal'
  )

  const [sucursales, setSucursales] = useState<SucursalDto[]>([])
  const [ultimosItems, setUltimosItems] = useState<Item[]>([])
  const [resultado, setResultado] = useState<VentaResultadoDto | null>(null)
  const { notifyError } = useNotification()
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
  const [showDebtConfirm, setShowDebtConfirm] = useState(false)
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
  const [productosLoading, setProductosLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const searchInputRef = useRef<HTMLInputElement>(null!)
  const productGridRef = useRef<HTMLDivElement>(null!)
  const cartListRef = useRef<HTMLDivElement>(null!)
  const cantidadRefs = useRef<Map<number, HTMLInputElement>>(new Map())
  const stockAceptarRef = useRef<HTMLButtonElement>(null!)
  const [cantidadDrafts, setCantidadDrafts] = useState<Record<number, string>>({})
  const [verified, setVerified] = useState(false)
  const [comboUndoPopup, setComboUndoPopup] = useState<number | null>(null)
  const pendingAllowSinStock = useRef(false)

  const unidadesMap = useMemo(() => {
    const m = new Map<number, string>()
    for (const u of unidades) m.set(u.id, u.codigo)
    return m
  }, [unidades])

  // Sincronizar Recibió con el total
  useEffect(() => {
    setRecibio(total.toFixed(2))
  }, [total])

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
    if (!searchQuery.trim()) return combos
    const q = searchQuery.toLowerCase()
    return combos.filter(c =>
      c.descCombo.toLowerCase().includes(q) ||
      c.codCombo.toLowerCase().includes(q)
    )
  }, [combos, searchQuery])

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

    const match = combos.find(combo => {
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

  // Focus "Aceptar" cuando se abre el cartel de stock insuficiente
  useEffect(() => {
    if (showStockConfirm) {
      setTimeout(() => stockAceptarRef.current?.focus(), 50)
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
    } catch (e: any) { notifyError(e.message) }
  }

  function seleccionarSucursal(s: SucursalDto) {
    localStorage.setItem('sucursalActiva', JSON.stringify(s))
    setStep('venta')
    window.location.reload()
  }

  function agregarProducto(producto: ProductoDto) {
    cart.addItem({ producto, cantidad: 1 })
    setSearchQuery('')
    // Limpiar draft para que muestre el valor real del state
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
    cart.addItem({
      producto: { id: 0, codigoBarra: combo.codCombo, nombre: combo.descCombo, precio: combo.precio, costo: 0, stock: 999, activo: true },
      cantidad: 1,
      comboId: combo.id,
      comboNombre: combo.descCombo,
      comboPrecio: combo.precio,
    } as Item)
    setSearchQuery('')
  }

  function handleCambiarCantidad(productoId: number, cantidad: number, comboId?: number) {
    if (cantidad <= 0) {
      cart.removeItem(productoId)
    } else {
      cart.updateQuantity(productoId, cantidad)
    }
  }

  function quitarItem(productoId: number, comboId?: number) {
    cart.removeItem(productoId)
  }

  function deshacerCombo(comboId: number) {
    const combo = combos.find(c => c.id === comboId)
    if (!combo) return
    setDismissedCombos(prev => new Set(prev).add(comboId))
    cart.setItems(prev => {
      const sinCombo = prev.filter(i => i.comboId !== comboId)
      const individuales = combo.items.map(ci => ({
        producto: { id: ci.productoId, codigoBarra: '', nombre: ci.productoNombre ?? `Producto #${ci.productoId}`, precio: 0, costo: 0, stock: 999, activo: true },
        cantidad: ci.cantidad,
      })) as Item[]
      return [...sinCombo, ...individuales]
    })
    // Fetch real product data so prices/names appear correctly
    combo.items.forEach(ci => {
      if (!ci.productoId) return
      api.productos.detalle(ci.productoId).then((p) => {
        if (!p) return
        cart.setItems(prev => prev.map(item =>
          item.producto.id === p.id && !item.comboId
            ? { ...item, producto: { ...item.producto, id: p.id, codigoBarra: p.codigoBarra, nombre: p.nombre, precio: p.precio, costo: p.costo, stock: p.stock, activo: p.activo } }
            : item
        ))
      }).catch(() => {})
    })
  }

  // --- Payment ---
  function selectMedio(mp: MedioPagoDto) {
    setSelectedMedio(mp)
    setTimeout(() => {
      if (mp.pagaVuelto) {
        recibioInputRef.current?.focus()
      } else {
        confirmBtnRef.current?.focus()
      }
    }, 0)
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
      setTimeout(() => {
        if (mediosPago[idx].pagaVuelto) {
          recibioInputRef.current?.focus()
        } else {
          confirmBtnRef.current?.focus()
        }
      }, 0)
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
      setShowDebtConfirm(true)
      return
    }

    await ejecutarVenta(recibioValor, pendingAllowSinStock.current)
    pendingAllowSinStock.current = false
  }

  function continuarVenta() {
    const recibioValor = parseFloat(recibio) || 0
    if (selectedMedio && recibioValor < total && !clienteSeleccionado) {
      setShowDebtConfirm(true)
      return
    }
    ejecutarVenta(recibioValor, pendingAllowSinStock.current)
    pendingAllowSinStock.current = false
  }

  async function ejecutarVenta(recibioValor: number, allowSinStock = false) {
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
        })),
        pagos: pagosDto.length > 0 ? pagosDto : undefined,
        clienteId: clienteSeleccionado?.id,
        allowSinStock,
      })
      setResultado(res)
      setUltimosItems([...cart.items])
      cart.clearCart()
      setSelectedMedio(null)
      setRecibio('')
      setClienteSeleccionado(null)
      setShowClientPopup(false)
      setShowDebtConfirm(false)
      setStep('resultado')
    } catch (e: any) { notifyError(e.message) }
  }

  function formatCurrency(n: number): string {
    return '$' + n.toFixed(2)
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
    setShowDebtConfirm(false)
    setVerified(false)
    setStep('venta')
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  function handleVentaSectionKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault()
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
            <svg className="w-8 h-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
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
                <svg className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ========== PANTALLA: RESULTADO (FACTURA) ==========
  if (step === 'resultado' && resultado) {
    const formatFecha = (f: string) => new Date(f).toLocaleString('es-AR')
    return (
      <div className="max-w-3xl mx-auto mt-8 px-4">
        {/* Success badge - hidden when printing */}
        <div className="no-print text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-6 py-3 rounded-full text-lg font-semibold">
            VENTA REGISTRADA
          </div>
        </div>

        {/* Receipt / Factura */}
        <div className="receipt bg-white border border-gray-300 rounded-xl p-6 max-w-[80mm] mx-auto">
          <h1 className="text-center text-base font-bold mb-3">{resultado.empresaNombre ?? 'PosWeb'}</h1>

          <div className="text-xs mb-3 space-y-0.5">
            <p><span className="font-semibold">Comprobante:</span> Venta #{resultado.ventaId}</p>
            <p><span className="font-semibold">Fecha:</span> {formatFecha(resultado.fecha)}</p>
            {resultado.cajaId != null && <p><span className="font-semibold">Caja N°:</span> {resultado.cajaId}</p>}
          </div>

          {/* Items table */}
          <table className="w-full border-collapse text-xs mb-3">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="text-left pb-1 pr-1">Producto</th>
                <th className="text-right pb-1 pr-1">Cant</th>
                <th className="text-right pb-1 pr-1">Precio</th>
                <th className="text-right pb-1">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {ultimosItems.map((item, i) => (
                <tr key={i}>
                  <td className="py-0.5 pr-1">{item.producto.nombre}</td>
                  <td className="text-right py-0.5 pr-1">{item.cantidad}</td>
                  <td className="text-right py-0.5 pr-1">{formatCurrency(item.producto.precio)}</td>
                  <td className="text-right py-0.5">{formatCurrency(item.producto.precio * item.cantidad)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-400 font-bold">
                <td colSpan={3} className="text-right pt-1 pr-1">Total:</td>
                <td className="text-right pt-1">{formatCurrency(resultado.total)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Payments breakdown */}
          <div className="border-t border-gray-300 pt-2 text-xs space-y-0.5">
            {resultado.pagos.map((p, i) => (
              <div key={i} className="flex justify-between">
                <span>{p.medioPagoNombre}</span>
                <span>{formatCurrency(p.monto)}</span>
              </div>
            ))}
            {resultado.cambio > 0 && (
              <div className="flex justify-between text-green-700 font-semibold pt-1 border-t border-gray-200">
                <span>Vuelto</span>
                <span>{formatCurrency(resultado.cambio)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons - hidden when printing */}
        <div className="no-print flex justify-center gap-3 mt-6 flex-wrap">
          <button
            ref={imprimirBtnRef}
            onClick={handlePrint}
            onKeyDown={e => {
              if (e.key === 'ArrowRight') {
                e.preventDefault()
                nuevaVentaBtnRef.current?.focus()
              }
            }}
            className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
          >
            Imprimir
          </button>
          <button
            ref={nuevaVentaBtnRef}
            onClick={nuevaVenta}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'ArrowLeft') {
                e.preventDefault()
                imprimirBtnRef.current?.focus()
              }
            }}
            className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Nueva venta
          </button>
        </div>
      </div>
    )
  }

  // ========== PANTALLA: VENTA ==========
  const paymentSlot = (
    <>
      {/* Medio de pago */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Medio de pago</label>
        <div className="flex items-center gap-1 flex-wrap">
          {mediosPago.map((mp, idx) => {
            const estaSeleccionado = selectedMedio?.id === mp.id
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
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium border transition-all focus:ring-2 focus:ring-indigo-500/30 focus:outline-none ${estaSeleccionado ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400/30 text-indigo-700 shadow-sm' : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-gray-600'}`}
              >
                {estaSeleccionado && (
                  <svg className="w-3 h-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
                {mp.nombre}
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
      title={cart.items.length > 0 ? `Productos (${cart.items.length})` : 'Nueva venta'}
      confirmLabel="Confirmar venta"
      onConfirm={confirmarVenta}
      confirmDisabled={!selectedMedio || !verified}
      confirmRef={confirmBtnRef}
      cartRef={cartListRef}
      pageShell={{ title: 'Ventas', subtitle: 'Seleccione productos para confirmar la operación', caja: { loading: cajaLoading, activa: cajaActiva, closedMessage: 'Andá a la sección Caja para abrir una.' } }}
      showVerify
      verified={verified}
      onVerifiedChange={setVerified}
      verifyLabel="Verifiqué productos y medios de pago"
      montoValue={recibio}
      onMontoChange={v => { setRecibio(v); setClienteSeleccionado(null) }}
      montoInputRef={recibioInputRef}
      montoButtonLabel="Sin pago"
      onMontoButtonClick={() => setRecibio('0')}
      confirmOverride={!cajaActiva ? (
        <div className="w-full py-3 bg-gray-300 text-gray-500 font-semibold rounded-xl text-sm text-center">Sin caja abierta</div>
      ) : undefined}
      headerExtra={clienteSeleccionado ? (
        <div className="flex items-center justify-between text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg">
          <span className="font-medium">Cliente: {clienteSeleccionado.nombre}</span>
          <button onClick={() => setClienteSeleccionado(null)} className="text-indigo-400 hover:text-indigo-600 ml-2">✕</button>
        </div>
      ) : undefined}
      paymentSlot={paymentSlot}
      getItemProps={(i) => ({
        nombre: i.producto.nombre + (i.producto.unidadMedidaId != null && unidadesMap.has(i.producto.unidadMedidaId) ? ` (${unidadesMap.get(i.producto.unidadMedidaId)})` : ''),
        codigo: i.producto.codigoBarra,
        precioUnitario: `$${i.producto.precio.toFixed(2)} c/u`,
        subtotal: `$${(i.producto.precio * i.cantidad).toFixed(2)}`,
        cantidad: i.cantidad,
        onCantidadChange: (c: number) => { setCantidadDrafts((prev) => { const next = { ...prev }; delete next[i.producto.id]; return next }); handleCambiarCantidad(i.producto.id, c, i.comboId) },
        onEnter: () => searchInputRef.current?.focus(),
        inputRef: (el: HTMLInputElement | null) => { if (el) cantidadRefs.current.set(i.producto.id, el); else cantidadRefs.current.delete(i.producto.id) },
        stockWarning: i.cantidad > i.producto.stock ? `Stock insuficiente: ${i.producto.stock} disponible${i.producto.stock !== 1 ? 's' : ''}` : undefined,
        badge: i.comboId ? <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold mr-1">COMBO</span> : undefined,
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
            <button type="button" onClick={() => setComboUndoPopup(comboUndoPopup === i.comboId ? null : i.comboId!)}
              className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
            {comboUndoPopup === i.comboId && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setComboUndoPopup(null)} />
                <div className="absolute right-0 top-full mt-1 z-40 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[200px]">
                  <button onClick={() => { deshacerCombo(i.comboId!); setComboUndoPopup(null) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-purple-50 text-purple-700 font-medium">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></svg>
                    Deshacer combo
                  </button>
                  <div className="border-t border-gray-100 mx-2" />
                  <button onClick={() => { quitarItem(i.producto.id, i.comboId); setComboUndoPopup(null) }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    Eliminar
                  </button>
                </div>
              </>
            )}
          </div>
        ) : undefined,
      })}
      getItemKey={(i) => i.comboId ? `combo-${i.comboId}` : i.producto.id}
    >
      {/* Search bar */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input ref={searchInputRef} id="search-producto"
          className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl shadow-sm text-base placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
          placeholder="Buscá producto por código de barra o nombre…" value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === 'Tab' && !e.shiftKey && cart.items.length > 0) { e.preventDefault(); medioRefs.current[0]?.focus() }
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
              e.preventDefault()
              const q = searchQuery.trim().toUpperCase()
              if (e.key === 'Enter' && q) {
                const combo = combos.find(c => c.codCombo === q)
                if (combo) { agregarCombo(combo); setSearchQuery(''); return }
                setSearchQuery('')
              }
              if (e.key === 'Enter' && !q && cart.items.length > 0) { medioRefs.current[0]?.focus(); return }
              setTimeout(() => { productGridRef.current?.querySelector<HTMLButtonElement>('button')?.focus() }, 0)
            }
          }}
          autoFocus />
        {searchQuery && (
          <button type="button" onClick={() => { setSearchQuery(''); searchInputRef.current?.focus() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Keyboard hints */}
      {filteredProductos.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-mono border border-gray-200 shadow-[0_1px_0_0_#e5e7eb]">←</kbd>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-mono border border-gray-200 shadow-[0_1px_0_0_#e5e7eb]">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-mono border border-gray-200 shadow-[0_1px_0_0_#e5e7eb]">→</kbd>
            <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-mono border border-gray-200 shadow-[0_1px_0_0_#e5e7eb]">↓</kbd>
            <span>Productos</span>
          </span>
          {cart.items.length > 0 && (
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-mono border border-gray-200 shadow-[0_1px_0_0_#e5e7eb]">Enter</kbd>
              <span>Medios de pago</span>
            </span>
          )}
        </div>
      )}

      {/* Product Grid */}
      <div className="flex-1 min-h-0">
        <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-full overflow-y-auto p-4">
            {productosLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="ml-3 text-gray-500 text-sm">Cargando productos…</span>
              </div>
            ) : filteredProductos.length === 0 && filteredCombos.length === 0 && searchQuery.trim() ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
                </div>
                <p className="text-gray-500 font-medium text-sm">Sin resultados para esta búsqueda</p>
              </div>
            ) : filteredProductos.length === 0 && filteredCombos.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
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
                  else if (e.key === 'Tab' && !e.shiftKey && cart.items.length > 0) { e.preventDefault(); medioRefs.current[0]?.focus() }
                  else if (e.key === 'Tab' && e.shiftKey && currentIdx === 0) { e.preventDefault(); searchInputRef.current?.focus() }
                }}>
                {filteredProductos.map((p) => (
                  <button key={p.id} onClick={() => agregarProducto(p)}
                    className="text-left bg-white border border-gray-200 rounded-xl p-3 hover:border-indigo-300 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
                    <p className="font-medium text-gray-900 text-sm truncate">{p.nombre}</p>
                    <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{p.codigoBarra}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold text-indigo-700">${p.precio.toFixed(2)}</span>
                    </div>
                  </button>
                ))}
                {filteredCombos.map((c) => (
                  <button key={`combo-${c.id}`} onClick={() => agregarCombo(c)}
                    className="text-left bg-white border border-purple-200 rounded-xl p-3 hover:border-purple-400 hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/30">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-bold bg-purple-500 text-white px-1.5 py-0.5 rounded">COMBO</span>
                    </div>
                    <p className="font-medium text-gray-900 text-sm truncate">{c.descCombo}</p>
                    <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{c.codCombo}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold text-purple-700">${c.precio.toFixed(2)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </CartHost>

    {/* Debt confirmation dialog */}
    {showDebtConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDebtConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Pago insuficiente</h3>
            <p className="text-sm text-gray-600 mb-3">No se recibió el total del pago.</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm mb-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-semibold text-gray-900">${total.toFixed(2)}</span>
              </div>
              {(parseFloat(recibio) || 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Pagado</span>
                  <span className="font-semibold text-emerald-600">${(parseFloat(recibio) || 0).toFixed(2)}</span>
                </div>
              )}
              <hr className="border-gray-200" />
              <div className="flex justify-between">
                <span className="text-gray-500">Pendiente</span>
                <span className="font-semibold text-red-600">${(total - (parseFloat(recibio) || 0)).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">¿Desea continuar y registrar la diferencia como deuda?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDebtConfirm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg focus:ring-2 focus:ring-gray-400/30 focus:outline-none">
                Cancelar
              </button>
              <button onClick={() => { setShowDebtConfirm(false); setShowClientPopup(true) }} className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500/40 focus:outline-none">
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock confirmation dialog */}
      {showStockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => {
              if (e.key === 'Tab') {
                e.preventDefault()
                if (e.shiftKey) {
                  if (document.activeElement === stockAceptarRef.current) {
                    document.querySelector<HTMLButtonElement>('[data-stock-rechazar]')?.focus()
                  } else {
                    stockAceptarRef.current?.focus()
                  }
                } else {
                  if (document.activeElement === document.querySelector<HTMLButtonElement>('[data-stock-rechazar]')) {
                    stockAceptarRef.current?.focus()
                  } else {
                    document.querySelector<HTMLButtonElement>('[data-stock-rechazar]')?.focus()
                  }
                }
              } else if (e.key === 'ArrowLeft') {
                if (document.activeElement === stockAceptarRef.current) {
                  document.querySelector<HTMLButtonElement>('[data-stock-rechazar]')?.focus()
                }
              } else if (e.key === 'ArrowRight') {
                const btn = document.querySelector<HTMLButtonElement>('[data-stock-rechazar]')
                if (document.activeElement === btn) stockAceptarRef.current?.focus()
              }
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Stock insuficiente</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">Estos productos no tienen stock suficiente:</p>
            <div className="bg-red-50 rounded-xl p-3 space-y-2 mb-4 max-h-40 overflow-y-auto">
              {stockConflictItems.map(i => (
                <div key={i.producto.id} className="flex justify-between text-sm">
                  <span className="text-gray-700 font-medium truncate mr-2">{i.producto.nombre}</span>
                  <span className="text-gray-500 shrink-0">disp: {i.producto.stock} · pedido: {i.cantidad}</span>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 mb-6">¿Vender igual sin stock?</p>
            <div className="flex gap-3 justify-end">
              <button
                data-stock-rechazar
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
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 rounded-lg focus:ring-2 focus:ring-gray-400/30 focus:outline-none"
              >
                Rechazar
              </button>
              <button
                ref={stockAceptarRef}
                onClick={() => {
                  setShowStockConfirm(false)
                  setStockConflictItems([])
                  pendingAllowSinStock.current = true
                  continuarVenta()
                }}
                className="px-4 py-2 text-sm font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 focus:ring-2 focus:ring-amber-500/40 focus:outline-none"
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client popup */}
      {showClientPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">Cobro pendiente</h3>
                <p className="text-sm text-gray-500 mt-0.5">Seleccioná el cliente para registrar la deuda</p>
              </div>
              <button onClick={() => { setShowClientPopup(false); setClientesBusqueda(''); setClientesResultados([]) }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {/* Search */}
            <input
              autoFocus
              type="text"
              placeholder="Buscá por nombre o teléfono..."
              value={clientesBusqueda}
              onChange={e => setClientesBusqueda(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none mb-3"
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
            <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
              {clientesResultados.map(cl => (
                <button
                  key={cl.id}
                  onClick={() => {
                    setClienteSeleccionado(cl)
                    setShowClientPopup(false)
                    setShowDebtConfirm(false)
                    setClientesBusqueda('')
                    setClientesResultados([])
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
            <button onClick={() => { setShowNuevoCliente(true); setShowClientPopup(false); setEsOcasional(true) }} className="mt-3 w-full py-2 text-sm font-semibold text-indigo-600 border border-dashed border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors">
              + Nuevo cliente (ocasional)
            </button>
          </div>
        </div>
      )}

      {/* Nuevo cliente form */}
      {showNuevoCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => { setShowNuevoCliente(false); setNuevoClienteNombre(''); setEsOcasional(true) }}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Nuevo cliente</h3>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none mb-1"
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
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/30"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      disabled={formCliente.tipoDocumento === 'ConsumidorFinal'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Condición IVA</label>
                  <select
                    value={formCliente.ivaCondicion}
                    onChange={e => setFormCliente({ ...formCliente, ivaCondicion: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Domicilio</label>
                    <input
                      type="text"
                      value={formCliente.domicilio}
                      onChange={e => setFormCliente({ ...formCliente, domicilio: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => { setShowNuevoCliente(false); setNuevoClienteNombre(''); setEsOcasional(true) }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
                Cancelar
              </button>
              <button
                onClick={crearClienteYRevertir}
                disabled={nuevoClienteNombre.trim().length < 2}
                className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Crear y seleccionar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
