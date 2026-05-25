import { useState, useEffect, useMemo, useRef, type FormEvent } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import type { ProductoDto, SucursalDto, VentaResultadoDto, MedioPagoDto, PagoVentaDto } from '../types'

interface Item {
  producto: ProductoDto
  cantidad: number
}

type Step = 'sucursal' | 'venta' | 'resultado'

export default function VentasPage() {
  const { sucursal: ctxSucursal } = useOutletContext<{ sucursal: SucursalDto | null }>()
  const [step, setStep] = useState<Step>(
    ctxSucursal ? 'venta' : 'sucursal'
  )

  const [sucursales, setSucursales] = useState<SucursalDto[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [resultado, setResultado] = useState<VentaResultadoDto | null>(null)
  const [error, setError] = useState('')
  const confirmBtnRef = useRef<HTMLButtonElement>(null!)
  const medioRefs = useRef<(HTMLButtonElement | null)[]>([])
  const recibioInputRef = useRef<HTMLInputElement>(null!)

  // Caja
  const [cajaActiva, setCajaActiva] = useState<boolean | null>(null)
  const [cajaLoading, setCajaLoading] = useState(true)

  // Payments
  const [mediosPago, setMediosPago] = useState<MedioPagoDto[]>([])
  const [selectedMedio, setSelectedMedio] = useState<MedioPagoDto | null>(null)
  const [pagoMonto, setPagoMonto] = useState('')
  const [pagoConCambio, setPagoConCambio] = useState('')

  // Product grid
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [productosLoading, setProductosLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const searchInputRef = useRef<HTMLInputElement>(null!)
  const productGridRef = useRef<HTMLDivElement>(null!)
  const total = items.reduce((sum, i) => sum + i.producto.precio * i.cantidad, 0)
  const cantidadTotal = items.reduce((sum, i) => sum + i.cantidad, 0)

  // Computed: client-side filter by name or barcode
  const filteredProductos = useMemo(() => {
    if (!searchQuery.trim()) return productos
    const q = searchQuery.toLowerCase()
    return productos.filter(p =>
      p.nombre.toLowerCase().includes(q) ||
      p.codigoBarra.toLowerCase().includes(q)
    )
  }, [productos, searchQuery])

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
        .then(mp => setMediosPago(mp))
        .catch(() => {})

      // Load all products for grid browsing
      setProductosLoading(true)
      api.productos.listar()
        .then(setProductos)
        .catch(() => {})
        .finally(() => setProductosLoading(false))
    }
  }, [step, ctxSucursal])

  useEffect(() => {
    if (ctxSucursal && step === 'sucursal') setStep('venta')
    if (!ctxSucursal && step !== 'sucursal') setStep('sucursal')
  }, [ctxSucursal, step])

  // Auto-focus "Recibió" input when a pagaVuelto medio is selected
  useEffect(() => {
    if (selectedMedio?.pagaVuelto) {
      setTimeout(() => recibioInputRef.current?.focus(), 50)
    }
  }, [selectedMedio])

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
    searchInputRef.current?.focus()
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
    setPagoMonto(total.toFixed(2))
    setPagoConCambio('')
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
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      selectMedio(mediosPago[idx])
    }
  }

  function handlePagoKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmarVenta()
    }
  }

  function esPagoCompleto(): boolean {
    return selectedMedio !== null && parseFloat(pagoMonto) > 0
  }

  async function confirmarVenta() {
    if (!ctxSucursal || items.length === 0) return

    if (!cajaActiva) {
      try {
        const res = await api.cajas.activa(ctxSucursal.id)
        if (!res.activa) {
          setError('No hay caja abierta. Andá a Caja y abrí una primero.')
          return
        }
        setCajaActiva(true)
      } catch {
        setError('No hay caja abierta. Andá a Caja y abrí una primero.')
        return
      }
    }

    try {
      setError('')
      if (!selectedMedio) {
        setError('Seleccioná un medio de pago.')
        return
      }

      const monto = parseFloat(pagoMonto)
      const pagosDto: PagoVentaDto[] = [{
        medioPagoId: selectedMedio.id,
        monto,
      }]
      if (selectedMedio.pagaVuelto && pagoConCambio) {
        const conCambioVal = parseFloat(pagoConCambio)
        if (!isNaN(conCambioVal) && conCambioVal > monto) {
          pagosDto[0].conCambio = conCambioVal
        }
      }

      const res = await api.ventas.crear({
        sucursalId: ctxSucursal.id,
        items: items.map((i) => ({ productoId: i.producto.id, cantidad: i.cantidad })),
        pagos: pagosDto,
      })
      setResultado(res)
      setItems([])
      setSelectedMedio(null)
      setPagoMonto('')
      setPagoConCambio('')
      setStep('resultado')
    } catch (e: any) { setError(e.message) }
  }

  async function handleConfirmar(e: FormEvent) {
    e.preventDefault()
    await confirmarVenta()
  }

  function nuevaVenta() {
    setResultado(null)
    setItems([])
    setSelectedMedio(null)
    setPagoMonto('')
    setPagoConCambio('')
    setError('')
    setStep('venta')
    setTimeout(() => searchInputRef.current?.focus(), 100)
  }

  function handleVentaSectionKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (selectedMedio) {
        e.preventDefault()
        setSelectedMedio(null)
        setPagoConCambio('')
        setPagoMonto('')
        searchInputRef.current?.focus()
      }
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

  // ========== PANTALLA: RESULTADO ==========
  if (step === 'resultado' && resultado) {
    return (
      <div className="max-w-lg mx-auto mt-8 px-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Venta registrada</h2>
            <p className="text-sm text-gray-500 mt-1">Sucursal: {ctxSucursal?.nombre}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-5 space-y-1">
            <p className="text-4xl font-bold text-gray-900">${resultado.total.toFixed(2)}</p>
            <p className="text-sm text-gray-500">
              Venta #{resultado.ventaId} · {new Date(resultado.fecha).toLocaleString('es-AR')}
            </p>
          </div>
          {resultado.pagos && resultado.pagos.length > 0 && (
            <div className="text-left bg-gray-50 rounded-xl p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Medios de pago</h3>
              {resultado.pagos.map((p, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{p.medioPagoNombre}</span>
                  <span className="font-medium">${p.monto.toFixed(2)}</span>
                </div>
              ))}
              {resultado.cambio > 0 && (
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-green-600 font-medium">Vuelto</span>
                  <span className="font-bold text-green-600">${resultado.cambio.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
          <button onClick={nuevaVenta}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); nuevaVenta() } }}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            Nueva venta
          </button>
        </div>
      </div>
    )
  }

  // ========== PANTALLA: VENTA ==========
  return (
    <div className="flex flex-col lg:flex-row gap-6 pb-28 lg:pb-0" onKeyDown={handleVentaSectionKeyDown}>
      {/* LEFT PANEL — Product Browser */}
      <div className="flex-1 min-w-0 space-y-4">
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

        {/* Search bar — filters the product grid */}
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
            onKeyDown={(e) => {
              if (e.key === 'Tab' && !e.shiftKey && items.length > 0) {
                e.preventDefault()
                medioRefs.current[0]?.focus()
              }
              if (e.key === 'ArrowDown') {
                e.preventDefault()
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
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
            {error}
          </div>
        )}

        {/* Product Grid */}
        {productosLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-gray-500 text-sm">Cargando productos…</span>
          </div>
        ) : filteredProductos.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium text-sm">
              {searchQuery ? 'Sin resultados para esta búsqueda' : 'No hay productos disponibles'}
            </p>
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
              const cols = getComputedStyle(gridEl).gridTemplateColumns.split(' ').length

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
              }
            }}
          >
            {filteredProductos.map((p) => (
              <ProductCard key={p.id} producto={p} onAdd={agregarProducto} />
            ))}
          </div>
        )}
      </div>

      {/* RIGHT PANEL — Cart + Payment */}
      <div className="lg:w-[45%] xl:w-[40%] lg:sticky lg:top-0 lg:self-start space-y-4">
        {/* Cart card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">
              {items.length > 0 ? `Venta actual (${cantidadTotal})` : 'Nueva venta'}
            </h3>
          </div>

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
            /* Cart items */
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {items.map((i) => (
                <div key={i.producto.id} className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-b-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{i.producto.nombre}</p>
                    <p className="text-xs text-gray-400 font-mono truncate">{i.producto.codigoBarra}</p>
                    <p className="text-xs text-gray-500 mt-0.5">${i.producto.precio.toFixed(2)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCambiarCantidad(i.producto.id, i.cantidad - 1)}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors focus:ring-2 focus:ring-gray-400/30 focus:outline-none text-sm"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={1}
                      className="w-12 text-center border border-gray-200 rounded-lg px-1 py-1 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                      value={i.cantidad}
                      onChange={(e) => handleCambiarCantidad(i.producto.id, Number(e.target.value))}
                    />
                    <button
                      type="button"
                      onClick={() => handleCambiarCantidad(i.producto.id, i.cantidad + 1)}
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

          {/* Total — always visible */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-3">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment section — only when items exist */}
        {items.length > 0 && (
          <form onSubmit={handleConfirmar} className="space-y-4">
            {/* Payment method selector */}
            {mediosPago.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Medio de pago</h3>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400">
                    <kbd className="px-1 py-0.5 bg-gray-100 rounded-[3px] text-[9px] font-mono border border-gray-200">←</kbd>
                    <kbd className="px-1 py-0.5 bg-gray-100 rounded-[3px] text-[9px] font-mono border border-gray-200">→</kbd>
                    <span>navegar</span>
                  </span>
                </div>

                {/* Medio selector - grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
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
                            if (selectedMedio?.pagaVuelto) {
                              recibioInputRef.current?.focus()
                            } else {
                              confirmBtnRef.current?.focus()
                            }
                            return
                          }
                          if (idx === 0 && e.key === 'Tab' && e.shiftKey) {
                            e.preventDefault()
                            searchInputRef.current?.focus()
                            return
                          }
                          handleMedioKeyDown(e, idx)
                        }}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all focus:ring-2 focus:ring-indigo-500/30 focus:outline-none ${
                          estaSeleccionado
                            ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400/30 text-indigo-700'
                            : 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700'
                        }`}
                      >
                        {mp.nombre}
                        {estaSeleccionado && <span className="block text-[10px] text-indigo-400">seleccionado</span>}
                      </button>
                    )
                  })}
                </div>

                {selectedMedio && (
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">
                      {selectedMedio.nombre} · <strong>${total.toFixed(2)}</strong>
                    </span>
                    {selectedMedio.pagaVuelto && (
                      <div className="flex-1 min-w-[140px]">
                        <label className="block text-xs text-gray-500 mb-1">Recibió <span className="text-gray-400">(opcional)</span></label>
                        <input
                          ref={recibioInputRef}
                          type="number" step="0.01" min="0"
                          value={pagoConCambio}
                          onChange={e => setPagoConCambio(e.target.value)}
                          onKeyDown={handlePagoKeyDown}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          placeholder="0.00"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Confirm button — desktop only (mobile uses sticky bottom bar) */}
            <button
              ref={confirmBtnRef}
              type="submit"
              disabled={!cajaActiva || !esPagoCompleto()}
              className="hidden lg:block w-full px-10 py-3 rounded-xl font-semibold text-base transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-500/20 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {!cajaActiva
                ? 'Sin caja abierta'
                : !esPagoCompleto()
                  ? 'Seleccioná un medio de pago'
                  : 'Confirmar venta'}
            </button>
          </form>
        )}
      </div>

      {/* Mobile sticky bottom bar: total + confirm (below lg breakpoint) */}
      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-4 py-3 z-20">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-sm text-gray-500">{cantidadTotal} productos</span>
              <span className="text-3xl font-bold text-gray-900">${total.toFixed(2)}</span>
              {selectedMedio && (
                <span className="text-lg font-semibold text-indigo-600">
                  {selectedMedio.nombre} · ${total.toFixed(2)}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={confirmarVenta}
              disabled={!cajaActiva || !esPagoCompleto()}
              className="px-10 py-3 rounded-xl font-semibold text-base transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-500/20 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {!cajaActiva
                ? 'Sin caja abierta'
                : !esPagoCompleto()
                  ? 'Seleccioná un medio de pago'
                  : 'Confirmar venta'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== Inline Components =====

function ProductCard({ producto, onAdd }: { producto: ProductoDto; onAdd: (p: ProductoDto) => void }) {
  return (
    <button
      type="button"
      onClick={() => onAdd(producto)}
      className="bg-white rounded-xl border border-gray-200 p-3 text-left hover:border-indigo-300 hover:shadow-sm transition-all active:scale-[0.98] focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
      title={producto.nombre}
    >
      <p className="font-semibold text-gray-900 text-sm truncate">{producto.nombre}</p>
      <p className="text-lg font-bold text-indigo-600 mt-1">${producto.precio.toFixed(2)}</p>
      <span className={`inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full ${
        producto.stock === 0
          ? 'bg-red-50 text-red-500'
          : producto.stock <= 5
            ? 'bg-amber-50 text-amber-600'
            : 'bg-emerald-50 text-emerald-600'
      }`}>
        {producto.stock === 0 ? 'sin stock' : `${producto.stock} uds.`}
      </span>
    </button>
  )
}
