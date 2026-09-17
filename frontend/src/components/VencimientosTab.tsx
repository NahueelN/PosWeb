import { useEffect, useMemo, useState } from 'react'
import { BellRing, Search } from 'lucide-react'
import { api } from '../api/client'
import type { ProductoDto } from '../types'
import Card from './ui/Card'
import Checkbox from './ui/Checkbox'
import VencimientosProductoModal from './VencimientosProductoModal'
import { normalizarCodigoBarra } from '../lib/codigoBarra'

const DEFAULT_DIAS_ANTICIPACION = 7
const MIN_BUSQUEDA = 3

type FiltroEstado = 'todos' | 'proximos' | 'vencidos'

export default function VencimientosTab({ notifyError }: { notifyError: (msg: string) => void }) {
  const [diasAnticipacion, setDiasAnticipacion] = useState(String(DEFAULT_DIAS_ANTICIPACION))
  const [avisoHabilitado, setAvisoHabilitado] = useState(false)
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [productoEditando, setProductoEditando] = useState<ProductoDto | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<FiltroEstado>('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.preferencias.obtener(), api.productos.listar()])
      .then(([preferencias, lista]) => {
        const valor = preferencias.preferencias?.vencimientos?.diasAnticipacion
        if (valor && Number(valor) > 0) setDiasAnticipacion(valor)
        setAvisoHabilitado(preferencias.preferencias?.vencimientos?.habilitado === 'true')
        setProductos(lista.filter(producto => !producto.esBulto))
      })
      .catch(() => notifyError('No se pudo cargar la configuración de vencimientos'))
      .finally(() => setLoading(false))
  }, [notifyError])

  const dias = Math.max(1, Number(diasAnticipacion) || DEFAULT_DIAS_ANTICIPACION)

  const evaluados = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const limite = new Date(hoy)
    limite.setDate(limite.getDate() + dias)

    return productos.map(producto => {
      const fechas = [...(producto.fechasVencimiento ?? [])].sort()
      const proxima = fechas[0] ?? null
      const vencimiento = proxima ? new Date(`${proxima.slice(0, 10)}T00:00:00`) : null
      const vencido = !!vencimiento && vencimiento < hoy
      const porVencer = !!vencimiento && !vencido && vencimiento <= limite
      return { producto, proxima, vencido, porVencer }
    })
  }, [productos, dias])

  const totalVencidos = evaluados.filter(e => e.producto.seguirVencimientos && e.vencido).length
  const totalPorVencer = evaluados.filter(e => e.producto.seguirVencimientos && e.porVencer).length

  const resultados = useMemo(() => {
    let list = evaluados
    if (filtro === 'vencidos') {
      list = list.filter(e => e.producto.seguirVencimientos && e.vencido)
    } else if (filtro === 'proximos') {
      list = list.filter(e => e.producto.seguirVencimientos && e.porVencer)
    }

    const q = busqueda.trim().toLowerCase()
    if (q.length >= MIN_BUSQUEDA) {
      const normalizado = normalizarCodigoBarra(busqueda).toLowerCase()
      list = list.filter(e => {
        const p = e.producto
        return p.nombre.toLowerCase().includes(q) ||
          (p.codigoBarra ?? '').toLowerCase().includes(q) ||
          (p.codigoProducto ?? '').toLowerCase().includes(q) ||
          ((p.codigoBarra ?? '').trim() !== '' && normalizarCodigoBarra(p.codigoBarra).toLowerCase() === normalizado)
      })
    }

    return [...list].sort((a, b) => {
      if (a.proxima && b.proxima) return a.proxima.localeCompare(b.proxima)
      if (a.proxima) return -1
      if (b.proxima) return 1
      return a.producto.nombre.localeCompare(b.producto.nombre)
    })
  }, [evaluados, busqueda, filtro])

  async function guardarConfiguracion(diasAguardar = dias, habilitado = avisoHabilitado) {
    if (!Number.isInteger(diasAguardar) || diasAguardar < 1 || diasAguardar > 365) {
      notifyError('Ingresá entre 1 y 365 días de anticipación')
      return
    }
    try {
      await api.preferencias.guardar({ vencimientos: { diasAnticipacion: String(diasAguardar), habilitado: String(habilitado) } })
      setDiasAnticipacion(String(diasAguardar))
      setAvisoHabilitado(habilitado)
      window.dispatchEvent(new Event('vencimientos:configuracion'))
    } catch {
      notifyError('No se pudo guardar el aviso de vencimientos')
    }
  }

  function actualizarProducto(actualizado: ProductoDto) {
    setProductos(actuales => actuales.map(p => p.id === actualizado.id ? actualizado : p))
    setProductoEditando(null)
  }

  const filtros: { id: FiltroEstado; label: string; count?: number }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'proximos', label: 'Próximos a vencer', count: totalPorVencer },
    { id: 'vencidos', label: 'Vencidos', count: totalVencidos },
  ]

  return (
    <div>
      <Card padding="lg" strongBorder>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div className="flex items-center gap-2">
            <BellRing size={20} className="shrink-0 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Notificación de vencimientos</h2>
          </div>

          <div className="ml-auto flex items-center gap-5">
            <Checkbox
              labelPosition="left"
              checked={avisoHabilitado}
              onChange={habilitado => void guardarConfiguracion(dias, habilitado)}
              label="Mostrar en barra superior"
            />
            <input type="number" min="1" max="365" value={diasAnticipacion} onChange={event => setDiasAnticipacion(event.target.value)}
              onBlur={() => void guardarConfiguracion()}
              aria-label="Días de anticipación"
              className="w-20 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-center text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]" />
            <span className="text-sm font-medium text-gray-700">días antes</span>
          </div>
        </div>
      </Card>

      <Card padding="lg" className="mt-6" strongBorder>
        <div className="flex flex-wrap items-end gap-3 mb-4">
          <div className="relative min-w-[260px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={busqueda} onChange={event => setBusqueda(event.target.value)}
              autoFocus
              placeholder="Buscar producto por nombre o código de barras..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-ring)]" />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {filtros.map(f => {
              const active = filtro === f.id
              return (
                <button key={f.id} type="button" onClick={() => setFiltro(f.id)}
                  className={[
                    'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-150',
                    active ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700',
                  ].join(' ')}>
                  {f.label}
                  {f.count !== undefined && f.count > 0 && (
                    <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums">{f.count}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Cargando productos...</p>
        ) : resultados.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            {busqueda.trim().length > 0 && busqueda.trim().length < MIN_BUSQUEDA
              ? `Escribí al menos ${MIN_BUSQUEDA} letras para buscar`
              : filtro === 'vencidos' ? 'No hay productos vencidos'
                : filtro === 'proximos' ? 'No hay productos próximos a vencer'
                  : 'Sin resultados'}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="grid grid-cols-[120px_minmax(0,1fr)_160px_110px] items-center gap-x-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              <span className="truncate">Código</span>
              <span className="truncate">Producto</span>
              <span className="text-right truncate">Próximo vencimiento</span>
              <span className="text-right truncate">Estado</span>
            </div>
            {resultados.map(({ producto, proxima, vencido, porVencer }) => (
              <button
                key={producto.id}
                type="button"
                onClick={() => setProductoEditando(producto)}
                className={[
                  'grid grid-cols-[120px_minmax(0,1fr)_160px_110px] items-center gap-x-2',
                  'w-full rounded-lg border bg-white px-3 py-2 text-left transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)]',
                  producto.seguirVencimientos && vencido
                    ? 'border-red-400 hover:bg-red-50/60 hover:border-red-500'
                    : producto.seguirVencimientos && porVencer
                      ? 'border-amber-400 hover:bg-amber-50/60 hover:border-amber-500'
                      : 'border-gray-400 hover:bg-indigo-50/50 hover:border-indigo-300',
                ].join(' ')}
              >
                <span className="truncate font-mono text-[12px] text-gray-500">{producto.codigoBarra || producto.codigoProducto || ''}</span>
                <span className="truncate font-medium text-gray-900">{producto.nombre}</span>
                <span className="text-right font-mono text-sm tabular-nums text-gray-600">
                  {proxima ? new Date(`${proxima.slice(0, 10)}T00:00:00`).toLocaleDateString('es-AR') : '—'}
                </span>
                <span className="flex justify-end">
                  {!producto.seguirVencimientos
                    ? <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">Sin control</span>
                    : vencido
                      ? <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">Vencido</span>
                      : porVencer
                        ? <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Por vencer</span>
                        : <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">Al día</span>}
                </span>
              </button>
            ))}
          </div>
        )}
      </Card>

      {productoEditando && (
        <VencimientosProductoModal
          producto={productoEditando}
          onSaved={actualizarProducto}
          onClose={() => setProductoEditando(null)}
        />
      )}
    </div>
  )
}
