import { useState, useEffect, useMemo, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../hooks/useCart'
import { useItemSnapshot } from '../hooks/useItemSnapshot'
import CartHost from '../components/hosts/CartHost'
import { formatCodigoBarra } from '../components/shared/ProductCard'
import { Undo2 } from 'lucide-react'
import { estaVigenteHoy } from '../lib/recurrencia'
import SucursalSelector from './venta/SucursalSelector'
import TicketResultado from './venta/TicketResultado'
import VentaProductGrid from './venta/VentaProductGrid'
import VentaPaymentSlot from './venta/VentaPaymentSlot'
import VentaDialogs from './venta/VentaDialogs'

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

export default function VentasPage() {
  const { sucursal: ctxSucursal } = useOutletContext<{ sucursal: SucursalDto | null }>()
  const [step, setStep] = useState<Step>('venta')
  const { notifyError } = useNotification()
  const { user } = useAuth()

  // Step state
  const [sucursales, setSucursales] = useState<SucursalDto[]>([])
  const [resultado, setResultado] = useState<VentaResultadoDto | null>(null)
  const [ultimosItems, setUltimosItems] = useState<Item[]>([])

  // Cart
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
  const recibioManuallyEdited = useRef(false)

  // Productos / Combos / Ofertas
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [combos, setCombos] = useState<ComboDto[]>([])
  const [ofertas, setOfertas] = useState<OfertaDto[]>([])
  const [productosLoading, setProductosLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [unidades, setUnidades] = useState<UnidadMedidaDto[]>([])

  // Combos
  const [dismissedCombos, setDismissedCombos] = useState<Set<number>>(new Set())
  const autoComboRef = useRef(false)

  // Deuda / Cliente flow
  const [showStockConfirm, setShowStockConfirm] = useState(false)
  const [stockConflictItems, setStockConflictItems] = useState<Item[]>([])
  const [showClientPopup, setShowClientPopup] = useState(false)
  const [clientesBusqueda, setClientesBusqueda] = useState('')
  const [clientesResultados, setClientesResultados] = useState<ClienteDto[]>([])
  const [buscandoClientes, setBuscandoClientes] = useState(false)
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteDto | null>(null)
  const [showNuevoCliente, setShowNuevoCliente] = useState(false)
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('')
  const [esOcasional, setEsOcasional] = useState(true)
  const [formCliente, setFormCliente] = useState({ tipoDocumento: 'DNI', numeroDocumento: '', ivaCondicion: 'ConsumidorFinal', telefono: '', domicilio: '' })

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null!)
  const productGridRef = useRef<HTMLDivElement>(null!)
  const cartListRef = useRef<HTMLDivElement>(null!)
  const confirmBtnRef = useRef<HTMLButtonElement>(null!)
  const medioRefs = useRef<(HTMLButtonElement | null)[]>([])
  const recibioInputRef = useRef<HTMLInputElement>(null!)
  const cantidadRefs = useRef<Map<number, HTMLInputElement>>(new Map())
  const stockCancelarRef = useRef<HTMLButtonElement>(null!)
  const clientesResultsRef = useRef<HTMLDivElement | null>(null)
  const pendingAllowSinStock = useRef(false)
  const [cantidadDrafts, setCantidadDrafts] = useState<Record<number, string>>({})
  const { markAdded, onFocusQty, onEscape } = useItemSnapshot()

  // Computed
  const unidadesMap = useMemo(() => { const m = new Map<number, string>(); for (const u of unidades) m.set(u.id, u.codigo); return m }, [unidades])
  const ofertasMap = useMemo(() => { const m = new Map<number, OfertaDto>(); for (const o of ofertas) { if (estaVigenteHoy(o.fechaInicio, o.fechaFin, o.diasSemana, o.activo)) m.set(o.productoId, o) } return m }, [ofertas])
  const combosVigentes = useMemo(() => combos.filter(c => estaVigenteHoy(c.fechaInicio, c.fechaFin, c.diasSemana, c.activo)), [combos])
  const filteredProductos = useMemo(() => { if (!searchQuery.trim()) return productos; const q = searchQuery.toLowerCase(); return productos.filter(p => p.nombre.toLowerCase().includes(q) || p.codigoBarra.toLowerCase().includes(q)) }, [productos, searchQuery])
  const filteredCombos = useMemo(() => { if (!searchQuery.trim()) return combosVigentes; const q = searchQuery.toLowerCase(); return combosVigentes.filter(c => c.descCombo.toLowerCase().includes(q) || c.codCombo.toLowerCase().includes(q)) }, [combosVigentes, searchQuery])

  // Effects
  useEffect(() => { if (!recibioManuallyEdited.current) setRecibio(total.toFixed(2)) }, [total])
  useEffect(() => { if (step === 'venta') { const id = setTimeout(() => searchInputRef.current?.focus(), 150); return () => clearTimeout(id) } }, [step])
  const [sucursalActiva, setSucursalActiva] = useState<SucursalDto | null>(null)

  // Derivar sucursal: contexto > auto-cargada > null
  const sucursalEfectiva = ctxSucursal ?? sucursalActiva

  // Cargar sucursal: contexto > localStorage > auto-pick primera de API > selector manual
  useEffect(() => {
    if (sucursalActiva || step !== 'venta') return
    if (ctxSucursal) return

    api.sucursales.listar().then(lst => {
      if (lst.length > 0) {
        localStorage.setItem('sucursalActiva', JSON.stringify(lst[0]))
        setSucursalActiva(lst[0])
      } else {
        setStep('sucursal')
      }
    }).catch(() => {
      setStep('sucursal')
    })
  }, [ctxSucursal, sucursalActiva, step])
  useEffect(() => { if (cartListRef.current) cartListRef.current.scrollTop = cartListRef.current.scrollHeight }, [cart.items])
  useEffect(() => { if (cart.items.length === 0 && dismissedCombos.size > 0) setDismissedCombos(new Set()) }, [cart.items.length === 0])

  useEffect(() => {
    if (step !== 'venta' || !sucursalEfectiva) return
    setCajaLoading(true)
    api.cajas.activa(sucursalEfectiva.id).then(res => setCajaActiva(res.activa)).catch(() => setCajaActiva(false)).finally(() => setCajaLoading(false))
    api.mediosPago.listar().then(mp => { mp.sort((a, b) => { const p = [1, 4]; const ia = p.indexOf(a.id); const ib = p.indexOf(b.id); if (ia !== -1 && ib !== -1) return ia - ib; if (ia !== -1) return -1; if (ib !== -1) return 1; return a.id - b.id }); setMediosPago(mp) }).catch(() => {})
    api.unidadesMedida.listar().then(setUnidades).catch(() => {})
    setProductosLoading(true)
    api.productos.listar(sucursalEfectiva.id).then(setProductos).catch(() => {}).finally(() => setProductosLoading(false))
    api.combos.listar().then(setCombos).catch(() => {})
    api.ofertas.listar().then(setOfertas).catch(() => {})
  }, [step, sucursalEfectiva])

  useEffect(() => { const q = searchQuery.trim(); if (!q) return; const match = productos.find(p => p.codigoBarra.toLowerCase() === q.toLowerCase()); if (match) agregarProducto(match) }, [searchQuery, productos])

  // Combo auto-detection
  useEffect(() => {
    if (autoComboRef.current) { autoComboRef.current = false; return }
    if (cart.items.length === 0) return
    if (dismissedCombos.size > 0) {
      setDismissedCombos(prev => {
        const next = new Set(prev)
        for (const comboId of prev) {
          const combo = combos.find(c => c.id === comboId)
          if (!combo) { next.delete(comboId); continue }
          const stillPresent = combo.items.every(ci => { const cartItem = cart.items.find(i => !i.comboId && i.producto.id === ci.productoId); return cartItem && cartItem.cantidad >= ci.cantidad })
          if (!stillPresent) next.delete(comboId)
        }
        return next.size === prev.size ? prev : next
      })
    }
    const match = combosVigentes.find(combo => {
      if (cart.items.some(i => i.comboId === combo.id)) return false
      if (dismissedCombos.has(combo.id)) return false
      return combo.items.every(ci => { const cartItem = cart.items.find(i => !i.comboId && i.producto.id === ci.productoId); return cartItem && cartItem.cantidad >= ci.cantidad })
    })
    if (!match) return
    autoComboRef.current = true
    cart.setItems(prev => {
      const filtered = prev.map(i => { if (i.comboId) return i; const ci = match.items.find(c => c.productoId === i.producto.id); if (!ci) return i; const rest = i.cantidad - ci.cantidad; if (rest <= 0) return null; return { ...i, cantidad: rest } }).filter(Boolean) as Item[]
      return [...filtered, { producto: { id: 0, codigoBarra: match.codCombo, nombre: match.descCombo, precio: match.precio, costo: 0, stock: 999, activo: true }, cantidad: 1, comboId: match.id, comboNombre: match.descCombo, comboPrecio: match.precio } as Item]
    })
  }, [cart.items, combos])

  // Client search
  useEffect(() => {
    if (!showClientPopup || clientesBusqueda.trim().length < 1) { setClientesResultados([]); return }
    const timer = setTimeout(async () => { setBuscandoClientes(true); try { const res = await api.clientes.listar(clientesBusqueda.trim()); setClientesResultados(res.items ?? []) } catch {}; setBuscandoClientes(false) }, 300)
    return () => clearTimeout(timer)
  }, [clientesBusqueda, showClientPopup])

  // Ctrl+Enter shortcut
  useEffect(() => {
    if (step !== 'venta') return
    const handler = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { if (selectedMedio && cart.items.length > 0) { e.preventDefault(); confirmarVenta() } } }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [step, selectedMedio, cart.items.length, confirmarVenta])

  // ===== Actions =====
  function seleccionarSucursal(s: SucursalDto) { localStorage.setItem('sucursalActiva', JSON.stringify(s)); setStep('venta'); window.location.reload() }
  function nuevaVenta() { setResultado(null); setUltimosItems([]); cart.clearCart(); setSelectedMedio(null); setRecibio(''); setClienteSeleccionado(null); setShowClientPopup(false); recibioManuallyEdited.current = false; setStep('venta'); setTimeout(() => searchInputRef.current?.focus(), 100) }

  function agregarProducto(producto: ProductoDto) {
    const oferta = ofertasMap.get(producto.id)
    markAdded(producto.id, cart.items.find(i => !i.comboId && i.producto.id === producto.id)?.cantidad)
    const item: Item = oferta
      ? { producto: { ...producto, precio: producto.precio * (1 - oferta.descuento / 100) }, cantidad: 1, ofertaId: oferta.id, descuentoAplicado: oferta.descuento, precioOriginal: producto.precio }
      : { producto, cantidad: 1 }
    cart.addItem(item)
    setSearchQuery('')
    const el = searchInputRef.current; if (el) { el.classList.remove('animate-barcode-flash'); void el.offsetWidth; el.classList.add('animate-barcode-flash') }
    setCantidadDrafts(prev => { const next = { ...prev }; delete next[producto.id]; return next })
    setTimeout(() => { const input = cantidadRefs.current.get(producto.id); if (input) { input.focus(); input.select() } }, 0)
  }

  function agregarCombo(combo: ComboDto) {
    markAdded(combo.id)
    cart.addItem({ producto: { id: 0, codigoBarra: combo.codCombo, nombre: combo.descCombo, precio: combo.precio, costo: 0, stock: 999, activo: true }, cantidad: 1, comboId: combo.id, comboNombre: combo.descCombo, comboPrecio: combo.precio } as Item)
    setSearchQuery('')
    setTimeout(() => { const input = cantidadRefs.current.get(combo.id); if (input) { input.focus(); input.select() } }, 0)
  }

  function selectMedio(mp: MedioPagoDto) { setSelectedMedio(mp); setTimeout(() => recibioInputRef.current?.focus(), 0) }
  function handleCambiarCantidad(id: number, c: number) { cart.updateQuantity(id, Math.max(0, c)) }

  async function deshacerCombo(comboId: number) {
    const combo = combos.find(c => c.id === comboId); if (!combo) return
    setDismissedCombos(prev => new Set(prev).add(comboId))
    const detalles = await Promise.all(combo.items.map(ci => ci.productoId ? api.productos.detalle(ci.productoId).catch(() => null) : Promise.resolve(null)))
    cart.setItems(prev => {
      const sinCombo = prev.filter(i => i.comboId !== comboId)
      const individuales = combo.items.map((ci, idx) => { const p = detalles[idx]; const producto = p ? { id: p.id, codigoBarra: p.codigoBarra, nombre: p.nombre, precio: p.precio, costo: p.costo, stock: p.stock, activo: p.activo } : { id: ci.productoId, codigoBarra: '', nombre: ci.productoNombre ?? `Producto #${ci.productoId}`, precio: 0, costo: 0, stock: 999, activo: true }; return { producto, cantidad: ci.cantidad } }) as Item[]
      return [...sinCombo, ...individuales]
    })
  }

  async function confirmarVenta() {
    if (!sucursalEfectiva || cart.items.length === 0) return
    if (!cajaActiva) { try { const res = await api.cajas.activa(sucursalEfectiva.id); if (!res.activa) { notifyError('No hay caja abierta. Andá a Caja y abrí una primero.'); return }; setCajaActiva(true) } catch { notifyError('No hay caja abierta. Andá a Caja y abrí una primero.'); return } }
    if (!selectedMedio) { notifyError('Seleccioná un medio de pago antes de confirmar.'); return }
    const r = parseFloat(recibio) || 0
    if (!pendingAllowSinStock.current) { const sinStock = cart.items.filter(i => i.cantidad > i.producto.stock); if (sinStock.length > 0) { setStockConflictItems(sinStock); setShowStockConfirm(true); return } }
    if (r < total && !clienteSeleccionado) { setShowClientPopup(true); return }
    await ejecutarVenta(r, pendingAllowSinStock.current)
    pendingAllowSinStock.current = false
  }

  function continuarVenta() { const r = parseFloat(recibio) || 0; if (selectedMedio && r < total && !clienteSeleccionado) { setShowClientPopup(true); return }; ejecutarVenta(r, pendingAllowSinStock.current); pendingAllowSinStock.current = false }

  async function ejecutarVenta(recibioValor: number, allowSinStock = false, cliente?: ClienteDto) {
    if (!sucursalEfectiva) return
    try {
      const pagosDto: PagoVentaDto[] = []
      if (selectedMedio && recibioValor > 0) {
        const monto = recibioValor < total ? recibioValor : total
        pagosDto.push({ medioPagoId: selectedMedio.id, monto })
        if (selectedMedio.pagaVuelto && recibioValor > total) pagosDto[0].conCambio = recibioValor
      }
      const res = await api.ventas.crear({ sucursalId: sucursalEfectiva.id, items: cart.items.map(i => ({ productoId: i.producto.id, cantidad: i.cantidad, comboId: i.comboId, ofertaId: i.ofertaId })), pagos: pagosDto.length > 0 ? pagosDto : undefined, clienteId: (cliente ?? clienteSeleccionado)?.id, allowSinStock })
      setResultado(res); setUltimosItems([...cart.items]); cart.clearCart(); setSelectedMedio(null); setRecibio(''); setClienteSeleccionado(null); setShowClientPopup(false); setStep('resultado')
    } catch (e: any) { notifyError(e.message) }
  }

  async function crearClienteYRevertir() {
    if (nuevoClienteNombre.trim().length < 2) return
    try {
      const dto: ClienteDto = esOcasional ? { nombre: nuevoClienteNombre.trim(), tipoDocumento: 'ConsumidorFinal', numeroDocumento: '', ivaCondicion: 'ConsumidorFinal' }
        : { nombre: nuevoClienteNombre.trim(), tipoDocumento: formCliente.tipoDocumento, numeroDocumento: formCliente.numeroDocumento, ivaCondicion: formCliente.ivaCondicion, telefono: formCliente.telefono || undefined, domicilio: formCliente.domicilio || undefined }
      const nuevo = await api.clientes.crear(dto); setClienteSeleccionado(nuevo); setShowNuevoCliente(false); setShowClientPopup(false)
      setNuevoClienteNombre(''); setEsOcasional(true); setFormCliente({ tipoDocumento: 'DNI', numeroDocumento: '', ivaCondicion: 'ConsumidorFinal', telefono: '', domicilio: '' })
      ejecutarVenta(parseFloat(recibio) || 0, pendingAllowSinStock.current, nuevo)
    } catch (e: any) { notifyError(e.message) }
  }

  function handleStockCancel(firstItem: Item | null) {
    setShowStockConfirm(false); setStockConflictItems([])
    if (firstItem) { const input = cantidadRefs.current.get(firstItem.producto.id); if (input) { cartListRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); input.focus(); input.select() } }
  }

  function handleStockContinue() { setShowStockConfirm(false); setStockConflictItems([]); pendingAllowSinStock.current = true; continuarVenta() }

  function handleClientSelect(cl: ClienteDto) { setClienteSeleccionado(cl); setShowClientPopup(false); setClientesBusqueda(''); setClientesResultados([]); ejecutarVenta(parseFloat(recibio) || 0, pendingAllowSinStock.current, cl); pendingAllowSinStock.current = false }
  function handleAbrirNuevoCliente() { setShowNuevoCliente(true); setShowClientPopup(false); setEsOcasional(true) }

  // ===== Render =====
  if (step === 'sucursal') return <SucursalSelector sucursales={sucursales} onSelect={seleccionarSucursal} />
  if (step === 'resultado' && resultado) return <TicketResultado resultado={resultado} ultimosItems={ultimosItems} user={user} onNuevaVenta={nuevaVenta} />

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
        confirmOverride={!cajaActiva ? (<div className="w-full py-3 bg-gray-300 text-gray-500 font-semibold rounded-xl text-sm text-center">Sin caja abierta</div>) : undefined}
        headerExtra={clienteSeleccionado ? (
          <div className="flex items-center text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg">
            <span className="font-medium">Cliente: {clienteSeleccionado.nombre}</span>
            <button onClick={() => setClienteSeleccionado(null)} className="text-indigo-400 hover:text-indigo-600 ml-2">✕</button>
          </div>
        ) : undefined}
        paymentSlot={<VentaPaymentSlot mediosPago={mediosPago} selectedMedio={selectedMedio} onSelectMedio={selectMedio} medioRefs={medioRefs} confirmBtnRef={confirmBtnRef} searchInputRef={searchInputRef} total={total} recibio={recibio} />}
        getItemProps={(i) => {
          const itemId = i.comboId ?? i.producto.id
          const tieneOferta = i.ofertaId && i.precioOriginal
          return {
            nombre: i.producto.nombre,
            codigo: formatCodigoBarra(i.producto, unidadesMap),
            precioUnitario: tieneOferta ? `$${i.producto.precio.toFixed(2)} c/u  (${i.descuentoAplicado}% OFF)` : `$${i.producto.precio.toFixed(2)} c/u`,
            subtotal: `$${(i.producto.precio * i.cantidad).toFixed(2)}`,
            cantidad: i.cantidad,
            onCantidadChange: (c: number) => { setCantidadDrafts(prev => { const next = { ...prev }; delete next[itemId]; return next }); handleCambiarCantidad(itemId, c) },
            onEnter: () => searchInputRef.current?.focus(),
            onFocusQty: () => onFocusQty(itemId, i.cantidad),
            onEscape: () => onEscape(itemId, i.cantidad, (qty) => handleCambiarCantidad(itemId, qty), () => cart.removeItem(itemId)),
            inputRef: (el: HTMLInputElement | null) => { if (el) cantidadRefs.current.set(itemId, el); else cantidadRefs.current.delete(itemId) },
            stockWarning: i.cantidad > i.producto.stock ? `Stock insuficiente: ${i.producto.stock} disponible${i.producto.stock !== 1 ? 's' : ''}` : undefined,
            badge: (
              <>
                {i.comboId && <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold mr-1">COMBO</span>}
                {i.ofertaId && <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold mr-1">{i.descuentoAplicado}% OFF</span>}
              </>
            ),
            details: i.comboId ? (() => {
              const combo = combos.find(c => c.id === i.comboId)
              return (
                <div className="mt-1">
                  {combo?.items.length ? (
                    <div className="space-y-0.5">
                      {combo.items.map((item, j) => (
                        <div key={j} className="flex items-center gap-1.5 text-xs text-gray-400">
                          <span className="w-1 h-1 rounded-full bg-purple-300 shrink-0" />
                          <span className="truncate">{item.productoNombre ?? `x${item.productoId}`}</span>
                          <span className="text-gray-300">x{item.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <button type="button" onClick={() => deshacerCombo(i.comboId!)} className="mt-1 text-[11px] text-purple-500 hover:text-purple-700 font-medium flex items-center gap-1">
                    <Undo2 size={11} />Deshacer combo
                  </button>
                </div>
              )
            })() : undefined,
            onRemove: () => cart.removeItem(i.producto.id),
            removeButton: undefined,
          }
        }}
        getItemKey={(i) => i.comboId ? `combo-${i.comboId}` : i.producto.id}
      >
        <VentaProductGrid
          productosLoading={productosLoading}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchInputRef={searchInputRef}
          productGridRef={productGridRef}
          filteredProductos={filteredProductos}
          filteredCombos={filteredCombos}
          unidadesMap={unidadesMap}
          ofertasMap={ofertasMap}
          onAgregarProducto={agregarProducto}
          onAgregarCombo={agregarCombo}
          combos={combos}
          medioRefs={medioRefs}
          cartItemsLength={cart.items.length}
        />
      </CartHost>

      <VentaDialogs
        showStockConfirm={showStockConfirm}
        stockConflictItems={stockConflictItems}
        onStockCancel={handleStockCancel}
        onStockContinue={handleStockContinue}
        stockCancelarRef={stockCancelarRef}
        showClientPopup={showClientPopup}
        clientesBusqueda={clientesBusqueda}
        clientesResultados={clientesResultados}
        buscandoClientes={buscandoClientes}
        onClientPopupClose={() => { setShowClientPopup(false); setClientesBusqueda(''); setClientesResultados([]) }}
        onClientSearchChange={setClientesBusqueda}
        onClientSelect={handleClientSelect}
        clientesResultsRef={clientesResultsRef}
        total={total}
        recibio={recibio}
        showNuevoCliente={showNuevoCliente}
        nuevoClienteNombre={nuevoClienteNombre}
        esOcasional={esOcasional}
        formCliente={formCliente}
        onNuevoClienteClose={() => { setShowNuevoCliente(false); setNuevoClienteNombre(''); setEsOcasional(true) }}
        onNuevoClienteNombreChange={setNuevoClienteNombre}
        onEsOcasionalChange={setEsOcasional}
        onFormClienteChange={setFormCliente}
        onCrearCliente={crearClienteYRevertir}
        onAbrirNuevoCliente={handleAbrirNuevoCliente}
      />
    </>
  )
}
