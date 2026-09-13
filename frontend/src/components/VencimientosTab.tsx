import { useEffect, useMemo, useState } from 'react'
import { BellRing, CalendarClock } from 'lucide-react'
import { api } from '../api/client'
import type { ProductoDto } from '../types'
import ProductFormModal from './ProductFormModal'
import Card from './ui/Card'
import Checkbox from './ui/Checkbox'

const DEFAULT_DIAS_ANTICIPACION = 7

export default function VencimientosTab({ notifyError }: { notifyError: (msg: string) => void }) {
  const [diasAnticipacion, setDiasAnticipacion] = useState(String(DEFAULT_DIAS_ANTICIPACION))
  const [avisoHabilitado, setAvisoHabilitado] = useState(false)
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [productoEditando, setProductoEditando] = useState<ProductoDto | null>(null)

  useEffect(() => {
    Promise.all([api.preferencias.obtener(), api.productos.listar()])
      .then(([preferencias, lista]) => {
        const valor = preferencias.preferencias?.vencimientos?.diasAnticipacion
        if (valor && Number(valor) > 0) setDiasAnticipacion(valor)
        setAvisoHabilitado(preferencias.preferencias?.vencimientos?.habilitado === 'true')
        setProductos(lista.filter(producto => !producto.esBulto))
      })
      .catch(() => notifyError('No se pudo cargar la configuración de vencimientos'))
  }, [notifyError])

  const dias = Math.max(1, Number(diasAnticipacion) || DEFAULT_DIAS_ANTICIPACION)
  const proximos = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const limite = new Date(hoy)
    limite.setDate(limite.getDate() + dias)

    return productos
      .filter(producto => producto.seguirVencimientos)
      .flatMap(producto => (producto.fechasVencimiento ?? []).map(fecha => ({ producto, fecha })))
      .filter(item => new Date(`${item.fecha.slice(0, 10)}T00:00:00`) <= limite)
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
  }, [productos, dias])
  const hoy = new Date(new Date().setHours(0, 0, 0, 0))
  const vencidos = proximos.filter(item => new Date(`${item.fecha.slice(0, 10)}T00:00:00`) < hoy)
  const porVencer = proximos.filter(item => new Date(`${item.fecha.slice(0, 10)}T00:00:00`) >= hoy)

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

  return (
    <div>
      <Card padding="lg">
        <div className="flex items-start gap-3 mb-5">
          <BellRing size={21} className="mt-0.5 shrink-0 text-indigo-600" />
          <div>
            <h2 className="text-lg font-bold text-gray-900">Control de vencimientos</h2>
            <p className="mt-0.5 text-sm text-gray-500">Configurá los avisos y revisá los productos que requieren atención.</p>
          </div>
        </div>

        <div className="mb-5 rounded-xl bg-slate-50 p-4">
          <Checkbox
            checked={avisoHabilitado}
            onChange={habilitado => void guardarConfiguracion(dias, habilitado)}
            label="Aviso en la barra superior"
            description="Muestra un acceso directo cuando haya productos para revisar."
          />
          <label className="mt-4 block max-w-xs text-sm font-medium text-slate-700">
            Días de anticipación
            <input type="number" min="1" max="365" value={diasAnticipacion} onChange={event => setDiasAnticipacion(event.target.value)}
              onBlur={() => void guardarConfiguracion()}
              className="mt-1 block w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-amber-50 p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{porVencer.length}</p>
            <p className="text-xs font-medium text-amber-700">Próximos a vencer</p>
          </div>
          <div className="rounded-xl bg-red-50 p-4 text-center">
            <p className="text-2xl font-bold text-red-700">{vencidos.length}</p>
            <p className="text-xs font-medium text-red-700">Vencidos</p>
          </div>
        </div>
      </Card>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card padding="lg" className="border-amber-200 bg-amber-50/40">
          <div className="flex items-start gap-3">
            <CalendarClock size={21} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <h3 className="font-semibold text-amber-900">Productos para revisar</h3>
              <p className="mt-0.5 text-sm text-amber-800">Vencen dentro de los próximos {dias} días.</p>
            </div>
          </div>
          {porVencer.length === 0 ? (
            <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm text-gray-500">No hay productos próximos a vencer.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {porVencer.map(({ producto, fecha }) => (
                <button key={`${producto.id}-${fecha}`} type="button" onClick={() => setProductoEditando(producto)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-left text-sm transition-colors hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-amber-500">
                  <span className="font-medium text-gray-800">{producto.nombre}</span>
                  <span className="font-medium text-amber-700">Vence: {new Date(`${fecha.slice(0, 10)}T00:00:00`).toLocaleDateString('es-AR')}</span>
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card padding="lg" className="border-red-200 bg-red-50/40">
          <div className="flex items-start gap-3">
            <CalendarClock size={21} className="mt-0.5 shrink-0 text-red-700" />
            <div>
              <h3 className="font-semibold text-red-900">Productos vencidos</h3>
              <p className="mt-0.5 text-sm text-red-800">Retiralos de la venta y eliminá su fecha al revisarlos.</p>
            </div>
          </div>
          {vencidos.length === 0 ? (
            <p className="mt-4 rounded-lg bg-white px-3 py-2 text-sm text-gray-500">No hay productos vencidos.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {vencidos.map(({ producto, fecha }) => (
                <button key={`${producto.id}-${fecha}`} type="button" onClick={() => setProductoEditando(producto)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 text-left text-sm transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500">
                  <span className="font-medium text-gray-800">{producto.nombre}</span>
                  <span className="font-semibold text-red-600">Venció: {new Date(`${fecha.slice(0, 10)}T00:00:00`).toLocaleDateString('es-AR')}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </section>

      <ProductFormModal
        open={productoEditando !== null}
        openContext="edit"
        editingProduct={productoEditando}
        onCreated={actualizado => {
          setProductos(actuales => actuales.map(producto => producto.id === actualizado.id ? actualizado : producto))
          setProductoEditando(null)
        }}
        onClose={() => setProductoEditando(null)}
      />

    </div>
  )
}
