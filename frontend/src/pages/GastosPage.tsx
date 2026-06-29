import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import type { SucursalDto, GastoDto, CajaDto, CategoriaGastoDto } from '../types'
import { formatCurrency, formatDate } from '../formats'
import PageHeader from '../components/ui/PageHeader'
import AlertBanner from '../components/ui/AlertBanner'
import { Clock } from 'lucide-react'
import Card from '../components/ui/Card'
import Spinner from '../components/ui/Spinner'

// ── Helpers ──────────────────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm ' +
  'focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all'

const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

// ── Component ────────────────────────────────────────────────────────

export default function GastosPage() {
  const { sucursal } = useOutletContext<{ sucursal: SucursalDto | null }>()
  const [cajaActiva, setCajaActiva] = useState<CajaDto | null>(null)
  const [gastos, setGastos] = useState<GastoDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [historial, setHistorial] = useState<GastoDto[]>([])
  const [historialLoading, setHistorialLoading] = useState(false)
  const [busquedaHistorial, setBusquedaHistorial] = useState('')
  const [ordenarPor, setOrdenarPor] = useState<'fecha' | 'detalle' | 'usuario' | 'monto' | null>(null)
  const [ordenDir, setOrdenDir] = useState<'asc' | 'desc'>('desc')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  const toggleOrden = (campo: 'fecha' | 'detalle' | 'usuario' | 'monto') => {
    if (ordenarPor !== campo) {
      setOrdenarPor(campo)
      setOrdenDir('asc')
    } else if (ordenDir === 'asc') {
      setOrdenDir('desc')
    } else {
      setOrdenarPor(null)
    }
  }

  const historialFiltrado = useMemo(() => {
    let lista = busquedaHistorial.trim()
      ? historial.filter(g => {
          const q = busquedaHistorial.toLowerCase()
          return g.detalle.toLowerCase().includes(q) ||
            g.monto.toString().includes(q) ||
            formatDate(g.fecha).toLowerCase().includes(q)
        })
      : [...historial]
    if (ordenarPor) {
      lista.sort((a, b) => {
        let cmp = 0
        if (ordenarPor === 'fecha') cmp = a.fecha.localeCompare(b.fecha)
        else if (ordenarPor === 'detalle') cmp = a.detalle.localeCompare(b.detalle)
        else if (ordenarPor === 'usuario') cmp = (a.usuarioNombre || '').localeCompare(b.usuarioNombre || '')
        else cmp = a.monto - b.monto
        return ordenDir === 'asc' ? cmp : -cmp
      })
    }
    return lista
  }, [historial, busquedaHistorial, ordenarPor, ordenDir])

  // Form state
  const [monto, setMonto] = useState('')
  const [detalle, setDetalle] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [fuenteGasto, setFuenteGasto] = useState<'caja' | 'ahorro' | 'dividir'>('caja')
  const [montoCaja, setMontoCaja] = useState(0)
  const [montoAhorro, setMontoAhorro] = useState(0)
  const [undoGastoId, setUndoGastoId] = useState<number | null>(null)
  const [undoLoading, setUndoLoading] = useState(false)
  const montoRef = useRef<HTMLInputElement>(null)
  const detalleRef = useRef<HTMLInputElement>(null)
  const fuenteRef = useRef<HTMLDivElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)
  const [categorias, setCategorias] = useState<CategoriaGastoDto[]>([])
  const [catSearch, setCatSearch] = useState('')
  const [showCatDropdown, setShowCatDropdown] = useState(false)
  const [creandoCat, setCreandoCat] = useState(false)
  const [catHighIdx, setCatHighIdx] = useState(-1)

  const categoriasFiltradas = useMemo(() => {
    if (!catSearch.trim()) return categorias
    const q = catSearch.toLowerCase()
    return categorias.filter(c => c.descripcion.toLowerCase().includes(q))
  }, [categorias, catSearch])

  const catExactMatch = useMemo(() =>
    catSearch.trim() && !categorias.some(c => c.descripcion.toLowerCase() === catSearch.trim().toLowerCase()),
    [categorias, catSearch]
  )

  const loadData = useCallback(async () => {
    if (!sucursal) return
    setLoading(true)
    setError('')
    try {
      const res = await api.cajas.activa(sucursal.id)
      if (res.activa && res.caja) {
        setCajaActiva(res.caja)
        const gastosRes = await api.gastos.listar(res.caja.id)
        setGastos(gastosRes.items)
        // Load historial excluding current caja
        setHistorialLoading(true)
        try {
          const histRes = await api.gastos.historial(res.caja.id, fechaDesde || undefined, fechaHasta || undefined)
          setHistorial(histRes.items)
        } catch { setHistorial([]) }
        finally { setHistorialLoading(false) }
      } else {
        setCajaActiva(null)
        setGastos([])
        // Load all gastos as historial
        setHistorialLoading(true)
        try {
          const histRes = await api.gastos.historial(undefined, fechaDesde || undefined, fechaHasta || undefined)
          setHistorial(histRes.items)
        } catch { setHistorial([]) }
        finally { setHistorialLoading(false) }
      }
    } catch (err: any) {
      setError(err.message || 'Error al cargar gastos')
    } finally {
      setLoading(false)
    }
  }, [sucursal, fechaDesde, fechaHasta])

  useEffect(() => { loadData() }, [loadData])

  // Load categories
  useEffect(() => {
    api.categoriasGasto.listar().then(r => setCategorias(r.items)).catch(() => {})
  }, [])

  async function handleUndoGasto() {
    if (undoGastoId === null) return
    setUndoLoading(true)
    try {
      await api.gastos.anular(undoGastoId)
      setSuccess('Gasto anulado')
      setUndoGastoId(null)
      loadData()
    } catch (err: any) {
      setError(err.message || 'Error al anular gasto')
    } finally {
      setUndoLoading(false)
    }
  }

  async function handleCrearCategoria(nombre: string) {
    if (!nombre.trim()) return
    setCreandoCat(true)
    try {
      const cat = await api.categoriasGasto.crear(nombre.trim())
      setCategorias(prev => [...prev, cat])
      setDetalle(cat.descripcion)
      setCatSearch('')
      setShowCatDropdown(false)
    } catch (err: any) {
      setFormError(err.message || 'Error al crear categoría')
    } finally {
      setCreandoCat(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const montoNum = parseFloat(monto)
    if (isNaN(montoNum) || montoNum <= 0) {
      setFormError('El monto debe ser un número positivo')
      return
    }
    if (!detalle.trim()) {
      setFormError('El detalle es requerido')
      return
    }
    if (detalle.trim().length > 500) {
      setFormError('El detalle no puede superar los 500 caracteres')
      return
    }

      setSubmitting(true)
    try {
      if (fuenteGasto === 'dividir' && (montoCaja + montoAhorro) > montoNum) {
        setFormError('La suma de Caja + Ahorro no puede superar el monto total')
        setSubmitting(false)
        return
      }
      await api.gastos.crear({
        monto: montoNum,
        detalle: detalle.trim(),
        fuentePago: fuenteGasto,
        montoPagadoCaja: fuenteGasto === 'dividir' ? montoCaja : undefined,
      })
      setMonto('')
      setDetalle('')
      setCatSearch('')
      setMontoCaja(0)
      setMontoAhorro(0)
      setFuenteGasto('caja')
      setSuccess('Gasto registrado correctamente')
      if (cajaActiva) {
        const gastosRes = await api.gastos.listar(cajaActiva.id)
        setGastos(gastosRes.items)
        // Refresh historial silently (don't break on failure)
        api.gastos.historial(cajaActiva.id, fechaDesde || undefined, fechaHasta || undefined).then(h => setHistorial(h.items)).catch(() => {})
      }
    } catch (err: any) {
      setFormError(err.message || 'Error al registrar gasto')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <PageHeader
        title="Gastos"
        subtitle={cajaActiva ? `${gastos.length} gastos registrados` : undefined}
      />

      {error && (
        <AlertBanner variant="error" message={error} onClose={() => setError('')} />
      )}

      {success && (
        <AlertBanner variant="success" message={success} onClose={() => setSuccess('')} />
      )}

      {loading ? (
        <Spinner text="Cargando gastos..." />
      ) : !cajaActiva ? (
        <Card padding="lg" className="text-center">
          <div className="py-6">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Clock size={32} strokeWidth={1.5} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No hay caja abierta</p>
            <p className="text-sm text-gray-400 mt-1">Abrí una caja para registrar gastos</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Form section ──────────────────────────────────────── */}
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Nuevo gasto</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className={labelClass}>Monto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-mono">$</span>
                  <input
                    ref={montoRef}
                    type="number" step="0.01" min="0.01"
                    value={monto}
                    onChange={e => setMonto(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); detalleRef.current?.focus() } }}
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Detalle</label>
                <div className="relative">
                  <input
                    ref={detalleRef}
                    type="text"
                    value={catSearch}
                    onChange={e => { setCatSearch(e.target.value); setDetalle(e.target.value); setShowCatDropdown(true); setCatHighIdx(-1) }}
                    onFocus={() => { setShowCatDropdown(true); setCatHighIdx(-1) }}
                    onBlur={() => setTimeout(() => setShowCatDropdown(false), 150)}
                    onKeyDown={e => {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault()
                        setShowCatDropdown(true)
                        const total = categoriasFiltradas.length + (catExactMatch ? 1 : 0)
                        setCatHighIdx(i => Math.min(i + 1, total - 1))
                        return
                      }
                      if (e.key === 'ArrowUp') {
                        e.preventDefault()
                        setCatHighIdx(i => Math.max(i - 1, -1))
                        return
                      }
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        if (showCatDropdown && catHighIdx >= 0) {
                          if (catHighIdx < categoriasFiltradas.length) {
                            const c = categoriasFiltradas[catHighIdx]
                            setDetalle(c.descripcion)
                            setCatSearch(c.descripcion)
                          } else {
                            handleCrearCategoria(catSearch)
                          }
                          setShowCatDropdown(false)
                          setCatHighIdx(-1)
                        } else if (showCatDropdown) {
                          const match = categorias.find(c => c.descripcion.toLowerCase() === catSearch.trim().toLowerCase())
                          if (match) {
                            setDetalle(match.descripcion)
                            setCatSearch(match.descripcion)
                          } else if (catSearch.trim()) {
                            handleCrearCategoria(catSearch)
                          }
                          setShowCatDropdown(false)
                          setCatHighIdx(-1)
                        } else {
                          fuenteRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
                        }
                      }
                    }}
                    placeholder="Buscar o crear categoría..."
                    className={inputClass}
                    required
                  />
                  {showCatDropdown && (
                    <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto text-xs">
                      {categoriasFiltradas.map((c, i) => (
                        <li key={c.id}
                          onMouseDown={() => { setDetalle(c.descripcion); setCatSearch(c.descripcion); setShowCatDropdown(false); setCatHighIdx(-1) }}
                          onMouseEnter={() => setCatHighIdx(i)}
                          className={`px-3 py-1.5 cursor-pointer ${i === catHighIdx ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-gray-100'} ${detalle === c.descripcion ? 'font-medium' : ''}`}>
                          {c.descripcion}
                        </li>
                      ))}
                      {catExactMatch && (
                        <li onMouseDown={() => handleCrearCategoria(catSearch)}
                          onMouseEnter={() => setCatHighIdx(categoriasFiltradas.length)}
                          className={`px-3 py-1.5 cursor-pointer border-t border-gray-100 ${catHighIdx === categoriasFiltradas.length ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-indigo-50 text-indigo-600'}`}>
                          + Crear "{catSearch.trim()}"
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              </div>

              {/* Fuente selector */}
              <div>
                <label className={labelClass}>Fuente</label>
                <div ref={fuenteRef} className="flex rounded-lg border border-gray-300 overflow-hidden">
                  {(['caja', 'ahorro', 'dividir'] as const).map(f => (
                    <button key={f} type="button" onClick={() => setFuenteGasto(f)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); submitRef.current?.focus() } }}
                      className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                        fuenteGasto === f
                          ? f === 'caja' ? 'bg-indigo-500 text-white'
                          : f === 'ahorro' ? 'bg-emerald-500 text-white'
                          : 'bg-amber-500 text-white'
                          : 'bg-white text-gray-500 hover:bg-gray-100'
                      }`}>
                      {f === 'caja' ? '💵 Caja' : f === 'ahorro' ? '🏦 Ahorro' : '↔ Dividir'}
                    </button>
                  ))}
                </div>
              </div>

              {fuenteGasto === 'dividir' && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-indigo-500 font-medium">$ Caja</span>
                      <input type="number" min={0} step="0.01"
                        value={montoCaja || ''} onChange={e => setMontoCaja(parseFloat(e.target.value) || 0)}
                        className="w-full pl-14 pr-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        placeholder="0.00" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-emerald-500 font-medium">$ Ahorro</span>
                      <input type="number" min={0} step="0.01"
                        value={montoAhorro || ''} onChange={e => setMontoAhorro(parseFloat(e.target.value) || 0)}
                        className="w-full pl-16 pr-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                        placeholder="0.00" />
                    </div>
                  </div>
                </div>
              )}

              {formError && (
                <AlertBanner variant="error" message={formError} />
              )}

              <button
                ref={submitRef}
                type="submit"
                disabled={submitting}
                onKeyDown={e => { if (e.key === 'Enter' && !submitting) { e.preventDefault(); handleSubmit(e as any); setTimeout(() => montoRef.current?.focus(), 100) } }}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Registrando...' : 'Registrar gasto'}
              </button>
            </form>
          </Card>

          {/* ── List section ──────────────────────────────────────── */}
          <Card padding="lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Gastos registrados ({gastos.length})
            </h3>

            {gastos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No hay gastos registrados</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      <th className="pb-2 pr-3">Fecha</th>
                      <th className="pb-2 pr-3">Usuario</th>
                      <th className="pb-2 pr-3 text-right">Monto</th>
                      <th className="pb-2">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {gastos.map(g => (
                      <tr key={g.id} className={`hover:bg-gray-100/80 hover:ring-1 hover:ring-gray-300 hover:ring-inset transition-all ${g.anulado ? 'bg-red-50/30' : ''}`}>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          <span className={g.anulado ? 'line-through text-gray-400 text-xs' : 'text-gray-600 text-xs'}>{formatDate(g.fecha)}</span>
                        </td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          <span className={g.anulado ? 'line-through text-gray-400 text-xs' : 'text-gray-500 text-xs'}>{g.usuarioNombre || '-'}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-right font-medium">
                          <span className={g.anulado ? 'line-through text-gray-400 text-xs' : 'text-xs'}>{formatCurrency(g.monto)}</span>
                        </td>
                        <td className="py-2.5 text-gray-700 flex items-center justify-between gap-4">
                          <span className={g.anulado ? 'line-through text-gray-400' : ''}>{g.detalle}</span>
                          {g.anulado ? (
                            <span className="text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">Anulado</span>
                          ) : (
                            <button onClick={() => setUndoGastoId(g.id)}
                              className="text-[10px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap">
                              Deshacer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Historial section ─────────────────────────────────────── */}
      {!loading && (
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-900">
              Historial de gastos{historial.length > 0 ? ` (${historial.length})` : ''}
            </h3>
            {historial.length > 0 && (
              <input
                type="text"
                value={busquedaHistorial}
                onChange={e => setBusquedaHistorial(e.target.value)}
                placeholder="Buscar..."
                className="w-48 px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all shadow-sm"
              />
            )}
            <div className="flex items-center gap-2 text-xs">
              <label className="text-gray-500">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
              />
              <label className="text-gray-500">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none"
              />
              {(fechaDesde || fechaHasta) && (
                <button
                  onClick={() => { setFechaDesde(''); setFechaHasta(''); }}
                  className="text-gray-400 hover:text-gray-600 px-1"
                  title="Limpiar filtro de fechas"
                >✕</button>
              )}
            </div>
          </div>
          {historialLoading ? (
            <Spinner text="Cargando historial..." />
          ) : historial.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No hay gastos anteriores</p>
          ) : historialFiltrado.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">Sin resultados para "{busquedaHistorial}"</p>
          ) : (
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <th className="pb-2 pr-3 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleOrden('fecha')}>
                      Fecha{ordenarPor === 'fecha' ? (ordenDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                    <th className="pb-2 pr-3 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleOrden('usuario')}>
                      Usuario{ordenarPor === 'usuario' ? (ordenDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                    <th className="pb-2 pr-3 text-right cursor-pointer select-none hover:text-gray-700" onClick={() => toggleOrden('monto')}>
                      Monto{ordenarPor === 'monto' ? (ordenDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                    <th className="pb-2 cursor-pointer select-none hover:text-gray-700" onClick={() => toggleOrden('detalle')}>
                      Detalle{ordenarPor === 'detalle' ? (ordenDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {historialFiltrado.map(g => (
                    <tr key={g.id} className={`hover:bg-gray-100/80 hover:ring-1 hover:ring-gray-300 hover:ring-inset transition-all ${g.anulado ? 'bg-red-50/30' : ''}`}>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        <span className={g.anulado ? 'line-through text-gray-400 text-xs' : 'text-gray-600 text-xs'}>{formatDate(g.fecha)}</span>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap">
                        <span className={g.anulado ? 'line-through text-gray-400 text-xs' : 'text-gray-500 text-xs'}>{g.usuarioNombre || '-'}</span>
                      </td>
                      <td className="py-2.5 pr-3 text-right font-medium">
                        <span className={g.anulado ? 'line-through text-gray-400 text-xs' : 'text-xs'}>{formatCurrency(g.monto)}</span>
                      </td>
                      <td className="py-2.5 text-gray-700 flex items-center justify-between gap-4">
                        <span className={g.anulado ? 'line-through text-gray-400' : ''}>{g.detalle}</span>
                        {g.anulado ? (
                          <span className="text-[10px] font-medium text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full whitespace-nowrap">Anulado</span>
                        ) : (
                          <button onClick={() => setUndoGastoId(g.id)}
                            className="text-[10px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap">
                            Deshacer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Undo confirmation modal */}
      {undoGastoId !== null && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
             onClick={() => setUndoGastoId(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full"
               onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Anular gasto</h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Anular el gasto #{undoGastoId}? Quedará marcado como anulado en el historial.
            </p>
            <div className="flex gap-3">
              <button onClick={handleUndoGasto} disabled={undoLoading}
                className="flex-1 py-2.5 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors text-sm">
                {undoLoading ? 'Anulando...' : 'Anular gasto'}
              </button>
              <button onClick={() => setUndoGastoId(null)}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
