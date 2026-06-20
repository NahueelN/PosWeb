import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import type { ProductoDto, SucursalDto, VentaResultadoDto, MedioPagoDto, PagoVentaDto, ClienteDto, ComboDto } from '../types'

interface Item {
  producto: ProductoDto
  cantidad: number
  comboId?: number
  comboNombre?: string
  comboPrecio?: number
}

type Step = 'sucursal' | 'venta' | 'resultado'

export default function VentasPage() {
  const navigate = useNavigate()
  const { sucursal: ctxSucursal } = useOutletContext<{ sucursal: SucursalDto | null }>()
  const [step, setStep] = useState<Step>(
    ctxSucursal ? 'venta' : 'sucursal'
  )

  const [sucursales, setSucursales] = useState<SucursalDto[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [ultimosItems, setUltimosItems] = useState<Item[]>([])
  const [resultado, setResultado] = useState<VentaResultadoDto | null>(null)
  const { notifyError, notifySuccess } = useNotification()
  const confirmBtnRef = useRef<HTMLButtonElement>(null!)
  const medioRefs = useRef<(HTMLButtonElement | null)[]>([])
  const recibioInputRef = useRef<HTMLInputElement>(null!)

  // Caja
  const [cajaActiva, setCajaActiva] = useState<boolean | null>(null)
  const [cajaLoading, setCajaLoading] = useState(true)

  // Payments
  const [mediosPago, setMediosPago] = useState<MedioPagoDto[]>([])
  const [selectedMedio, setSelectedMedio] = useState<MedioPagoDto | null>(null)
  const [recibio, setRecibio] = useState('')

  // Deuda flow
  const [showDebtConfirm, setShowDebtConfirm] = useState(false)
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
  const [cantidadDrafts, setCantidadDrafts] = useState<Record<number, string>>({})
  const total = items.reduce((sum, i) => sum + i.producto.precio * i.cantidad, 0)
  const cantidadTotal = items.reduce((sum, i) => sum + i.cantidad, 0)

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
  }, [items])

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
    setItems((prev) => {
      const existente = prev.find((i) => i.producto.id === producto.id)
      if (existente) {
        return prev.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
      return [...prev, { producto, cantidad: 1 }]
    })
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
    setItems((prev) => {
      const existente = prev.find((i) => i.comboId === combo.id)
      if (existente) {
        return prev.map((i) =>
          i.comboId === combo.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
      return [...prev, {
        producto: { id: 0, codigoBarra: combo.codCombo, nombre: combo.descCombo, precio: combo.precio, costo: 0, stock: 0, activo: true },
        cantidad: 1,
        comboId: combo.id,
        comboNombre: combo.descCombo,
        comboPrecio: combo.precio,
      } as Item]
    })
    setSearchQuery('')
  }

  function handleCambiarCantidad(productoId: number, cantidad: number) {
    if (cantidad <= 0) {
      setItems((prev) => prev.filter((i) => i.producto.id !== productoId))
    } else {
      setItems((prev) =>
        prev.map((i) => i.producto.id === productoId ? { ...i, cantidad } : i)
      )
    }
  }

  function quitarItem(productoId: number) {
    setItems((prev) => prev.filter((i) => i.producto.id !== productoId))
  }

  // --- Payment ---
  function selectMedio(mp: MedioPagoDto) {
    setSelectedMedio(mp)
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
    if (!ctxSucursal || items.length === 0) return

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

    // If total payment wasn't received, ask about debt first
    if (recibioValor < total && !clienteSeleccionado) {
      setShowDebtConfirm(true)
      return
    }

    await ejecutarVenta(recibioValor)
  }

  async function ejecutarVenta(recibioValor: number) {
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
        items: items.map((i) => ({
          productoId: i.producto.id,
          cantidad: i.cantidad,
          comboId: i.comboId,
        })),
        pagos: pagosDto.length > 0 ? pagosDto : undefined,
        clienteId: clienteSeleccionado?.id,
      })
      setResultado(res)
      setUltimosItems([...items])
      setItems([])
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
  const handleCerrar = () => navigate(-1)

  function nuevaVenta() {
    setResultado(null)
    setUltimosItems([])
    setItems([])
    setSelectedMedio(null)
    setRecibio('')
    setClienteSeleccionado(null)
    setShowClientPopup(false)
    setShowDebtConfirm(false)
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
          <h1 className="text-center text-base font-bold mb-3">PosWeb{'\u2014'} Punto de Venta</h1>

          <div className="text-xs mb-3 space-y-0.5">
            <p><span className="font-semibold">Comprobante:</span> Venta #{resultado.ventaId}</p>
            <p><span className="font-semibold">Fecha:</span> {formatFecha(resultado.fecha)}</p>
            <p><span className="font-semibold">Sucursal:</span> {ctxSucursal?.nombre}</p>
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

          <p className="text-xs text-gray-600 text-center mt-3">
            Unidades: {ultimosItems.reduce((s, i) => s + i.cantidad, 0)}
          </p>
        </div>

        {/* Action buttons - hidden when printing */}
        <div className="no-print flex justify-center gap-3 mt-6 flex-wrap">
          <button onClick={handlePrint} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors border border-gray-300">
            Imprimir
          </button>
          <button onClick={nuevaVenta}
            autoFocus
            className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Nueva venta
          </button>
          <button onClick={handleCerrar} className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  // ========== PANTALLA: VENTA ==========
  return (
    <div className="flex-1 flex flex-col min-h-0" onKeyDown={handleVentaSectionKeyDown}>
      <div className="flex-1 flex flex-col pb-16 lg:mr-[33.333vw] min-h-0 overflow-hidden">
        {/* Top section — siempre visible */}
        <div className="shrink-0 space-y-4 pb-4">
          <div className="flex flex-col gap-6">
            {/* Sucursal activa */}
            {ctxSucursal && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span>{ctxSucursal.nombre}</span>
                <span className="text-gray-300 mx-1">·</span>
                <span className="text-xs text-gray-400">Cód: {ctxSucursal.codigo}</span>
              </div>
            )}

            {/* Caja warning */}
            {cajaLoading && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Verificando caja...</span>
              </div>
            )}
            {!cajaLoading && cajaActiva === false && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
                <div className="flex-1">
                  <span className="font-medium">No hay caja abierta</span>
                  <p className="text-xs mt-0.5">Andá a la sección Caja para abrir una.</p>
                </div>
              </div>
            )}

            {/* Search bar */}
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                ref={searchInputRef}
                id="search-producto"
                className="w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200 rounded-xl shadow-sm text-base placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                placeholder="Buscá producto por código de barra o nombre…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Tab' && !e.shiftKey && items.length > 0) {
                    e.preventDefault()
                    medioRefs.current[0]?.focus()
                  }
                  if (e.key === 'ArrowDown' || e.key === 'Enter') {
                    e.preventDefault()
                    const q = searchQuery.trim().toUpperCase()
                    if (e.key === 'Enter' && q) {
                      const combo = combos.find(c => c.codCombo === q)
                      if (combo) {
                        agregarCombo(combo)
                        setSearchQuery('')
                        return
                      }
                    }
                    setTimeout(() => {
                      productGridRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
                    }, 0)
                  }
                }}
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); searchInputRef.current?.focus() }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
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
                {items.length > 0 && (
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 rounded-[4px] text-[10px] font-mono border border-gray-200 shadow-[0_1px_0_0_#e5e7eb]">Tab</kbd>
                    <span>Pago</span>
                  </span>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Product Grid — tarjeta con borde, scrollea como el carrito */}
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
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium text-sm">Sin resultados para esta búsqueda</p>
                </div>
              ) : filteredProductos.length === 0 && filteredCombos.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium text-sm">No hay productos disponibles</p>
                </div>
              ) : (
                <div
                  ref={productGridRef}
                  className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                  onKeyDown={(e) => {
                    const buttons = Array.from(productGridRef.current?.querySelectorAll('button') ?? [])
                    const currentIdx = buttons.indexOf(e.target as HTMLButtonElement)
                    if (currentIdx === -1) return

                    const gridEl = productGridRef.current
                    if (!gridEl) return
                    let cols = 2
                    try {
                      cols = getComputedStyle(gridEl).gridTemplateColumns.split(' ').length
                    } catch {}

                    if (e.key === 'ArrowRight') {
                      e.preventDefault()
                      const next = Math.min(currentIdx + 1, buttons.length - 1)
                      if (next !== currentIdx) buttons[next]?.focus()
                    } else if (e.key === 'ArrowLeft') {
                      e.preventDefault()
                      if (currentIdx > 0) buttons[currentIdx - 1]?.focus()
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      const next = Math.min(currentIdx + cols, buttons.length - 1)
                      if (next !== currentIdx) buttons[next]?.focus()
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      if (currentIdx - cols < 0) {
                        searchInputRef.current?.focus()
                      } else {
                        buttons[currentIdx - cols]?.focus()
                      }
                    } else if (e.key === 'Tab' && !e.shiftKey && items.length > 0) {
                      e.preventDefault()
                      medioRefs.current[0]?.focus()
                    } else if (e.key === 'Tab' && e.shiftKey && currentIdx === 0) {
                      e.preventDefault()
                      searchInputRef.current?.focus()
                    }
                  }}
                >
                  {filteredProductos.map((p) => (
                    <ProductCard key={p.id} producto={p} onAdd={agregarProducto} />
                  ))}
                  {filteredCombos.map((c) => (
                    <button key={`combo-${c.id}`} onClick={() => agregarCombo(c)}
                      className="text-left bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-3 hover:border-purple-400 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-purple-500/30">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold bg-purple-500 text-white px-1.5 py-0.5 rounded">COMBO</span>
                      </div>
                      <p className="font-medium text-gray-900 text-sm truncate">{c.descCombo}</p>
                      <p className="text-xs text-gray-400 font-mono truncate mt-0.5">{c.codCombo}</p>
                      <p className="text-lg font-bold text-purple-700 mt-1.5">${c.precio.toFixed(0)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL — fixed a la derecha */}
      <div className="hidden lg:flex fixed right-0 top-16 bottom-0 w-1/3 border-l border-gray-200 bg-gray-50 z-30 flex flex-col p-4 gap-4">
        {/* Cart card (scrollable items) */}
        <div className="flex-1 min-h-0">
          <div className="h-full bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            {/* Header — siempre visible */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
              <h3 className="text-sm font-semibold text-gray-700">
                {items.length > 0 ? `Venta actual (${cantidadTotal})` : 'Nueva venta'}
              </h3>
            </div>

            <div ref={cartListRef} className="flex-1 overflow-y-auto px-4 pb-4 min-h-0">
              {items.length === 0 ? (
                /* Empty state */
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-medium text-sm">Agregá productos para armar la venta</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((i, idx) => (
                    <div key={i.comboId ? `combo-${i.comboId}` : i.producto.id} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
                      <div className="flex-1 min-w-0">
                        {i.comboId ? (
                          <>
                            <p className="font-medium text-gray-800 text-sm truncate flex items-center gap-1">
                              <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">COMBO</span>
                              {i.producto.nombre}
                            </p>
                            <p className="text-xs text-gray-400 font-mono truncate">{i.producto.codigoBarra}</p>
                            {(() => {
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
                              return null
                            })()}
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-gray-800 text-sm truncate">{i.producto.nombre}</p>
                            <p className="text-xs text-gray-400 font-mono truncate">{i.producto.codigoBarra}</p>
                          </>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">${i.producto.precio.toFixed(2)} c/u</p>
                        {i.cantidad > i.producto.stock && (
                          <p className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                            Stock insuficiente: {i.producto.stock} disponible{i.producto.stock !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setCantidadDrafts((prev) => {
                              const next = { ...prev }
                              delete next[i.producto.id]
                              return next
                            })
                            handleCambiarCantidad(i.producto.id, i.cantidad - 1)
                          }}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors focus:ring-2 focus:ring-gray-400/30 focus:outline-none text-sm"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={0}
                          ref={(el) => {
                            if (el) cantidadRefs.current.set(i.producto.id, el)
                            else cantidadRefs.current.delete(i.producto.id)
                          }}
                          className="w-12 text-center border border-gray-200 rounded-lg px-1 py-1 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          value={cantidadDrafts[i.producto.id] ?? String(i.cantidad)}
                          onChange={(e) => {
                            const raw = e.target.value
                            // Permitir vacío mientras se edita sin borrar el item
                            setCantidadDrafts((prev) => ({ ...prev, [i.producto.id]: raw }))
                          }}
                          onBlur={() => {
                            const raw = cantidadDrafts[i.producto.id]
                            if (raw !== undefined) {
                              const parsed = parseInt(raw, 10)
                              handleCambiarCantidad(i.producto.id, isNaN(parsed) ? 1 : parsed)
                              setCantidadDrafts((prev) => {
                                const next = { ...prev }
                                delete next[i.producto.id]
                                return next
                              })
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              const raw = cantidadDrafts[i.producto.id]
                              const parsed = parseInt(raw ?? '', 10)
                              handleCambiarCantidad(i.producto.id, isNaN(parsed) ? 1 : parsed)
                              setCantidadDrafts((prev) => {
                                const next = { ...prev }
                                delete next[i.producto.id]
                                return next
                              })
                              searchInputRef.current?.focus()
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCantidadDrafts((prev) => {
                              const next = { ...prev }
                              delete next[i.producto.id]
                              return next
                            })
                            handleCambiarCantidad(i.producto.id, i.cantidad + 1)
                          }}
                          className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors focus:ring-2 focus:ring-gray-400/30 focus:outline-none text-sm"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right shrink-0 min-w-[60px]">
                        <p className="font-semibold text-gray-900 text-sm">${(i.producto.precio * i.cantidad).toFixed(2)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => quitarItem(i.producto.id)}
                        className="shrink-0 w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors focus:ring-2 focus:ring-red-500/30 focus:outline-none"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer: Vuelto + Recibió + Total + Confirm */}
        {items.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-5 py-4 shrink-0 space-y-3">
            {/* Vuelto */}
            {selectedMedio?.pagaVuelto && (() => {
              const recibioNum = parseFloat(recibio || '0')
              const vuelto = recibioNum > total ? recibioNum - total : 0
              return vuelto > 0 ? (
                <div className="flex items-center justify-between pb-3 border-b border-green-100">
                  <span className="text-sm font-medium text-green-700">Vuelto</span>
                  <span className="text-xl font-bold text-green-700">${vuelto.toFixed(2)}</span>
                </div>
              ) : null
            })()}

            {/* Recibió */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recibió</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl pointer-events-none">$</span>
                <input
                  ref={recibioInputRef}
                  type="number" step="0.01" min="0"
                  value={recibio}
                  onChange={e => { setRecibio(e.target.value); setClienteSeleccionado(null) }}
                  onFocus={e => e.target.select()}
                  className="w-full pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg text-right text-xl font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                  placeholder={total.toFixed(2)}
                />
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-medium">Total</span>
              <span className="text-2xl font-bold text-gray-900">${total.toFixed(2)}</span>
            </div>

            {/* Cliente seleccionado para deuda */}
            {clienteSeleccionado && (
              <div className="flex items-center justify-between text-xs bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg">
                <span className="font-medium">Cliente: {clienteSeleccionado.nombre}</span>
                <button onClick={() => setClienteSeleccionado(null)} className="text-indigo-400 hover:text-indigo-600 ml-2">✕</button>
              </div>
            )}

            {/* Confirm button */}
            {!cajaActiva ? (
              <div className="w-full py-3 bg-gray-300 text-gray-500 font-semibold rounded-xl text-sm text-center">
                Sin caja abierta
              </div>
            ) : (
              <button
                ref={confirmBtnRef}
                type="button"
                onClick={confirmarVenta}
                className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors text-sm"
              >
                {clienteSeleccionado
                  ? `Confirmar venta — $${total.toFixed(2)} (deuda $${(total - (parseFloat(recibio) || 0)).toFixed(2)})`
                  : `Confirmar venta — $${total.toFixed(2)}`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom bar — medios de pago */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-56 lg:right-[33.333vw] bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] z-20">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Medios header */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Medio</span>
              <span className="flex items-center gap-1 text-[10px] text-gray-400">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded-[3px] text-[9px] font-mono border border-gray-200">←</kbd>
                <kbd className="px-1 py-0.5 bg-gray-100 rounded-[3px] text-[9px] font-mono border border-gray-200">→</kbd>
                <span>navegar</span>
              </span>
            </div>

            {/* Medios */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {mediosPago.map((mp, idx) => {
                const estaSeleccionado = selectedMedio?.id === mp.id
                return (
                  <button
                    key={mp.id}
                    ref={(el) => { medioRefs.current[idx] = el }}
                    type="button"
                    onClick={() => selectMedio(mp)}
                    onKeyDown={(e) => {
                      if (e.key === 'Tab' && !e.shiftKey) {
                        e.preventDefault()
                        confirmBtnRef.current?.focus()
                        return
                      }
                      if (idx === 0 && e.key === 'Tab' && e.shiftKey) {
                        e.preventDefault()
                        searchInputRef.current?.focus()
                        return
                      }
                      handleMedioKeyDown(e, idx)
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-sm font-medium border transition-all focus:ring-2 focus:ring-indigo-500/30 focus:outline-none ${
                      estaSeleccionado
                        ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400/30 text-indigo-700'
                        : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700'
                    }`}
                  >
                    {mp.nombre}
                  </button>
                )
              })}
            </div>

            {selectedMedio && (
              <span className="text-xs font-medium text-gray-600 shrink-0">
                {selectedMedio.nombre} · <strong>${total.toFixed(2)}</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Debt confirmation dialog */}
      {showDebtConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDebtConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Fiado — Cuenta Corriente</h3>
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
                <span className="font-semibold text-amber-600">${(total - (parseFloat(recibio) || 0)).toFixed(2)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">¿Desea confirmar o rechazar?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowDebtConfirm(false); setRecibio(total.toFixed(2)) }} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800">
                Rechazar
              </button>
              <button onClick={() => { setShowDebtConfirm(false); setShowClientPopup(true) }} className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Aceptar — Elegir cliente
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
              <h3 className="text-lg font-bold text-gray-900">Seleccionar cliente — Deuda</h3>
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
            {buscandoClientes && <p className="text-xs text-gray-400 text-center py-4">Buscando...</p>}

            {/* Results */}
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
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">{cl.nombre}</p>
                  {cl.telefono && <p className="text-xs text-gray-500">{cl.telefono}</p>}
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
    </div>

  )
}

// ===== Inline Components =====

function ProductCard({ producto, onAdd }: { producto: ProductoDto; onAdd: (p: ProductoDto) => void }) {
  const stockColor = producto.stock === 0 ? 'red' : producto.stock <= 5 ? 'amber' : 'emerald'
  return (
    <button
      type="button"
      onClick={() => onAdd(producto)}
      className="bg-white rounded-xl border border-gray-200 p-3 text-left hover:border-indigo-300 hover:shadow-sm transition-all active:scale-[0.98] focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
      title={producto.nombre}
    >
      <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{producto.nombre}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <p className="text-[10px] text-gray-400 font-mono truncate">{producto.codigoBarra}</p>
        {producto.tamano && (
          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">{producto.tamano}</span>
        )}
      </div>
      <div className="flex items-end justify-between mt-2 gap-2">
        <p className="text-xl font-bold text-indigo-600">${producto.precio.toFixed(2)}</p>
        <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 ${
          stockColor === 'red'
            ? 'bg-red-50 text-red-600'
            : stockColor === 'amber'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-emerald-50 text-emerald-700'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            stockColor === 'red' ? 'bg-red-500' : stockColor === 'amber' ? 'bg-amber-500' : 'bg-emerald-500'
          }`} />
          {producto.stock === 0 ? 'sin stock' : `${producto.stock}`}
        </span>
      </div>
    </button>
  )
}
