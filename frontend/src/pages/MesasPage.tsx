import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { api } from '../api/client'
import { useSucursalActiva } from '../components/Layout'
import Button from '../components/ui/Button'
import Dialog from '../components/ui/Dialog'
import TicketResultado from './venta/TicketResultado'
import { Search, Plus, X, Printer, Trash2, Pencil, Check, Undo2, UtensilsCrossed, Banknote, ArrowRightLeft } from 'lucide-react'
import type { MesaDto, SesionMesaDto, ItemComandaDto, MedioPagoDto, VentaResultadoDto, ProductoDto, ComboDto, ClienteDto } from '../types'

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface ItemEmitido {
  producto: { id: number; nombre: string; precio: number }
  cantidad: number
}

async function imprimirComanda(mesa: string, items: ItemComandaDto[]) {
  const line = (text: string, o?: { center?: boolean; bold?: boolean; space?: boolean; size?: string }) => ({
    text, center: !!o?.center, bold: !!o?.bold, space: !!o?.space, size: o?.size ?? 'base'
  })
  const lines: { text: string; center: boolean; bold: boolean; space: boolean; size: string }[] = [
    line('COMANDA', { center: true, bold: true, size: 'lg' }),
    line('MESA ' + mesa, { center: true, bold: true, size: 'md' }),
    line('', { space: true }),
    ...items.map(it => line(`${it.cantidad} x ${it.descripcion}`, {})),
    ...items.filter(it => it.nota).map(it => line(`    . ${it.nota}`, {})),
    line('', { space: true }),
    line(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }), { center: true }),
  ]
  const data = { ancho: 80, letra: 'chica', lines }
  if ('__TAURI_INTERNALS__' in window) {
    localStorage.setItem('posweb-ticket-print', JSON.stringify(data))
    const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow')
    new WebviewWindow(`comanda-print-${Date.now()}`, {
      url: 'ticket-print.html',
      title: 'Imprimir comanda',
      width: 1200,
      height: 700,
      resizable: false,
      center: true,
      decorations: false,
    })
    return
  }
  const w = window.open('', 'posweb-comanda', 'width=460,height=700')
  if (w) {
    w.document.write(`<!doctype html><html><head><title>Comanda</title></head><body><pre style="font-family:'Courier New',monospace;padding:2mm">${lines.map(l => l.text).join('\n')}</pre><script>window.onload=()=>{window.focus();window.print()};window.onafterprint=()=>window.close();</script></body></html>`)
    w.document.close()
  }
}

export default function MesasPage() {
  const { user } = useAuth()
  const { notifyError, notifySuccess } = useNotification()
  const { sucursal } = useSucursalActiva()

  const [mesas, setMesas] = useState<MesaDto[]>([])
  const [sesiones, setSesiones] = useState<SesionMesaDto[]>([])
  const [mediosPago, setMediosPago] = useState<MedioPagoDto[]>([])
  const [cargando, setCargando] = useState(false)

  const [editarMapa, setEditarMapa] = useState(false)
  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaDto | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)

  const [agregarItemSesion, setAgregarItemSesion] = useState<SesionMesaDto | null>(null)
  const [cobrarSesion, setCobrarSesion] = useState<SesionMesaDto | null>(null)
  const [unificarDe, setUnificarDe] = useState<SesionMesaDto | null>(null)
  const [resultado, setResultado] = useState<VentaResultadoDto | null>(null)
  const [resultadoItems, setResultadoItems] = useState<ItemEmitido[]>([])

  const [nuevaMesaNumero, setNuevaMesaNumero] = useState('')
  const [mostrarNuevaMesa, setMostrarNuevaMesa] = useState(false)

  const sesionPorMesa = useMemo(() => {
    const map = new Map<number, SesionMesaDto>()
    sesiones.forEach(s => map.set(s.mesaId, s))
    return map
  }, [sesiones])

  const sesionSeleccionada = mesaSeleccionada ? sesionPorMesa.get(mesaSeleccionada.id) : undefined

  const cargar = async () => {
    if (!sucursal) return
    setCargando(true)
    try {
      const [m, s, mp] = await Promise.all([
        api.restaurante.listarMesas(sucursal.id),
        api.restaurante.sesionesAbiertas(sucursal.id),
        api.mediosPago.listar(),
      ])
      setMesas(m)
      setSesiones(s)
      setMediosPago(mp)
      setMesaSeleccionada(prev => (prev && m.some(mm => mm.id === prev.id)) ? prev : null)
    } catch (e: any) {
      notifyError(e.message || 'Error al cargar mesas')
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [sucursal?.id])

  async function abrirMesa(mesa: MesaDto) {
    try {
      const sesion = await api.restaurante.abrirSesion(mesa.id)
      setSesiones(prev => [...prev.filter(x => x.id !== sesion.id), sesion])
      setMesaSeleccionada(mesa)
    } catch (e: any) {
      notifyError(e.message || 'No se pudo abrir la mesa')
    }
  }

  async function cancelarSesion(sesion: SesionMesaDto) {
    if (!confirm('¿Cancelar la cuenta de la mesa? Los items se descartan.')) return
    try {
      await api.restaurante.cancelarSesion(sesion.id)
      setSesiones(prev => prev.filter(x => x.id !== sesion.id))
      setMesaSeleccionada(null)
      notifySuccess('Cuenta cancelada')
    } catch (e: any) {
      notifyError(e.message || 'No se pudo cancelar la cuenta')
    }
  }

  async function enviarCocina(sesion: SesionMesaDto) {
    const pendientes = sesion.items.filter(i => i.estado === 'Pendiente')
    if (pendientes.length === 0) { notifyError('No hay items pendientes para enviar'); return }
    try {
      for (const it of pendientes) await api.restaurante.cambiarEstadoItem(it.id, 'EnCocina')
      await imprimirComanda(sesion.mesaNumero || String(sesion.mesaId), pendientes)
      await cargar()
    } catch (e: any) {
      notifyError(e.message || 'Error al enviar a cocina')
    }
  }

  async function cambiarEstadoItem(itemId: number, estado: string) {
    try {
      await api.restaurante.cambiarEstadoItem(itemId, estado)
      setSesiones(prev => prev.map(s => {
        if (s.id !== sesionSeleccionada?.id) return s
        return { ...s, items: s.items.map(i => i.id === itemId ? { ...i, estado: estado as ItemComandaDto['estado'] } : i) }
      }))
    } catch (e: any) {
      notifyError(e.message || 'Error al actualizar el item')
    }
  }

  async function crearMesa() {
    if (!sucursal || !nuevaMesaNumero.trim()) return
    try {
      await api.restaurante.crearMesa({
        sucursalId: sucursal.id,
        numero: nuevaMesaNumero.trim(),
        posX: 50,
        posY: 50,
      })
      setNuevaMesaNumero('')
      setMostrarNuevaMesa(false)
      await cargar()
    } catch (e: any) {
      notifyError(e.message || 'No se pudo crear la mesa')
    }
  }

  async function eliminarMesa(mesa: MesaDto) {
    if (!confirm(`¿Eliminar la mesa ${mesa.numero}?`)) return
    try {
      await api.restaurante.eliminarMesa(mesa.id)
      await cargar()
    } catch (e: any) {
      notifyError(e.message || 'No se pudo eliminar la mesa')
    }
  }

  async function moverMesa(mesa: MesaDto, x: number, y: number) {
    try {
      await api.restaurante.actualizarMesa(mesa.id, {
        sucursalId: mesa.sucursalId,
        numero: mesa.numero,
        descripcion: mesa.descripcion,
        posX: x,
        posY: y,
      })
      setMesas(prev => prev.map(m => m.id === mesa.id ? { ...m, posX: x, posY: y } : m))
    } catch (e: any) {
      notifyError(e.message || 'No se pudo guardar la posición')
    }
  }

  function onMapPointerUp(e: React.PointerEvent) {
    if (dragId == null) return
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10
    const mesa = mesas.find(m => m.id === dragId)
    if (mesa) moverMesa(mesa, Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)))
    setDragId(null)
  }

  const ultimosItems = (s: SesionMesaDto): ItemEmitido[] =>
    s.items.filter(i => i.estado !== 'Devuelto' && i.estado !== 'Cancelado').map(i => ({
      producto: { id: i.productoId ?? i.comboId ?? 0, nombre: i.descripcion, precio: i.precioUnitario },
      cantidad: i.cantidad,
    }))

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">Mesas — {sucursal?.nombre || 'Sin sucursal'}</h1>
        <div className="flex items-center gap-2">
          {!sucursal ? (
            <span className="text-sm text-gray-500">Elegí una sucursal para operar</span>
          ) : (
            <>
              <Button
                size="sm"
                variant={editarMapa ? 'primary' : 'secondary'}
                icon={<Pencil size={14} />}
                onClick={() => setEditarMapa(v => !v)}
              >
                {editarMapa ? 'Listo' : 'Editar mapa'}
              </Button>
              <Button size="sm" icon={<Plus size={14} />} onClick={() => { setNuevaMesaNumero(''); setMostrarNuevaMesa(true) }}>
                Agregar mesa
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-3">
        {/* Mapa */}
        <div
          className="relative h-[70vh] rounded-xl border border-gray-200 bg-[radial-gradient(circle_at_1px_1px,#e5e7eb_1px,transparent_0)] bg-[size:22px_22px] overflow-hidden select-none"
          onPointerUp={onMapPointerUp}
        >
          {mesas.map(mesa => {
            const sesion = sesionPorMesa.get(mesa.id)
            const seleccionada = mesaSeleccionada?.id === mesa.id
            return (
              <div
                key={mesa.id}
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 px-3 py-2 shadow-md cursor-pointer transition-colors ${
                  seleccionada ? 'ring-2 ring-[oklch(0.52_0.255_278)]' : ''
                } ${sesion ? 'border-orange-400 bg-orange-50' : 'border-emerald-400 bg-emerald-50'}`}
                style={{ left: `${mesa.posX}%`, top: `${mesa.posY}%`, touchAction: 'none' }}
                onPointerDown={e => { if (editarMapa) { setDragId(mesa.id); (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId) } }}
                onPointerMove={e => {
                  if (!editarMapa || dragId !== mesa.id) return
                  const rect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect()
                  const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10
                  const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10
                  setMesas(prev => prev.map(m => m.id === mesa.id ? { ...m, posX: Math.max(0, Math.min(100, x)), posY: Math.max(0, Math.min(100, y)) } : m))
                }}
                onClick={() => setMesaSeleccionada(mesa)}
              >
                <div className="flex items-center gap-2">
                  <UtensilsCrossed size={16} className={sesion ? 'text-orange-500' : 'text-emerald-500'} />
                  <span className="font-bold text-gray-800">{mesa.numero}</span>
                  {sesion && (
                    <span className="text-xs font-semibold text-orange-600">{sesion.items.length} items</span>
                  )}
                  {editarMapa && (
                    <button
                      type="button"
                      className="ml-1 text-red-500 hover:text-red-700"
                      onClick={e => { e.stopPropagation(); eliminarMesa(mesa) }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <div className={`text-[11px] font-semibold ${sesion ? 'text-orange-600' : 'text-emerald-600'}`}>
                  {sesion ? fmt(sesion.total) : 'Libre'}
                </div>
              </div>
            )
          })}
          {mesas.length === 0 && !cargando && (
            <div className="absolute inset-0 grid place-items-center text-sm text-gray-400">
              No hay mesas. Agregá la primera con el botón "Agregar mesa".
            </div>
          )}
        </div>

        {/* Panel comanda / selección */}
        <div className="rounded-xl border border-gray-200 bg-white p-3 h-[70vh] overflow-y-auto">
          {!mesaSeleccionada && (
            <p className="text-sm text-gray-500">Seleccioná una mesa para ver su comanda.</p>
          )}

          {mesaSeleccionada && !sesionSeleccionada && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-700">Mesa {mesaSeleccionada.numero} — Libre</p>
              <Button fullWidth icon={<Plus size={14} />} onClick={() => abrirMesa(mesaSeleccionada)}>
                Abrir mesa
              </Button>
            </div>
          )}

          {mesaSeleccionada && sesionSeleccionada && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">Mesa {sesionSeleccionada.mesaNumero || mesaSeleccionada.numero}</p>
                  <p className="text-[11px] text-gray-500">Apertura {new Date(sesionSeleccionada.fechaApertura).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <p className="font-bold text-lg text-[oklch(0.52_0.255_278)]">{fmt(sesionSeleccionada.total)}</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" icon={<Plus size={13} />} onClick={() => setAgregarItemSesion(sesionSeleccionada)}>
                  Agregar
                </Button>
                <Button size="sm" variant="secondary" icon={<Printer size={13} />} onClick={() => enviarCocina(sesionSeleccionada)}>
                  Enviar a cocina
                </Button>
                <Button size="sm" variant="secondary" icon={<ArrowRightLeft size={13} />} onClick={() => setUnificarDe(sesionSeleccionada)}>
                  Unificar
                </Button>
                <Button size="sm" variant="confirm" icon={<Banknote size={13} />} onClick={() => setCobrarSesion(sesionSeleccionada)}>
                  Cobrar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => cancelarSesion(sesionSeleccionada)}>
                  Cancelar
                </Button>
              </div>

              <div className="space-y-1.5">
                {sesionSeleccionada.items.length === 0 && (
                  <p className="text-sm text-gray-400">Cuenta vacía. Agregá los primeros items.</p>
                )}
                {sesionSeleccionada.items.map(item => (
                  <div key={item.id} className={`rounded-lg border p-2 ${item.estado === 'Cancelado' || item.estado === 'Devuelto' ? 'border-gray-100 opacity-50' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-800">{item.cantidad} x {item.descripcion}</span>
                      <span className="text-sm font-semibold text-gray-600">{fmt(item.subtotal)}</span>
                    </div>
                    {item.nota && <p className="text-[11px] text-gray-500 mt-0.5">📝 {item.nota}</p>}
                    <div className="mt-1 flex items-center justify-between">
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${estadoColor(item.estado)}`}>{item.estado}</span>
                      <div className="flex items-center gap-1">
                        {(item.estado === 'Pendiente' || item.estado === 'EnCocina') && (
                          <button type="button" title="Servido" className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" onClick={() => cambiarEstadoItem(item.id, 'Servido')}>
                            <Check size={14} />
                          </button>
                        )}
                        {item.estado !== 'Cancelado' && item.estado !== 'Devuelto' && (
                          <button type="button" title="Devolver" className="p-1 text-amber-600 hover:bg-amber-50 rounded" onClick={() => cambiarEstadoItem(item.id, 'Devuelto')}>
                            <Undo2 size={14} />
                          </button>
                        )}
                        {item.estado !== 'Cancelado' && (
                          <button type="button" title="Cancelar item" className="p-1 text-red-500 hover:bg-red-50 rounded" onClick={() => cambiarEstadoItem(item.id, 'Cancelado')}>
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AgregarItemDialog
        sesion={agregarItemSesion}
        sucursalId={sucursal?.id}
        onClose={() => setAgregarItemSesion(null)}
        onAdded={async () => {
          setAgregarItemSesion(null)
          await cargar()
        }}
      />

      <UnificarDialog
        de={unificarDe}
        sesiones={sesiones.filter(s => s.id !== unificarDe?.id)}
        onClose={() => setUnificarDe(null)}
        onDone={async () => { setUnificarDe(null); await cargar() }}
      />

      <CobrarDialog
        sesion={cobrarSesion}
        mediosPago={mediosPago}
        onClose={() => setCobrarSesion(null)}
        onCobrado={res => {
          setResultadoItems(cobrarSesion ? ultimosItems(cobrarSesion) : [])
          setCobrarSesion(null)
          setResultado(res)
          void cargar()
          setMesaSeleccionada(null)
        }}
      />

      {resultado && (
        <Dialog open onClose={() => setResultado(null)} title="Cuenta cobrada" width="xl">
          <TicketResultado
            resultado={resultado}
            ultimosItems={resultadoItems}
            user={user}
            onNuevaVenta={() => setResultado(null)}
          />
        </Dialog>
      )}

      <Dialog open={mostrarNuevaMesa} onClose={() => setMostrarNuevaMesa(false)} title="Nueva mesa" width="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMostrarNuevaMesa(false)}>Cancelar</Button>
            <Button onClick={crearMesa} disabled={!nuevaMesaNumero.trim()}>Crear</Button>
          </>
        }
      >
        <input
          autoFocus
          value={nuevaMesaNumero}
          onChange={e => setNuevaMesaNumero(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') crearMesa() }}
          placeholder="Número / nombre (ej. 1, A-3)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </Dialog>
    </div>
  )
}

function estadoColor(estado: string): string {
  switch (estado) {
    case 'Pendiente': return 'text-gray-600'
    case 'EnCocina': return 'text-orange-600'
    case 'Servido': return 'text-emerald-600'
    case 'Devuelto': return 'text-amber-600'
    case 'Cancelado': return 'text-red-500'
    default: return 'text-gray-500'
  }
}

interface AgregarItemDialogProps {
  sesion: SesionMesaDto | null
  sucursalId?: number
  onClose: () => void
  onAdded: () => Promise<void>
}

function AgregarItemDialog({ sesion, sucursalId, onClose, onAdded }: AgregarItemDialogProps) {
  const { notifyError } = useNotification()
  const [tab, setTab] = useState<'productos' | 'combos'>('productos')
  const [q, setQ] = useState('')
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [combos, setCombos] = useState<ComboDto[]>([])
  const [nota, setNota] = useState('')
  const [cantidad, setCantidad] = useState(1)

  // Reset al abrir el diálogo (cambia la sesión), NO en cada tecla.
  useEffect(() => {
    if (!sesion) return
    setProductos([])
    setCombos([])
    setQ('')
    setNota('')
    setCantidad(1)
  }, [sesion])

  // Búsqueda de productos con debounce: depende de q pero no lo resetea.
  useEffect(() => {
    if (!sesion) return
    const timer = setTimeout(async () => {
      if (!q.trim()) { setProductos([]); return }
      try {
        const res = await api.productos.buscarParaVenta(q.trim(), sucursalId ?? 0)
        setProductos(res)
      } catch { /* ignore */ }
    }, 250)
    return () => clearTimeout(timer)
  }, [q, sesion, sucursalId])

  useEffect(() => {
    if (!sesion || tab !== 'combos') return
    api.combos.listar().then(setCombos).catch(() => {})
  }, [tab, sesion])

  async function agregar(productoId?: number, comboId?: number) {
    if (!sesion) return
    try {
      await api.restaurante.agregarItem(sesion.id, { productoId, comboId, cantidad, nota })
      await onAdded()
    } catch (e: any) {
      notifyError(e.message || 'No se pudo agregar el item')
    }
  }

  return (
    <Dialog open={!!sesion} onClose={onClose} title="Agregar a la comanda" width="lg"
      footer={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}
    >
      <div className="space-y-3">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {(['productos', 'combos'] as const).map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`flex-1 rounded-md py-1.5 text-xs font-bold uppercase tracking-wide ${tab === t ? 'bg-white shadow text-[oklch(0.52_0.255_278)]' : 'text-gray-500'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'productos' && (
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
              placeholder="Buscar por nombre o código…"
              className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm" />
          </div>
        )}

        <div className="max-h-56 space-y-1 overflow-y-auto">
          {tab === 'productos' && q.trim() && productos.map(p => (
            <button key={p.id} type="button" onClick={() => agregar(p.id)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm hover:border-[oklch(0.52_0.255_278)] hover:bg-[oklch(0.52_0.255_278_/_0.05)]">
              <span className="text-gray-800">{p.nombre}</span>
              <span className="font-semibold text-gray-600">{fmt(p.precio)}</span>
            </button>
          ))}
          {tab === 'productos' && !q.trim() && <p className="text-xs text-gray-400">Escribí para buscar.</p>}
          {tab === 'combos' && combos.filter(c => c.activo).map(c => (
            <button key={c.id} type="button" onClick={() => agregar(undefined, c.id)}
              className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm hover:border-[oklch(0.52_0.255_278)] hover:bg-[oklch(0.52_0.255_278_/_0.05)]">
              <span className="text-gray-800">{c.descCombo}</span>
              <span className="font-semibold text-gray-600">{fmt(c.precio)}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold text-gray-600">
            Cantidad
            <input type="number" min={1} step={0.5} value={cantidad}
              onChange={e => setCantidad(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
          </label>
          <label className="text-xs font-semibold text-gray-600">
            Nota (opcional)
            <input value={nota} onChange={e => setNota(e.target.value)}
              placeholder="Ej: sin cebolla"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
          </label>
        </div>
      </div>
    </Dialog>
  )
}

interface UnificarDialogProps {
  de: SesionMesaDto | null
  sesiones: SesionMesaDto[]
  onClose: () => void
  onDone: () => Promise<void>
}

function UnificarDialog({ de, sesiones, onClose, onDone }: UnificarDialogProps) {
  const { notifyError } = useNotification()
  const [haciaId, setHaciaId] = useState<number | null>(null)
  const [unificando, setUnificando] = useState(false)

  useEffect(() => {
    if (!de) return
    setHaciaId(sesiones[0]?.id ?? null)
  }, [de])

  async function unificar() {
    if (!de || !haciaId) return
    setUnificando(true)
    try {
      await api.restaurante.unificar(de.id, haciaId)
      await onDone()
    } catch (e: any) {
      notifyError(e.message || 'No se pudo unificar')
    } finally {
      setUnificando(false)
    }
  }

  return (
    <Dialog open={!!de} onClose={onClose} title="Unificar cuentas" width="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={unificar} loading={unificando} disabled={!haciaId}>Unificar</Button>
        </>
      }
    >
      <p className="text-sm text-gray-600">Mover la cuenta de la mesa {de?.mesaNumero || de?.mesaId} hacia:</p>
      <select value={haciaId ?? ''} onChange={e => setHaciaId(Number(e.target.value))}
        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
        {sesiones.map(s => (
          <option key={s.id} value={s.id}>Mesa {s.mesaNumero || s.mesaId} — {fmt(s.total)}</option>
        ))}
      </select>
    </Dialog>
  )
}

interface CobrarDialogProps {
  sesion: SesionMesaDto | null
  mediosPago: MedioPagoDto[]
  onClose: () => void
  onCobrado: (res: VentaResultadoDto) => void
}

function CobrarDialog({ sesion, mediosPago, onClose, onCobrado }: CobrarDialogProps) {
  const { notifyError } = useNotification()
  const [medioId, setMedioId] = useState<number>(1)
  const [monto, setMonto] = useState<number>(sesion?.total ?? 0)
  const [clienteId, setClienteId] = useState<number | null>(null)
  const [clientes, setClientes] = useState<ClienteDto[]>([])
  const [cobrando, setCobrando] = useState(false)

  useEffect(() => {
    setMonto(sesion?.total ?? 0)
  }, [sesion])

  useEffect(() => {
    if (!sesion) return
    api.clientes.listar('', 1, 50).then(r => setClientes(r.items)).catch(() => {})
  }, [sesion])

  const medio = mediosPago.find(m => m.id === medioId)

  async function cobrar() {
    if (!sesion) return
    if (monto <= 0) { notifyError('Monto inválido'); return }
    if (monto < sesion.total && !clienteId) { notifyError('Si el pago es menor al total, elegí un cliente (genera deuda)'); return }
    setCobrando(true)
    try {
      const pago: { medioPagoId: number; monto: number; conCambio?: number } = { medioPagoId: medioId, monto }
      if (medio?.pagaVuelto && monto > sesion.total) pago.conCambio = monto
      const res = await api.restaurante.cobrar(sesion.id, { pagos: [pago], clienteId: clienteId ?? undefined })
      onCobrado(res)
    } catch (e: any) {
      notifyError(e.message || 'No se pudo cobrar la cuenta')
    } finally {
      setCobrando(false)
    }
  }

  return (
    <Dialog open={!!sesion} onClose={onClose} title="Cobrar cuenta" width="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="confirm" onClick={cobrar} loading={cobrando}>Cobrar {fmt(monto)}</Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
          <span className="text-sm text-gray-600">Total mesa</span>
          <span className="font-bold text-[oklch(0.52_0.255_278)]">{fmt(sesion?.total ?? 0)}</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {mediosPago.map(mp => (
            <button key={mp.id} type="button"
              onClick={() => setMedioId(mp.id)}
              className={`rounded-lg border py-2 text-[10px] font-bold uppercase tracking-wide ${medioId === mp.id ? 'border-[oklch(0.52_0.255_278)] bg-[oklch(0.52_0.255_278)] text-white' : 'border-gray-200 text-gray-500 hover:border-[oklch(0.52_0.255_278)]'}`}>
              {mp.nombre}
            </button>
          ))}
        </div>

        <label className="block text-xs font-semibold text-gray-600">
          Monto recibido
          <input type="number" value={monto} min={0} onChange={e => setMonto(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </label>

        <label className="block text-xs font-semibold text-gray-600">
          Cliente (solo si queda saldo a favor / deuda)
          <select value={clienteId ?? ''} onChange={e => setClienteId(e.target.value ? Number(e.target.value) : null)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">— Sin cliente —</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </label>
      </div>
    </Dialog>
  )
}