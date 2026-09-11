import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { api } from '../api/client'
import { useSucursalActiva } from '../components/Layout'
import Button from '../components/ui/Button'
import Dialog from '../components/ui/Dialog'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import TicketResultado from './venta/TicketResultado'
import { Search, Plus, X, Printer, Trash2, Pencil, Check, Undo2, UtensilsCrossed, Banknote, ArrowRightLeft, RefreshCw, ChevronRight, GripVertical } from 'lucide-react'
import type { MesaDto, SesionMesaDto, ItemComandaDto, MedioPagoDto, VentaResultadoDto, ProductoDto, ComboDto, ClienteDto, GrupoComanda } from '../types'

const GRUPOS_COMANDA: GrupoComanda[] = ['Entrada', 'Principal', 'Postre', 'Otros']
const GRUPO_LABEL: Record<GrupoComanda, string> = {
  Entrada: 'Entradas',
  Principal: 'Platos principales',
  Postre: 'Postres',
  Otros: 'Otros',
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

interface ItemEmitido {
  producto: { id: number; nombre: string; precio: number }
  cantidad: number
}

async function imprimirComanda(mesa: string, items: ItemComandaDto[], grupo?: string) {
  const line = (text: string, o?: { center?: boolean; bold?: boolean; space?: boolean; size?: string }) => ({
    text, center: !!o?.center, bold: !!o?.bold, space: !!o?.space, size: o?.size ?? 'base'
  })
  const lines: { text: string; center: boolean; bold: boolean; space: boolean; size: string }[] = [
    line('COMANDA', { center: true, bold: true, size: 'lg' }),
    line('MESA ' + mesa, { center: true, bold: true, size: 'md' }),
    ...(grupo ? [line(GRUPO_LABEL[grupo as GrupoComanda]?.toUpperCase() ?? grupo.toUpperCase(), { center: true, bold: true, size: 'md' })] : []),
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
  const [vista, setVista] = useState<'mapa' | 'cocina'>('mapa')
  const [mesaSeleccionada, setMesaSeleccionada] = useState<MesaDto | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)

  const [editarItem, setEditarItem] = useState<ItemComandaDto | null>(null)
  const [grupoExpandido, setGrupoExpandido] = useState<string | null>(null)

  const [agregarItemSesion, setAgregarItemSesion] = useState<SesionMesaDto | null>(null)
  const [agregarItemGrupo, setAgregarItemGrupo] = useState<GrupoComanda>('Principal')
  const [dragOverGrupo, setDragOverGrupo] = useState<GrupoComanda | null>(null)
  const [cobrarSesion, setCobrarSesion] = useState<SesionMesaDto | null>(null)
  const [unificarDe, setUnificarDe] = useState<SesionMesaDto | null>(null)
  const [resultado, setResultado] = useState<VentaResultadoDto | null>(null)
  const [resultadoItems, setResultadoItems] = useState<ItemEmitido[]>([])

  const [nuevaMesaNumero, setNuevaMesaNumero] = useState('')
  const [mostrarNuevaMesa, setMostrarNuevaMesa] = useState(false)
  const [confirmar, setConfirmar] = useState<{ tipo: 'cancelar' | 'eliminar'; sesion?: SesionMesaDto; mesa?: MesaDto } | null>(null)

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

  async function enviarCocinaGrupo(sesion: SesionMesaDto, grupo: GrupoComanda) {
    const pendientes = sesion.items.filter(i => i.grupo === grupo && i.estado === 'Pendiente')
    if (pendientes.length === 0) { notifyError('No hay items pendientes en este grupo'); return }
    try {
      for (const it of pendientes) await api.restaurante.cambiarEstadoItem(it.id, 'EnCocina')
      await imprimirComanda(sesion.mesaNumero || String(sesion.mesaId), pendientes, grupo)
      await cargar()
    } catch (e: any) {
      notifyError(e.message || 'Error al enviar a cocina')
    }
  }

  async function moverItemGrupo(itemId: number, grupo: GrupoComanda) {
    const item = sesionSeleccionada?.items.find(i => i.id === itemId)
    if (!item || item.grupo === grupo) return
    try {
      await api.restaurante.actualizarItem(itemId, { cantidad: item.cantidad, nota: item.nota ?? undefined, grupo })
      setSesiones(prev => prev.map(s => {
        if (s.id !== sesionSeleccionada?.id) return s
        return { ...s, items: s.items.map(i => i.id === itemId ? { ...i, grupo } : i) }
      }))
    } catch (e: any) {
      notifyError(e.message || 'No se pudo mover el item de grupo')
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

  async function guardarNotaUnidad(item: ItemComandaDto, nota: string) {
    try {
      await api.restaurante.actualizarItem(item.id, { cantidad: item.cantidad, nota })
      setSesiones(prev => prev.map(s => {
        if (s.id !== item.sesionMesaId) return s
        return { ...s, items: s.items.map(i => i.id === item.id ? { ...i, nota } : i) }
      }))
    } catch (e: any) {
      notifyError(e.message || 'No se pudo guardar la nota')
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
    try {
      await api.restaurante.eliminarMesa(mesa.id)
      await cargar()
    } catch (e: any) {
      notifyError(e.message || 'No se pudo eliminar la mesa')
    }
  }

  function handleConfirmar() {
    if (!confirmar) return
    if (confirmar.tipo === 'cancelar' && confirmar.sesion) void cancelarSesion(confirmar.sesion)
    else if (confirmar.tipo === 'eliminar' && confirmar.mesa) void eliminarMesa(confirmar.mesa)
    setConfirmar(null)
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
              <div className="flex rounded-lg bg-gray-100 p-0.5">
                <button
                  type="button"
                  onClick={() => setVista('mapa')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${vista === 'mapa' ? 'bg-white shadow text-[oklch(0.52_0.255_278)]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Mapa
                </button>
                <button
                  type="button"
                  onClick={() => setVista('cocina')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${vista === 'cocina' ? 'bg-white shadow text-[oklch(0.52_0.255_278)]' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Cocina
                </button>
              </div>
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

      {vista === 'cocina' ? (
        <CocinaView
          sesiones={sesiones}
          onRefrescar={() => cargar()}
          onImprimir={imprimirComanda}
          onCambiarEstado={cambiarEstadoItem}
        />
      ) : (
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
                  {sesion && sesion.items.some(i => i.estado === 'Pendiente') && (
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5" title="Comanda sin enviar a cocina">
                      🕐 {sesion.items.filter(i => i.estado === 'Pendiente').length}
                    </span>
                  )}
                  {editarMapa && (
                    <button
                      type="button"
                      className="ml-1 text-red-500 hover:text-red-700"
                      onClick={e => { e.stopPropagation(); setConfirmar({ tipo: 'eliminar', mesa }) }}
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
                <Button size="sm" variant="destructive" onClick={() => setConfirmar({ tipo: 'cancelar', sesion: sesionSeleccionada })}>
                  Cancelar
                </Button>
              </div>

              <div className="space-y-3">
                {sesionSeleccionada.items.length === 0 && (
                  <p className="text-sm text-gray-400">Cuenta vacía. Agregá los primeros items.</p>
                )}
                {GRUPOS_COMANDA.map(grupo => {
                  const itemsGrupo = sesionSeleccionada.items.filter(i => i.grupo === grupo)
                  if (itemsGrupo.length === 0) return null
                  const pendientes = itemsGrupo.filter(i => i.estado === 'Pendiente').length
                  const productos = agruparItems(itemsGrupo)
                  const esDragOver = dragOverGrupo === grupo
                  return (
                    <div
                      key={grupo}
                      onDragOver={e => { e.preventDefault(); setDragOverGrupo(grupo) }}
                      onDragLeave={() => setDragOverGrupo(g => (g === grupo ? null : g))}
                      onDrop={e => {
                        e.preventDefault()
                        const id = Number(e.dataTransfer.getData('text/plain'))
                        setDragOverGrupo(null)
                        if (id) void moverItemGrupo(id, grupo)
                      }}
                      className={`rounded-lg border p-2 transition-colors ${esDragOver ? 'border-[oklch(0.52_0.255_278)] bg-[oklch(0.52_0.255_278_/_0.05)]' : 'border-gray-200'}`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
                          {GRUPO_LABEL[grupo]}
                          {pendientes > 0 && <span className="ml-1.5 text-amber-600 normal-case">({pendientes} sin enviar)</span>}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="secondary" icon={<Plus size={12} />} onClick={() => { setAgregarItemGrupo(grupo); setAgregarItemSesion(sesionSeleccionada) }}>
                            Agregar
                          </Button>
                          <Button size="sm" variant="secondary" icon={<Printer size={12} />} onClick={() => enviarCocinaGrupo(sesionSeleccionada, grupo)}>
                            Enviar
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {productos.map(g => {
                          const expandKey = `${grupo}-${g.key}`
                          const expandido = grupoExpandido === expandKey
                          const totalUnidades = g.unidades.reduce((s, i) => s + i.cantidad, 0)
                          const subtotal = g.unidades.reduce((s, i) => s + i.subtotal, 0)
                          return (
                            <div key={g.key} className="rounded-lg border border-gray-200 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setGrupoExpandido(expandido ? null : expandKey)}
                                className="flex w-full items-center justify-between gap-2 p-2 hover:bg-gray-50 transition-colors"
                              >
                                <span className="flex items-center gap-1.5 min-w-0">
                                  <ChevronRight size={14} className={`shrink-0 transition-transform text-gray-400 ${expandido ? 'rotate-90' : ''}`} />
                                  <span className="text-sm font-medium text-gray-800 truncate">{g.descripcion}</span>
                                  <span className="text-xs font-bold text-gray-500 bg-gray-100 rounded-full px-1.5 py-0.5 shrink-0">x{totalUnidades}</span>
                                </span>
                                <span className="text-sm font-semibold text-gray-600 shrink-0">{fmt(subtotal)}</span>
                              </button>
                              {expandido && (
                                <div className="border-t border-gray-100 divide-y divide-gray-50">
                                  {g.unidades.map(item => (
                                    <ItemUnidadRow
                                      key={item.id}
                                      item={item}
                                      onCambiarEstado={cambiarEstadoItem}
                                      onEditar={() => setEditarItem(item)}
                                      onGuardarNota={guardarNotaUnidad}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      )}

      <AgregarItemDialog
        sesion={agregarItemSesion}
        grupo={agregarItemGrupo}
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

      <EditarItemDialog
        item={editarItem}
        onClose={() => setEditarItem(null)}
        onGuardado={async () => {
          setEditarItem(null)
          await cargar()
        }}
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
            mesa={resultado.mesa ?? undefined}
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

      <ConfirmDialog
        open={confirmar != null}
        title={confirmar?.tipo === 'cancelar' ? 'Cancelar cuenta' : 'Eliminar mesa'}
        description={confirmar?.tipo === 'cancelar'
          ? `¿Cancelar la cuenta de la mesa ${confirmar?.sesion?.mesaNumero || confirmar?.sesion?.mesaId}? Los items se descartan.`
          : `¿Eliminar la mesa ${confirmar?.mesa?.numero}?`}
        cancelLabel={confirmar?.tipo === 'cancelar' ? 'No cancelar' : 'Cancelar'}
        confirmLabel={confirmar?.tipo === 'cancelar' ? 'Cancelar cuenta' : 'Eliminar'}
        confirmVariant="destructive"
        onCancel={() => setConfirmar(null)}
        onConfirm={handleConfirmar}
      />
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

interface ItemUnidadRowProps {
  item: ItemComandaDto
  onCambiarEstado: (itemId: number, estado: string) => void
  onEditar: () => void
  onGuardarNota: (item: ItemComandaDto, nota: string) => void
}

function ItemUnidadRow({ item, onCambiarEstado, onEditar, onGuardarNota }: ItemUnidadRowProps) {
  const esTerminal = item.estado === 'Cancelado' || item.estado === 'Devuelto'
  const [nota, setNota] = useState(item.nota ?? '')

  useEffect(() => {
    setNota(item.nota ?? '')
  }, [item.id, item.nota])

  function commitNota() {
    const valor = nota.trim()
    if (valor === (item.nota ?? '')) return
    onGuardarNota(item, valor)
  }

  return (
    <div className={`p-2 ${esTerminal ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 min-w-0">
          {!esTerminal && (
            <span
              draggable
              onDragStart={e => { e.dataTransfer.setData('text/plain', String(item.id)); e.dataTransfer.effectAllowed = 'move' }}
              className="shrink-0 cursor-grab text-gray-300 hover:text-gray-500"
              title="Arrastrar a otro grupo"
            >
              <GripVertical size={14} />
            </span>
          )}
          <span className="text-sm font-medium text-gray-800 truncate">
            {item.cantidad > 1 ? `${item.cantidad} x ` : ''}{item.descripcion}
          </span>
        </span>
        <span className="text-sm font-semibold text-gray-600 shrink-0">{fmt(item.subtotal)}</span>
      </div>
      {esTerminal ? (
        item.nota && <p className="text-[11px] text-gray-400 mt-0.5">📝 {item.nota}</p>
      ) : (
        <input
          value={nota}
          onChange={e => setNota(e.target.value)}
          onBlur={commitNota}
          onKeyDown={e => {
            if (e.key === 'Enter') { commitNota(); (e.target as HTMLInputElement).blur() }
          }}
          placeholder="Nota de esta unidad (ej: sin cebolla)"
          className="mt-1 w-full rounded-md border border-gray-200 px-2 py-1 text-[11px] outline-none transition-colors focus:border-[oklch(0.52_0.255_278)]"
        />
      )}
      <div className="mt-1 flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-wide ${estadoColor(item.estado)}`}>{item.estado}</span>
        <div className="flex items-center gap-1">
          {(item.estado === 'Pendiente' || item.estado === 'EnCocina') && (
            <button type="button" title="Servido" className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" onClick={() => onCambiarEstado(item.id, 'Servido')}>
              <Check size={14} />
            </button>
          )}
          {!esTerminal && (
            <button type="button" title="Editar cantidad" className="p-1 text-gray-500 hover:bg-gray-100 rounded" onClick={onEditar}>
              <Pencil size={14} />
            </button>
          )}
          {!esTerminal && (
            <button type="button" title="Devolver" className="p-1 text-amber-600 hover:bg-amber-50 rounded" onClick={() => onCambiarEstado(item.id, 'Devuelto')}>
              <Undo2 size={14} />
            </button>
          )}
          {item.estado !== 'Cancelado' && (
            <button type="button" title="Cancelar item" className="p-1 text-red-500 hover:bg-red-50 rounded" onClick={() => onCambiarEstado(item.id, 'Cancelado')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/** Agrupa las unidades individuales (CANTIDAD=1) por producto/combo para mostrar una línea colapsable. */
function agruparItems(items: ItemComandaDto[]): { key: string; descripcion: string; unidades: ItemComandaDto[] }[] {
  const map = new Map<string, { key: string; descripcion: string; unidades: ItemComandaDto[] }>()
  for (const item of items) {
    const key = String(item.productoId ?? item.comboId ?? 0)
    const existente = map.get(key)
    if (existente) existente.unidades.push(item)
    else map.set(key, { key, descripcion: item.descripcion, unidades: [item] })
  }
  return [...map.values()]
}

interface CocinaViewProps {
  sesiones: SesionMesaDto[]
  onRefrescar: () => void
  onImprimir: (mesa: string, items: ItemComandaDto[]) => void
  onCambiarEstado: (itemId: number, estado: string) => void
}

function CocinaView({ sesiones, onRefrescar, onImprimir, onCambiarEstado }: CocinaViewProps) {
  const hora = (iso: string) =>
    new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  const [expandido, setExpandido] = useState<string | null>(null)

  const conPendientes = sesiones
    .map(s => ({
      sesion: s,
      items: s.items
        .filter(i => i.estado === 'Pendiente' || i.estado === 'EnCocina')
        .sort((a, b) => a.fechaAlta.localeCompare(b.fechaAlta)),
    }))
    .filter(x => x.items.length > 0)
    // Las mesas con la comanda más antigua primero.
    .sort((a, b) => a.items[0].fechaAlta.localeCompare(b.items[0].fechaAlta))

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-gray-800">Cocina — pendientes</h2>
        <Button size="sm" variant="secondary" icon={<RefreshCw size={13} />} onClick={onRefrescar}>Refrescar</Button>
      </div>

      {conPendientes.length === 0 ? (
        <p className="text-sm text-gray-400">No hay comandas pendientes en cocina.</p>
      ) : (
        <div className="space-y-3">
          {conPendientes.map(({ sesion, items }) => (
            <div key={sesion.id} className="rounded-lg border border-gray-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-gray-800">Mesa {sesion.mesaNumero || sesion.mesaId}</span>
                <span className="text-[11px] text-gray-400">
                  comanda desde {hora(items[0].fechaAlta)}
                </span>
                <Button size="sm" variant="secondary" icon={<Printer size={13} />} onClick={() => onImprimir(sesion.mesaNumero || String(sesion.mesaId), items)}>
                  Imprimir
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {GRUPOS_COMANDA.map(grupo => {
                  const itemsGrupo = items.filter(i => i.grupo === grupo)
                  if (itemsGrupo.length === 0) return null
                  return (
                    <div key={grupo} className="space-y-1">
                      <div className="text-[10px] font-bold uppercase tracking-wide text-gray-400">{GRUPO_LABEL[grupo]}</div>
                      {agruparItems(itemsGrupo).map(g => {
                        const key = `${sesion.id}-${grupo}-${g.key}`
                        const abierto = expandido === key
                        const masAntigua = g.unidades[0]
                        return (
                          <div key={g.key} className="rounded-md border border-gray-200 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => setExpandido(abierto ? null : key)}
                              className="flex w-full items-center justify-between gap-2 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              <span className="flex items-center gap-1.5 min-w-0">
                                <ChevronRight size={14} className={`shrink-0 transition-transform text-gray-400 ${abierto ? 'rotate-90' : ''}`} />
                                <span className="text-sm text-gray-800 truncate">{g.descripcion}</span>
                                <span className="text-xs font-bold text-gray-500 bg-white rounded-full px-1.5 py-0.5 shrink-0">x{g.unidades.length}</span>
                              </span>
                              <span className="text-[10px] font-mono text-gray-400 shrink-0">desde {hora(masAntigua.fechaAlta)}</span>
                            </button>
                            {abierto && (
                              <div className="divide-y divide-gray-50">
                                {g.unidades.map(item => (
                                  <div key={item.id} className="flex items-center justify-between gap-2 px-2 py-1">
                                    <div className="min-w-0">
                                      <span className="text-sm text-gray-800">{item.descripcion}</span>
                                      {item.nota && <p className="text-[11px] text-gray-500 truncate">📝 {item.nota}</p>}
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      <span className="text-[10px] font-mono text-gray-400" title="Hora de la comanda">{hora(item.fechaAlta)}</span>
                                      <span className={`text-[10px] font-bold uppercase ${estadoColor(item.estado)}`}>{item.estado}</span>
                                      {item.estado === 'Pendiente' && (
                                        <button type="button" title="En cocina" className="p-1 text-orange-600 hover:bg-orange-50 rounded" onClick={() => onCambiarEstado(item.id, 'EnCocina')}>
                                          <UtensilsCrossed size={14} />
                                        </button>
                                      )}
                                      {item.estado !== 'Servido' && (
                                        <button type="button" title="Servido" className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" onClick={() => onCambiarEstado(item.id, 'Servido')}>
                                          <Check size={14} />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface EditarItemDialogProps {
  item: ItemComandaDto | null
  onClose: () => void
  onGuardado: () => Promise<void>
}

function EditarItemDialog({ item, onClose, onGuardado }: EditarItemDialogProps) {
  const { notifyError } = useNotification()
  const [cantidad, setCantidad] = useState(1)
  const [nota, setNota] = useState('')

  useEffect(() => {
    if (!item) return
    setCantidad(item.cantidad)
    setNota(item.nota ?? '')
  }, [item])

  async function guardar() {
    if (!item) return
    try {
      await api.restaurante.actualizarItem(item.id, { cantidad, nota })
      await onGuardado()
    } catch (e: any) {
      notifyError(e.message || 'No se pudo actualizar el item')
    }
  }

  return (
    <Dialog open={!!item} onClose={onClose} title="Editar item" width="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={guardar}>Guardar</Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm font-semibold text-gray-800">{item?.descripcion}</p>
        <label className="block text-xs font-semibold text-gray-600">
          Cantidad
          <input type="number" min={1} step={1} value={cantidad}
            onChange={e => setCantidad(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
        </label>
        <label className="block text-xs font-semibold text-gray-600">
          Nota
          <input value={nota} onChange={e => setNota(e.target.value)}
            placeholder="Ej: sin cebolla"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
        </label>
      </div>
    </Dialog>
  )
}

interface AgregarItemDialogProps {
  sesion: SesionMesaDto | null
  grupo: GrupoComanda
  sucursalId?: number
  onClose: () => void
  onAdded: () => Promise<void>
}

function AgregarItemDialog({ sesion, grupo, sucursalId, onClose, onAdded }: AgregarItemDialogProps) {
  const { notifyError } = useNotification()
  const [tab, setTab] = useState<'productos' | 'combos'>('productos')
  const [q, setQ] = useState('')
  const [productos, setProductos] = useState<ProductoDto[]>([])
  const [combos, setCombos] = useState<ComboDto[]>([])
  const [nota, setNota] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [notas, setNotas] = useState<string[]>([])
  const [seleccionado, setSeleccionado] = useState<{ productoId?: number; comboId?: number; descripcion: string; precio: number } | null>(null)

  // Cantidad parseada y válida (>= 1); 0 si está vacío o mal escrito (se valida al agregar).
  const unidadesValidas = (() => {
    const n = Math.round(Number(cantidad))
    return Number.isFinite(n) && n >= 1 ? n : 0
  })()

  // Reset al abrir el diálogo (cambia la sesión), NO en cada tecla.
  useEffect(() => {
    if (!sesion) return
    setProductos([])
    setCombos([])
    setQ('')
    setNota('')
    setCantidad('1')
    setNotas([])
    setSeleccionado(null)
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

  function seleccionarProducto(p: ProductoDto) {
    setSeleccionado({ productoId: p.id, comboId: undefined, descripcion: p.nombre, precio: p.precio })
    setNota('')
    setNotas(Array.from({ length: unidadesValidas || 1 }, () => ''))
  }

  function seleccionarCombo(c: ComboDto) {
    setSeleccionado({ productoId: undefined, comboId: c.id, descripcion: c.descCombo, precio: c.precio })
    setNota('')
    setNotas(Array.from({ length: unidadesValidas || 1 }, () => ''))
  }

  async function agregar() {
    if (!sesion || !seleccionado) return
    const unidades = unidadesValidas
    if (unidades < 1) {
      notifyError('Ingresá una cantidad válida (mayor a 0)')
      return
    }
    try {
      if (unidades > 1) {
        await api.restaurante.agregarItem(sesion.id, { productoId: seleccionado.productoId, comboId: seleccionado.comboId, cantidad: unidades, notas, grupo })
      } else {
        await api.restaurante.agregarItem(sesion.id, { productoId: seleccionado.productoId, comboId: seleccionado.comboId, cantidad: 1, nota, grupo })
      }
      await onAdded()
    } catch (e: any) {
      notifyError(e.message || 'No se pudo agregar el item')
    }
  }

  function handleEnter() {
    if (seleccionado) { void agregar(); return }
    if (tab === 'productos' && productos.length > 0) seleccionarProducto(productos[0])
    else if (tab === 'combos' && combos.filter(c => c.activo).length > 0) seleccionarCombo(combos.filter(c => c.activo)[0])
  }

  const estaSeleccionado = (productoId?: number, comboId?: number) =>
    seleccionado != null &&
    seleccionado.productoId === (productoId ?? undefined) &&
    seleccionado.comboId === (comboId ?? undefined)

  return (
    <Dialog open={!!sesion} onClose={onClose} title="Agregar a la comanda" width="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          <Button onClick={agregar} disabled={!seleccionado}>Agregar</Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {(['productos', 'combos'] as const).map(t => (
            <button key={t} type="button" onClick={() => { setTab(t); setSeleccionado(null) }}
              className={`flex-1 rounded-md py-1.5 text-xs font-bold uppercase tracking-wide ${tab === t ? 'bg-white shadow text-[oklch(0.52_0.255_278)]' : 'text-gray-500'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab === 'productos' && (
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleEnter() }}
              placeholder="Buscar por nombre o código…"
              className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm" />
          </div>
        )}

        <div className="max-h-56 space-y-1 overflow-y-auto">
          {tab === 'productos' && q.trim() && productos.map(p => (
            <button key={p.id} type="button" onClick={() => seleccionarProducto(p)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${estaSeleccionado(p.id) ? 'border-[oklch(0.52_0.255_278)] bg-[oklch(0.52_0.255_278_/_0.06)]' : 'border-gray-200 hover:border-[oklch(0.52_0.255_278)] hover:bg-[oklch(0.52_0.255_278_/_0.05)]'}`}>
              <span className="text-gray-800">{p.nombre}</span>
              <span className="font-semibold text-gray-600">{fmt(p.precio)}</span>
            </button>
          ))}
          {tab === 'productos' && !q.trim() && <p className="text-xs text-gray-400">Escribí para buscar.</p>}
          {tab === 'combos' && combos.filter(c => c.activo).map(c => (
            <button key={c.id} type="button" onClick={() => seleccionarCombo(c)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-colors ${estaSeleccionado(undefined, c.id) ? 'border-[oklch(0.52_0.255_278)] bg-[oklch(0.52_0.255_278_/_0.06)]' : 'border-gray-200 hover:border-[oklch(0.52_0.255_278)] hover:bg-[oklch(0.52_0.255_278_/_0.05)]'}`}>
              <span className="text-gray-800">{c.descCombo}</span>
              <span className="font-semibold text-gray-600">{fmt(c.precio)}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs font-semibold text-gray-600">
            Cantidad
            <input type="number" min={1} step={1} value={cantidad}
              onChange={e => {
                setCantidad(e.target.value)
                const n = Math.round(Number(e.target.value))
                if (Number.isFinite(n) && n >= 1) {
                  setNotas(prev => Array.from({ length: n }, (_, i) => prev[i] ?? ''))
                }
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleEnter() }}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
          </label>
          {unidadesValidas > 1 ? (
            <div className="text-xs font-semibold text-gray-600">
              Nota por unidad
              <div className="mt-1 space-y-1">
                {notas.map((n, i) => (
                  <input key={i} value={n}
                    onChange={e => setNotas(prev => prev.map((x, j) => (j === i ? e.target.value : x)))}
                    onKeyDown={e => { if (e.key === 'Enter') handleEnter() }}
                    placeholder={`Nota unidad ${i + 1}`}
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                ))}
              </div>
            </div>
          ) : (
            <label className="text-xs font-semibold text-gray-600">
              Nota (opcional)
              <input value={nota} onChange={e => setNota(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleEnter() }}
                placeholder="Ej: sin cebolla"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
            </label>
          )}
        </div>

        {!seleccionado && (
          <p className="text-xs text-gray-400">Tocá un producto para seleccionarlo y después confirmá con Enter o "Agregar".</p>
        )}
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