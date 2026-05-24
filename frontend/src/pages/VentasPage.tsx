import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import type { ProductoDto, SucursalDto, VentaResultadoDto, MedioPagoDto, PagoVentaDto } from '../types'

interface Item {
  producto: ProductoDto
  cantidad: number
}

interface PaymentEntry {
  medioPagoId: number
  medioPagoNombre: string
  monto: string
  conCambio: string
  pagaVuelto: boolean
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

  // Caja state
  const [cajaActiva, setCajaActiva] = useState<boolean | null>(null)
  const [cajaLoading, setCajaLoading] = useState(true)

  // Payment state
  const [mediosPago, setMediosPago] = useState<MedioPagoDto[]>([])
  const [pago, setPago] = useState<PaymentEntry | null>(null)

  const [query, setQuery] = useState('')
  const [sugerencias, setSugerencias] = useState<ProductoDto[]>([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [buscandoSugerencias, setBuscandoSugerencias] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const sugerenciasRef = useRef<HTMLDivElement>(null!)

  useEffect(() => {
    if (step === 'sucursal') {
      api.sucursales.listar().then(setSucursales).catch(() => {})
    }
    if (step === 'venta' && ctxSucursal) {
      // Load caja status
      setCajaLoading(true)
      api.cajas.activa(ctxSucursal.id)
        .then(res => setCajaActiva(res.activa))
        .catch(() => setCajaActiva(false))
        .finally(() => setCajaLoading(false))

      // Load medios de pago
      api.mediosPago.listar()
        .then(mp => setMediosPago(mp))
        .catch(() => {})
    }
  }, [step, ctxSucursal])

  useEffect(() => {
    if (ctxSucursal && step === 'sucursal') {
      setStep('venta')
    }
    if (!ctxSucursal && step !== 'sucursal') {
      setStep('sucursal')
    }
  }, [ctxSucursal, step])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sugerenciasRef.current && !sugerenciasRef.current.contains(e.target as Node)) {
        setMostrarSugerencias(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function seleccionarSucursal(s: SucursalDto) {
    localStorage.setItem('sucursalActiva', JSON.stringify(s))
    setStep('venta')
    // Recargar para que Layout tome la nueva sucursal
    window.location.reload()
  }

  // --- Typeahead ---
  function handleQueryChange(value: string) {
    setQuery(value)
    setMostrarSugerencias(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!value.trim()) { setSugerencias([]); setBuscandoSugerencias(false); return }
    setBuscandoSugerencias(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = ctxSucursal
          ? await api.productos.buscarParaVenta(value.trim(), ctxSucursal.id)
          : await api.productos.buscar(value.trim())
        setSugerencias(res)
      } catch { setSugerencias([]) }
      finally { setBuscandoSugerencias(false) }
    }, 200)
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
    setQuery('')
    setSugerencias([])
    setMostrarSugerencias(false)
    setTimeout(() => document.getElementById('search-producto')?.focus(), 0)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (sugerencias.length > 0) agregarProducto(sugerencias[0])
    }
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

  function getPagoDto(): PagoVentaDto | null {
    if (!pago) return null
    const monto = parseFloat(pago.monto)
    if (monto <= 0) return null
    const dto: PagoVentaDto = {
      medioPagoId: pago.medioPagoId,
      monto,
    }
    if (pago.pagaVuelto && pago.conCambio) {
      const conCambioVal = parseFloat(pago.conCambio)
      if (conCambioVal > dto.monto) {
        dto.conCambio = conCambioVal
      }
    }
    return dto
  }

  async function confirmarVenta() {
    if (!ctxSucursal || items.length === 0) return

    // Re-check caja status in case it changed (user opened it since page loaded)
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

      if (!esPagoValido()) {
        setError('Completá el monto recibido. Debe ser igual o mayor al total.')
        return
      }

      const pagoDto = getPagoDto()
      if (!pagoDto) {
        setError('Seleccioná un medio de pago primero.')
        return
      }

      const res = await api.ventas.crear({
        sucursalId: ctxSucursal.id,
        items: items.map((i) => ({ productoId: i.producto.id, cantidad: i.cantidad })),
        pagos: [pagoDto],
      })
      setResultado(res)
      setItems([])
      setPago(null)
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
    setPago(null)
    setError('')
    setStep('venta')
    setTimeout(() => document.getElementById('search-producto')?.focus(), 100)
  }

  const total = items.reduce((sum, i) => sum + i.producto.precio * i.cantidad, 0)
  const cantidadTotal = items.reduce((sum, i) => sum + i.cantidad, 0)

  function calcularVuelto(entry: PaymentEntry): number | null {
    if (!entry.pagaVuelto || !entry.conCambio) return null
    const recibido = parseFloat(entry.conCambio)
    const monto = parseFloat(entry.monto)
    if (isNaN(recibido) || isNaN(monto)) return null
    if (recibido <= monto) return null
    return recibido - monto
  }

  function esPagoValido(): boolean {
    if (!pago) return false
    if (pago.pagaVuelto) {
      const recibido = parseFloat(pago.conCambio)
      return !isNaN(recibido) && recibido > 0 && recibido >= total
    }
    return true
  }

  function handlePaymentKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      confirmarVenta()
    }
  }

  // ========== PANTALLA: SELECCIONAR SUCURSAL ==========
  if (step === 'sucursal') {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center space-y-6">
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
              <button
                key={s.id}
                onClick={() => seleccionarSucursal(s)}
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
      <div className="max-w-lg mx-auto mt-12">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center space-y-5">
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

          {/* Payment breakdown */}
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

          <button
            onClick={nuevaVenta}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors w-full"
          >
            Nueva venta
          </button>
        </div>
      </div>
    )
  }

  // ========== PANTALLA: VENTA ==========
  return (
    <div className="space-y-5">
      {/* Sucursal activa (solo info) */}
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

      {/* Caja loading / warning */}
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
            <p className="text-xs mt-0.5">Andá a la sección Caja para abrir una. Sin caja abierta no se pueden registrar ventas.</p>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="relative" ref={sugerenciasRef}>
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            id="search-producto"
            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-xl shadow-sm text-base placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            placeholder="Buscá producto por código de barra o nombre…"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => query.trim() && setMostrarSugerencias(true)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          {buscandoSugerencias && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {mostrarSugerencias && sugerencias.length > 0 && (
          <div className="absolute z-10 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-72 overflow-y-auto">
            {sugerencias.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => agregarProducto(p)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-indigo-50 border-b border-gray-100 last:border-0 flex items-center gap-3 transition-colors"
              >
                <span className="font-mono text-xs text-gray-400 w-28 truncate">{p.codigoBarra}</span>
                <span className="flex-1 font-medium text-gray-800 truncate">{p.nombre}</span>
                <span className="font-semibold text-gray-900">${p.precio.toFixed(2)}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  p.stock === 0
                    ? 'bg-red-50 text-red-500'
                    : p.stock <= 5
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {p.stock === 0 ? 'sin stock' : `${p.stock} uds.`}
                </span>
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

      {/* Items */}
      {items.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3 w-32">Cantidad</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((i) => (
                  <tr key={i.producto.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 text-sm">{i.producto.nombre}</p>
                      <p className="text-xs text-gray-400 font-mono">{i.producto.codigoBarra}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      ${i.producto.precio.toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleCambiarCantidad(i.producto.id, i.cantidad - 1)}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                        >−</button>
                        <input
                          type="number"
                          min={1}
                          className="w-14 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          value={i.cantidad}
                          onChange={(e) => handleCambiarCantidad(i.producto.id, Number(e.target.value))}
                        />
                        <button
                          type="button"
                          onClick={() => handleCambiarCantidad(i.producto.id, i.cantidad + 1)}
                          className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors"
                        >+</button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900">
                      ${(i.producto.precio * i.cantidad).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => quitarItem(i.producto.id)}
                        className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payment + Total */}
      {items.length > 0 && (
        <form onSubmit={handleConfirmar}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4"
        >
          {/* Payment method — single selection */}
          {mediosPago.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Medio de pago</h3>
              <div className="space-y-1.5">
                {mediosPago.map(mp => {
                  const isSelected = pago?.medioPagoId === mp.id
                  return (
                    <label
                      key={mp.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-400/30'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="medioPago"
                        checked={isSelected}
                        onChange={() => {
                          setPago({
                            medioPagoId: mp.id,
                            medioPagoNombre: mp.nombre,
                            monto: total.toFixed(2),
                            conCambio: '',
                            pagaVuelto: mp.pagaVuelto,
                          })
                        }}
                        className="accent-indigo-600"
                      />
                      <span className="text-sm font-medium text-gray-800">{mp.nombre}</span>

                      {isSelected && !mp.pagaVuelto && (
                        <span className="ml-auto text-sm text-gray-500">${total.toFixed(2)}</span>
                      )}

                      {isSelected && mp.pagaVuelto && (
                        <div className="ml-auto flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">recibe:</span>
                            <input
                              type="number" step="0.01" min="0"
                              value={pago!.conCambio}
                              onChange={e => setPago({ ...pago!, conCambio: e.target.value })}
                              onKeyDown={handlePaymentKeyDown}
                              className={`w-24 px-2 py-1 border rounded text-sm text-right ${
                                pago!.conCambio && parseFloat(pago!.conCambio) < total
                                  ? 'border-red-300 bg-red-50'
                                  : 'border-gray-300'
                              }`}
                              placeholder="0.00"
                              autoFocus
                              onClick={e => e.stopPropagation()}
                            />
                            {(() => {
                              const vuelto = calcularVuelto(pago!)
                              return vuelto !== null ? (
                                <span className="text-green-600 font-bold text-sm whitespace-nowrap">
                                  Vuelto: ${vuelto.toFixed(2)}
                                </span>
                              ) : null
                            })()}
                          </div>
                          {pago!.conCambio && (() => {
                            const recibido = parseFloat(pago!.conCambio)
                            if (!isNaN(recibido) && recibido > 0 && recibido < total) {
                              return (
                                <p className="text-xs text-red-500">
                                  Faltan ${(total - recibido).toFixed(2)}
                                </p>
                              )
                            }
                            return null
                          })()}
                        </div>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{cantidadTotal} productos</p>
              <p className="text-3xl font-bold text-gray-900">${total.toFixed(2)}</p>
            </div>
            <button
              type="submit"
              disabled={!cajaActiva || !esPagoValido()}
              className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold text-base hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {!cajaActiva
                ? 'Sin caja abierta'
                : !pago
                  ? 'Seleccioná un medio de pago'
                  : 'Confirmar venta'}
            </button>
          </div>
        </form>
      )}

      {/* Empty */}
      {items.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">Buscá productos para armar la venta</p>
          <p className="text-sm text-gray-400 mt-1">Escribí el código de barra o nombre del producto</p>
        </div>
      )}
    </div>
  )
}
