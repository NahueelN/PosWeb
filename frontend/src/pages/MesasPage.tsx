import { useEffect, useMemo, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { HELP_KEYS } from '../help/content'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { api } from '../api/client'
import { useSucursalActiva } from '../components/Layout'
import Button from '../components/ui/Button'
import Dialog from '../components/ui/Dialog'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import MontoInput from '../components/shared/MontoInput'
import TicketResultado from './venta/TicketResultado'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { Search, Plus, X, Minus, Printer, Trash2, Pencil, Check, Undo2, UtensilsCrossed, Banknote, ArrowRightLeft, RefreshCw, ChevronRight, GripVertical, CreditCard, Smartphone, QrCode, HelpCircle } from 'lucide-react'
import type { MesaDto, SesionMesaDto, ItemComandaDto, MedioPagoDto, VentaResultadoDto, ProductoDto, ComboDto, ClienteDto, GrupoComanda } from '../types'

const GRUPOS_COMANDA: GrupoComanda[] = ['Entrada', 'Principal', 'Postre', 'Otros']
const TAMANO_BASE_MESA = 112
const GRUPO_LABEL: Record<GrupoComanda, string> = {
  Entrada: 'Entradas',
  Principal: 'Platos principales',
  Postre: 'Postres',
  Otros: 'Otros',
}

function fmt(n: number): string {
  return '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof Error ? e.message : fallback
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
  ]

  const volcarItems = (itms: ItemComandaDto[]) => {
    itms.forEach(it => {
      lines.push(line(`${it.cantidad} x ${it.descripcion}`, {}))
      if (it.nota) lines.push(line(`    . ${it.nota}`, {}))
    })
  }

  if (grupo) {
    volcarItems(items)
  } else {
    GRUPOS_COMANDA.forEach(g => {
      const itemsGrupo = items.filter(i => i.grupo === g)
      if (itemsGrupo.length === 0) return
      lines.push(line(GRUPO_LABEL[g].toUpperCase(), { bold: true, size: 'md' }))
      volcarItems(itemsGrupo)
      lines.push(line('', { space: true }))
    })
  }

  lines.push(line(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }), { center: true }))
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
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notifyError, notifySuccess } = useNotification()
  const { sucursal } = useSucursalActiva()
  const esCompacto = useMediaQuery('(max-width: 1279px)')

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
  const [nuevaMesaTitulo, setNuevaMesaTitulo] = useState('')
  const [nuevoSalon, setNuevoSalon] = useState('Principal')
  const [nuevoSalonLibre, setNuevoSalonLibre] = useState(false)
  const [salon, setSalon] = useState('Principal')
  const [salonNombre, setSalonNombre] = useState('')
  const [agregarSalonOpen, setAgregarSalonOpen] = useState(false)
  const [mostrarNuevaMesa, setMostrarNuevaMesa] = useState(false)
  const [confirmar, setConfirmar] = useState<{ tipo: 'cancelar' | 'eliminar' | 'reenviar'; sesion?: SesionMesaDto; mesa?: MesaDto; grupo?: GrupoComanda } | null>(null)
  const [renombrarMesa, setRenombrarMesa] = useState<MesaDto | null>(null)
  const [renombrarNombre, setRenombrarNombre] = useState('')
  const [renombrarTitulo, setRenombrarTitulo] = useState('')
  const [tamanoMesa, setTamanoMesa] = useState(112)

  const sesionPorMesa = useMemo(() => {
    const map = new Map<number, SesionMesaDto>()
    sesiones.forEach(s => map.set(s.mesaId, s))
    return map
  }, [sesiones])

  const sesionSeleccionada = mesaSeleccionada ? sesionPorMesa.get(mesaSeleccionada.id) : undefined

  const salones = useMemo(() => {
    const set = new Set(mesas.map(m => m.salon || 'Principal'))
    set.add('Principal')
    set.add(salon)
    return [...set]
  }, [mesas, salon])

  const mesasSalon = useMemo(
    () => mesas.filter(m => (m.salon || 'Principal') === salon),
    [mesas, salon]
  )

  function agregarSalon() {
    const nombre = salonNombre.trim()
    if (!nombre) { notifyError('Indicá el nombre del salón'); return }
    setSalon(nombre)
    setMesaSeleccionada(null)
    setSalonNombre('')
    setAgregarSalonOpen(false)
    notifySuccess(`Salón "${nombre}" creado`)
  }

  const cargar = useCallback(async () => {
    if (!sucursal) return
    setCargando(true)
    try {
      const [m, s, mp] = await Promise.all([
        api.restaurante.listarMesas(sucursal.id),
        api.restaurante.sesionesAbiertas(sucursal.id),
        api.mediosPago.listar(),
      ])
      mp.sort((a, b) => { const p = [1, 4]; const ia = p.indexOf(a.id); const ib = p.indexOf(b.id); if (ia !== -1 && ib !== -1) return ia - ib; if (ia !== -1) return -1; if (ib !== -1) return 1; return a.id - b.id })
      setMesas(m)
      setSesiones(s)
      setMediosPago(mp)
      setMesaSeleccionada(prev => (prev && m.some(mm => mm.id === prev.id)) ? prev : null)
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'Error al cargar mesas'))
    } finally {
      setCargando(false)
    }
  }, [sucursal, notifyError])

  useEffect(() => {
    if (!sucursal) return
    const raf = requestAnimationFrame(() => setCargando(true))
    const run = async () => {
      try {
        const [m, s, mp] = await Promise.all([
          api.restaurante.listarMesas(sucursal.id),
          api.restaurante.sesionesAbiertas(sucursal.id),
          api.mediosPago.listar(),
        ])
        mp.sort((a, b) => { const p = [1, 4]; const ia = p.indexOf(a.id); const ib = p.indexOf(b.id); if (ia !== -1 && ib !== -1) return ia - ib; if (ia !== -1) return -1; if (ib !== -1) return 1; return a.id - b.id })
        setMesas(m)
        setSesiones(s)
        setMediosPago(mp)
        setMesaSeleccionada(prev => (prev && m.some(mm => mm.id === prev.id)) ? prev : null)
      } catch (e: unknown) {
        notifyError(errorMessage(e, 'Error al cargar mesas'))
      } finally {
        setCargando(false)
      }
    }
    void run()
    return () => cancelAnimationFrame(raf)
  }, [sucursal, notifyError])

  useEffect(() => {
    api.preferencias.obtener().then(res => {
      const ancho = Number(res.preferencias?.mesaMapa?.ancho)
      if (Number.isFinite(ancho) && ancho >= 30 && ancho <= 200) setTamanoMesa(ancho)
    }).catch(() => {})
  }, [])

  function cambiarTamanoMesa(nuevo: number) {
    setTamanoMesa(nuevo)
    api.preferencias.guardar({ mesaMapa: { ancho: String(nuevo) } }).catch(() => {})
  }

  async function abrirMesa(mesa: MesaDto) {
    try {
      const sesion = await api.restaurante.abrirSesion(mesa.id)
      setSesiones(prev => [...prev.filter(x => x.id !== sesion.id), sesion])
      setMesaSeleccionada(mesa)
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'No se pudo abrir la mesa'))
    }
  }

  async function cancelarSesion(sesion: SesionMesaDto) {
    try {
      await api.restaurante.cancelarSesion(sesion.id)
      setSesiones(prev => prev.filter(x => x.id !== sesion.id))
      setMesaSeleccionada(null)
      notifySuccess('Cuenta cancelada')
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'No se pudo cancelar la cuenta'))
    }
  }

  function enviarCocina(sesion: SesionMesaDto) {
    const pendientes = sesion.items.filter(i => i.estado === 'Pendiente')
    if (pendientes.length > 0) { void enviarCocinaDirecta(sesion); return }
    const enCocina = sesion.items.filter(i => i.estado === 'EnCocina')
    if (enCocina.length === 0) { notifyError('No hay items para enviar a cocina'); return }
    setConfirmar({ tipo: 'reenviar', sesion })
  }

  async function enviarCocinaDirecta(sesion: SesionMesaDto) {
    const pendientes = sesion.items.filter(i => i.estado === 'Pendiente')
    if (pendientes.length === 0) { notifyError('No hay items pendientes para enviar'); return }
    try {
      for (const it of pendientes) await api.restaurante.cambiarEstadoItem(it.id, 'EnCocina')
      await imprimirComanda(sesion.mesaNumero || String(sesion.mesaId), pendientes)
      await cargar()
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'Error al enviar a cocina'))
    }
  }

  function enviarCocinaGrupo(sesion: SesionMesaDto, grupo: GrupoComanda) {
    const pendientes = sesion.items.filter(i => i.grupo === grupo && i.estado === 'Pendiente')
    if (pendientes.length > 0) { void enviarCocinaGrupoDirecta(sesion, grupo); return }
    const enCocina = sesion.items.filter(i => i.grupo === grupo && i.estado === 'EnCocina')
    if (enCocina.length === 0) { notifyError('No hay items pendientes en este grupo'); return }
    setConfirmar({ tipo: 'reenviar', sesion, grupo })
  }

  async function enviarCocinaGrupoDirecta(sesion: SesionMesaDto, grupo: GrupoComanda) {
    const pendientes = sesion.items.filter(i => i.grupo === grupo && i.estado === 'Pendiente')
    if (pendientes.length === 0) { notifyError('No hay items pendientes en este grupo'); return }
    try {
      for (const it of pendientes) await api.restaurante.cambiarEstadoItem(it.id, 'EnCocina')
      await imprimirComanda(sesion.mesaNumero || String(sesion.mesaId), pendientes, grupo)
      await cargar()
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'Error al enviar a cocina'))
    }
  }

  async function reenviarCocina(sesion: SesionMesaDto, grupo?: GrupoComanda) {
    const enCocina = sesion.items.filter(i => (grupo ? i.grupo === grupo : true) && i.estado === 'EnCocina')
    if (enCocina.length === 0) return
    try {
      await imprimirComanda(sesion.mesaNumero || String(sesion.mesaId), enCocina, grupo)
      await cargar()
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'Error al reenviar a cocina'))
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
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'No se pudo mover el item de grupo'))
    }
  }

  async function cambiarEstadoItem(itemId: number, estado: string) {
    try {
      await api.restaurante.cambiarEstadoItem(itemId, estado)
      setSesiones(prev => prev.map(s => {
        if (s.id !== sesionSeleccionada?.id) return s
        return { ...s, items: s.items.map(i => i.id === itemId ? { ...i, estado: estado as ItemComandaDto['estado'] } : i) }
      }))
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'Error al actualizar el item'))
    }
  }

  async function guardarNotaUnidad(item: ItemComandaDto, nota: string) {
    try {
      await api.restaurante.actualizarItem(item.id, { cantidad: item.cantidad, nota })
      setSesiones(prev => prev.map(s => {
        if (s.id !== item.sesionMesaId) return s
        return { ...s, items: s.items.map(i => i.id === item.id ? { ...i, nota } : i) }
      }))
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'No se pudo guardar la nota'))
    }
  }

  async function crearMesa() {
    if (!sucursal || !nuevaMesaNumero.trim()) return
    if (!/^\d+$/.test(nuevaMesaNumero.trim())) { notifyError('El número de mesa debe ser numérico'); return }
    const salonMesa = nuevoSalonLibre ? nuevoSalon.trim() : nuevoSalon
    if (!salonMesa) { notifyError('Indicá el salón'); return }
    try {
      await api.restaurante.crearMesa({
        sucursalId: sucursal.id,
        numero: nuevaMesaNumero.trim(),
        descripcion: nuevaMesaTitulo.trim() || null,
        posX: 50,
        posY: 50,
        salon: salonMesa,
      })
      setNuevaMesaNumero('')
      setNuevaMesaTitulo('')
      setMostrarNuevaMesa(false)
      await cargar()
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'No se pudo crear la mesa'))
    }
  }

  async function eliminarMesa(mesa: MesaDto) {
    try {
      await api.restaurante.eliminarMesa(mesa.id)
      await cargar()
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'No se pudo eliminar la mesa'))
    }
  }

  function abrirRenombrar(mesa: MesaDto) {
    setRenombrarNombre(mesa.numero)
    setRenombrarTitulo(mesa.descripcion ?? '')
    setRenombrarMesa(mesa)
  }

  async function guardarRenombrado() {
    if (!renombrarMesa) return
    const nombre = renombrarNombre.trim()
    if (!nombre) { notifyError('Indicá el número de la mesa'); return }
    if (!/^\d+$/.test(nombre)) { notifyError('El número de mesa debe ser numérico'); return }
    try {
      await api.restaurante.actualizarMesa(renombrarMesa.id, {
        sucursalId: renombrarMesa.sucursalId,
        numero: nombre,
        descripcion: renombrarTitulo.trim() || null,
        salon: renombrarMesa.salon,
        posX: renombrarMesa.posX,
        posY: renombrarMesa.posY,
      })
      setMesas(prev => prev.map(m => m.id === renombrarMesa.id ? { ...m, numero: nombre, descripcion: renombrarTitulo.trim() || null } : m))
      setMesaSeleccionada(prev => prev?.id === renombrarMesa.id ? { ...prev, numero: nombre, descripcion: renombrarTitulo.trim() || null } : prev)
      setRenombrarMesa(null)
      notifySuccess('Mesa actualizada')
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'No se pudo actualizar la mesa'))
    }
  }

  function handleConfirmar() {
    if (!confirmar) return
    if (confirmar.tipo === 'cancelar' && confirmar.sesion) void cancelarSesion(confirmar.sesion)
    else if (confirmar.tipo === 'eliminar' && confirmar.mesa) void eliminarMesa(confirmar.mesa)
    else if (confirmar.tipo === 'reenviar' && confirmar.sesion) void reenviarCocina(confirmar.sesion, confirmar.grupo)
    setConfirmar(null)
  }

  async function moverMesa(mesa: MesaDto, x: number, y: number) {
    try {
      await api.restaurante.actualizarMesa(mesa.id, {
        sucursalId: mesa.sucursalId,
        numero: mesa.numero,
        descripcion: mesa.descripcion,
        salon: mesa.salon,
        posX: x,
        posY: y,
      })
      setMesas(prev => prev.map(m => m.id === mesa.id ? { ...m, posX: x, posY: y } : m))
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'No se pudo guardar la posición'))
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

  const ultimosItems = (s: SesionMesaDto): ItemEmitido[] => {
    const map = new Map<number, ItemEmitido>()
    s.items
      .filter(i => i.estado !== 'Devuelto' && i.estado !== 'Cancelado')
      .forEach(i => {
        const id = i.productoId ?? i.comboId ?? 0
        const existente = map.get(id)
        if (existente) existente.cantidad += i.cantidad
        else map.set(id, { producto: { id, nombre: i.descripcion, precio: i.precioUnitario }, cantidad: i.cantidad })
      })
    return [...map.values()]
  }

  const mapa = (
    <div
      className="relative h-full rounded-xl border border-gray-200 bg-[radial-gradient(circle_at_1px_1px,#e5e7eb_1px,transparent_0)] bg-[size:22px_22px] overflow-hidden select-none min-w-0"
      onPointerUp={onMapPointerUp}
    >
      {mesasSalon.map(mesa => {
        const sesion = sesionPorMesa.get(mesa.id)
        const seleccionada = mesaSeleccionada?.id === mesa.id
        const escala = tamanoMesa / TAMANO_BASE_MESA
        const pendientes = sesion ? sesion.items.filter(i => i.estado === 'Pendiente').length : 0
        return (
          <div
            key={mesa.id}
            className={`absolute flex flex-col items-center justify-center rounded-2xl border-2 px-1 py-1 shadow-md cursor-pointer transition-colors ${
              seleccionada ? 'ring-2 ring-[oklch(0.52_0.255_278)]' : ''
            } ${sesion ? 'border-orange-400 bg-orange-50' : 'border-emerald-400 bg-emerald-50'}`}
            style={{
              left: `${mesa.posX}%`,
              top: `${mesa.posY}%`,
              width: esCompacto ? tamanoMesa : TAMANO_BASE_MESA,
              minHeight: esCompacto ? Math.round(tamanoMesa * 0.5) : Math.round(TAMANO_BASE_MESA * 0.5),
              transform: esCompacto ? 'translate(-50%, -50%)' : `translate(-50%, -50%) scale(${escala})`,
              touchAction: 'none',
            }}
            onPointerDown={e => { if (editarMapa && !(e.target as HTMLElement).closest('button')) { setDragId(mesa.id); (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId) } }}
            onPointerMove={e => {
              if (!editarMapa || dragId !== mesa.id) return
              const rect = (e.currentTarget.parentElement as HTMLDivElement).getBoundingClientRect()
              const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10
              const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10
              setMesas(prev => prev.map(m => m.id === mesa.id ? { ...m, posX: Math.max(0, Math.min(100, x)), posY: Math.max(0, Math.min(100, y)) } : m))
            }}
            onClick={() => { if (esCompacto && editarMapa) return; setMesaSeleccionada(mesa) }}
          >
            {esCompacto ? (
              <div className="relative flex w-full flex-col items-center justify-center">
                <div className="flex max-w-full items-center justify-center gap-1">
                  <span
                    className="max-w-full whitespace-nowrap text-center font-bold leading-none text-gray-800"
                    style={{ fontSize: Math.max(11, Math.min(Math.round(tamanoMesa * 0.3), Math.floor((tamanoMesa - 8) / Math.max(1, mesa.numero.length * 0.62)))) }}
                  >
                    {mesa.numero}
                  </span>
                  {sesion && pendientes > 0 && (
                    <span
                      className="shrink-0 leading-none text-amber-500"
                      style={{ fontSize: Math.max(8, Math.round(tamanoMesa * 0.18)) }}
                      title="Comanda sin enviar a cocina"
                    >
                      🕐
                    </span>
                  )}
                </div>
                {editarMapa && (
                  <div className="absolute -right-1 -top-1 flex items-center gap-0.5">
                    <button
                      type="button"
                      className="text-gray-500 hover:text-[oklch(0.52_0.255_278)]"
                      onClick={e => { e.stopPropagation(); abrirRenombrar(mesa) }}
                      title="Renombrar mesa"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700"
                      onClick={e => { e.stopPropagation(); setConfirmar({ tipo: 'eliminar', mesa }) }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center gap-1.5">
                  <UtensilsCrossed size={16} className={sesion ? 'text-orange-500' : 'text-emerald-500'} />
                  <span
                    className="max-w-full whitespace-nowrap text-center font-bold leading-none text-gray-800"
                    style={{ fontSize: Math.max(11, Math.min(Math.round(TAMANO_BASE_MESA * 0.24), Math.floor((TAMANO_BASE_MESA - 8) / Math.max(1, mesa.numero.length * 0.62)))) }}
                  >
                    {mesa.numero}
                  </span>
                  {sesion && pendientes > 0 && (
                    <span className="shrink-0 text-amber-500" title="Comanda sin enviar a cocina">
                      🕐
                    </span>
                  )}
                  {editarMapa && (
                    <>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-[oklch(0.52_0.255_278)]"
                        onClick={e => { e.stopPropagation(); abrirRenombrar(mesa) }}
                        title="Renombrar mesa"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={e => { e.stopPropagation(); setConfirmar({ tipo: 'eliminar', mesa }) }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0.5 flex items-center justify-center">
                  {sesion ? (
                    <span className="text-[11px] font-semibold text-orange-600">Ocupada</span>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-600">Libre</span>
                  )}
                </div>
              </>
            )}
          </div>
        )
      })}
      {mesasSalon.length === 0 && !cargando && (
        <div className="absolute inset-0 grid place-items-center text-sm text-gray-400">
          No hay mesas en este salón. Agregá la primera con el botón "Agregar mesa".
        </div>
      )}
    </div>
  )

  const comandaPanel = (compacto: boolean) => (
    <div className={`rounded-xl border border-gray-200 bg-white p-3 ${compacto ? '' : 'h-full overflow-y-auto'} min-w-0`}>
      {!mesaSeleccionada && (
        <p className="text-sm text-gray-500">Seleccioná una mesa para ver su comanda.</p>
      )}

      {mesaSeleccionada && !sesionSeleccionada && (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold text-gray-700">Mesa {mesaSeleccionada.numero} — Libre</p>
            {mesaSeleccionada.descripcion && <p className="text-[11px] text-gray-500">{mesaSeleccionada.descripcion}</p>}
          </div>
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
              {mesaSeleccionada.descripcion && <p className="text-[11px] text-gray-500">{mesaSeleccionada.descripcion}</p>}
            </div>
            <p className="font-bold text-lg text-[oklch(0.52_0.255_278)]">{fmt(sesionSeleccionada.total)}</p>
          </div>

          <div className="flex flex-wrap gap-1.5">
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
            {GRUPOS_COMANDA.map(grupo => {
              const itemsGrupo = sesionSeleccionada.items.filter(i => i.grupo === grupo)
              const pendientes = itemsGrupo.filter(i => i.estado === 'Pendiente').length
              const enCocina = itemsGrupo.filter(i => i.estado === 'EnCocina').length
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
                      <Button size="sm" icon={<Plus size={12} />} onClick={() => { setAgregarItemGrupo(grupo); setAgregarItemSesion(sesionSeleccionada) }}>
                        Agregar
                      </Button>
                      <Button size="sm" variant="secondary" icon={<Printer size={12} />} disabled={pendientes === 0 && enCocina === 0} onClick={() => enviarCocinaGrupo(sesionSeleccionada, grupo)}>
                        Enviar
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {productos.length === 0 && (
                      <p className="px-1 text-[11px] text-gray-300">Sin items en este grupo</p>
                    )}
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
  )

  return (
    <div className="p-4 space-y-2 flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold text-gray-800">Mesas — {sucursal?.nombre || 'Sin sucursal'}</h1>
        {!sucursal && <span className="text-sm text-gray-500">Elegí una sucursal para operar</span>}
      </div>

      {sucursal && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {vista === 'mapa' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-500">Salón</span>
              <select
                value={salon}
                onChange={e => { setSalon(e.target.value); setMesaSeleccionada(null) }}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700 outline-none focus:border-[oklch(0.52_0.255_278)]"
              >
                {salones.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={() => { setSalonNombre(''); setAgregarSalonOpen(true) }}>
                Agregar salón
              </Button>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
          <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 px-1 py-0.5">
            <button
              type="button"
              className="p-0.5 text-gray-500 hover:text-gray-700 disabled:opacity-30"
              disabled={tamanoMesa <= 30}
              onClick={() => cambiarTamanoMesa(tamanoMesa - 16)}
              title="Disminuir tamaño de las mesas"
            >
              <Minus size={14} />
            </button>
            <span className="w-10 text-center text-[10px] font-bold text-gray-600">{tamanoMesa}px</span>
            <button
              type="button"
              className="p-0.5 text-gray-500 hover:text-gray-700 disabled:opacity-30"
              disabled={tamanoMesa >= 200}
              onClick={() => cambiarTamanoMesa(tamanoMesa + 16)}
              title="Aumentar tamaño de las mesas"
            >
              <Plus size={14} />
            </button>
          </div>
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
          <Button size="sm" icon={<Plus size={14} />} onClick={() => { setNuevaMesaNumero(''); setNuevaMesaTitulo(''); setNuevoSalon(salon); setNuevoSalonLibre(false); setMostrarNuevaMesa(true) }}>
            Agregar mesa
          </Button>
          <button
            type="button"
            onClick={() => navigate('/ayuda?key=' + HELP_KEYS.mesas)}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-[oklch(0.52_0.255_278)] hover:bg-gray-100 transition-colors"
            aria-label="Ayuda"
            title="Ayuda"
          >
            <HelpCircle size={17} />
          </button>
          </div>
        </div>
      )}

      {vista === 'cocina' ? (
        <CocinaView
          sesiones={sesiones}
          onRefrescar={() => cargar()}
          onImprimir={imprimirComanda}
          onCambiarEstado={cambiarEstadoItem}
        />
      ) : esCompacto ? (
        <div className="flex-1 min-h-0">
          {mapa}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-3 flex-1 min-h-0">
          {mapa}
          {comandaPanel(false)}
        </div>
      )}

      {esCompacto && mesaSeleccionada && (
        <Dialog
          open
          onClose={() => setMesaSeleccionada(null)}
          title={`Mesa ${mesaSeleccionada.numero}${mesaSeleccionada.descripcion ? ` — ${mesaSeleccionada.descripcion}` : ''}`}
          width="xl"
          fillHeight
        >
          {comandaPanel(true)}
        </Dialog>
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
        <label className="text-xs font-semibold text-gray-600">
          Número de mesa <span className="text-red-500">*</span>
          <input
            autoFocus
            value={nuevaMesaNumero}
            onChange={e => setNuevaMesaNumero(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => { if (e.key === 'Enter') crearMesa() }}
            placeholder="Ej. 1, 2, 3"
            inputMode="numeric"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="mt-3 block text-xs font-semibold text-gray-600">
          Título (opcional)
          <input
            value={nuevaMesaTitulo}
            onChange={e => setNuevaMesaTitulo(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') crearMesa() }}
            placeholder="Ej. Mesa de la ventana"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="mt-3">
          <label className="text-xs font-semibold text-gray-600">Salón</label>
          <select
            value={nuevoSalonLibre ? '__libre__' : nuevoSalon}
            onChange={e => {
              if (e.target.value === '__libre__') { setNuevoSalonLibre(true); setNuevoSalon('') }
              else { setNuevoSalonLibre(false); setNuevoSalon(e.target.value) }
            }}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {salones.map(s => <option key={s} value={s}>{s}</option>)}
            <option value="__libre__">＋ Nuevo salón…</option>
          </select>
          {nuevoSalonLibre && (
            <input
              value={nuevoSalon}
              onChange={e => setNuevoSalon(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') crearMesa() }}
              placeholder="Nombre del salón (ej: Terraza)"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          )}
        </div>
      </Dialog>

      <Dialog open={agregarSalonOpen} onClose={() => setAgregarSalonOpen(false)} title="Nuevo salón" width="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAgregarSalonOpen(false)}>Cancelar</Button>
            <Button onClick={agregarSalon} disabled={!salonNombre.trim()}>Crear salón</Button>
          </>
        }
      >
        <input
          autoFocus
          value={salonNombre}
          onChange={e => setSalonNombre(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') agregarSalon() }}
          placeholder="Nombre del salón (ej: Terraza)"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </Dialog>

      <Dialog open={renombrarMesa != null} onClose={() => setRenombrarMesa(null)} title={`Editar mesa ${renombrarMesa?.numero ?? ''}`} width="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRenombrarMesa(null)}>Cancelar</Button>
            <Button onClick={guardarRenombrado} disabled={!renombrarNombre.trim()}>Guardar</Button>
          </>
        }
      >
        <label className="block text-xs font-semibold text-gray-600">
          Número de mesa <span className="text-red-500">*</span>
          <input
            autoFocus
            value={renombrarNombre}
            onChange={e => setRenombrarNombre(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => { if (e.key === 'Enter') guardarRenombrado() }}
            placeholder="Ej. 1, 2, 3"
            inputMode="numeric"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="mt-3 block text-xs font-semibold text-gray-600">
          Título (opcional)
          <input
            value={renombrarTitulo}
            onChange={e => setRenombrarTitulo(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') guardarRenombrado() }}
            placeholder="Ej. Mesa de la ventana"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </Dialog>

      <ConfirmDialog
        open={confirmar != null}
        title={confirmar?.tipo === 'cancelar' ? 'Cancelar cuenta' : confirmar?.tipo === 'eliminar' ? 'Eliminar mesa' : 'Reenviar a cocina'}
        description={confirmar?.tipo === 'cancelar'
          ? `¿Cancelar la cuenta de la mesa ${confirmar?.sesion?.mesaNumero || confirmar?.sesion?.mesaId}? Los items se descartan.`
          : confirmar?.tipo === 'eliminar'
            ? `¿Eliminar la mesa ${confirmar?.mesa?.numero}?`
            : `La orden de la mesa ${confirmar?.sesion?.mesaNumero || confirmar?.sesion?.mesaId} ya está en cocina. ¿Volver a enviar?`}
        cancelLabel={confirmar?.tipo === 'cancelar' ? 'No cancelar' : confirmar?.tipo === 'eliminar' ? 'Cancelar' : 'No enviar'}
        confirmLabel={confirmar?.tipo === 'cancelar' ? 'Cancelar cuenta' : confirmar?.tipo === 'eliminar' ? 'Eliminar' : 'Volver a enviar'}
        confirmVariant={confirmar?.tipo === 'reenviar' ? 'primary' : 'destructive'}
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
  const editable = item.estado === 'Pendiente'
  const [nota, setNota] = useState(item.nota ?? '')
  const [prevKey, setPrevKey] = useState(`${item.id}|${item.nota ?? ''}`)

  if (`${item.id}|${item.nota ?? ''}` !== prevKey) {
    setPrevKey(`${item.id}|${item.nota ?? ''}`)
    setNota(item.nota ?? '')
  }

  function commitNota() {
    const valor = nota.trim()
    if (valor === (item.nota ?? '')) return
    onGuardarNota(item, valor)
  }

  return (
    <div className={`p-2 ${esTerminal ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 min-w-0">
          {editable && (
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
      {editable ? (
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
      ) : (
        item.nota && <p className="text-[11px] text-gray-400 mt-0.5">📝 {item.nota}</p>
      )}
      <div className="mt-1 flex items-center justify-between">
        <span className={`text-[10px] font-bold uppercase tracking-wide ${estadoColor(item.estado)}`}>{item.estado}</span>
        <div className="flex items-center gap-1">
          {(item.estado === 'Pendiente' || item.estado === 'EnCocina') && (
            <button type="button" title="Servido" className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" onClick={() => onCambiarEstado(item.id, 'Servido')}>
              <Check size={14} />
            </button>
          )}
          {editable && (
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
    <div className="rounded-xl border border-gray-200 bg-white p-3 flex-1 min-h-0 overflow-y-auto">
      <div className="flex items-center justify-between mb-3 shrink-0">
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
  const [prevItem, setPrevItem] = useState<ItemComandaDto | null>(item)

  if (item !== prevItem) {
    setPrevItem(item)
    if (item) {
      setCantidad(item.cantidad)
      setNota(item.nota ?? '')
    }
  }

  async function guardar() {
    if (!item) return
    try {
      await api.restaurante.actualizarItem(item.id, { cantidad, nota })
      await onGuardado()
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'No se pudo actualizar el item'))
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

interface CantidadStepperProps {
  value: number
  onChange: (n: number) => void
  min?: number
  onEnter?: () => void
  onMinusAtMin?: () => void
}

function CantidadStepper({ value, onChange, min = 1, onEnter, onMinusAtMin }: CantidadStepperProps) {
  const atMin = value <= min
  return (
    <div className="inline-flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white shadow-[0_1px_2px_0_rgba(0,0,0,0.04)]">
      <button
        type="button"
        title="Reducir cantidad"
        disabled={atMin && !onMinusAtMin}
        onClick={() => (atMin ? onMinusAtMin?.() : onChange(value - 1))}
        className="flex h-7 w-7 shrink-0 items-center justify-center text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Minus size={13} strokeWidth={2.5} />
      </button>
      <input
        type="number"
        min={min}
        step={1}
        value={value}
        onChange={e => {
          const n = Math.round(Number(e.target.value))
          if (Number.isFinite(n) && n >= min) onChange(n)
        }}
        onKeyDown={e => { if (e.key === 'Enter') onEnter?.() }}
        className="h-7 w-9 border-x border-gray-200 bg-white text-center text-[13px] font-bold tabular-nums text-gray-800 outline-none focus:bg-[oklch(0.52_0.255_278_/_0.06)]"
      />
      <button
        type="button"
        title="Aumentar cantidad"
        onClick={() => onChange(value + 1)}
        className="flex h-7 w-7 shrink-0 items-center justify-center text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200"
      >
        <Plus size={13} strokeWidth={2.5} />
      </button>
    </div>
  )
}

interface AgregarItemDialogProps {
  sesion: SesionMesaDto | null
  grupo: GrupoComanda
  sucursalId?: number
  onClose: () => void
  onAdded: () => Promise<void>
}

interface CarritoItem {
  productoId?: number
  comboId?: number
  descripcion: string
  precio: number
  notas: (string | null)[]
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
  const [carrito, setCarrito] = useState<CarritoItem[]>([])
  const [enviando, setEnviando] = useState(false)
  const [existentes, setExistentes] = useState<ItemComandaDto[]>([])
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [cantidadEdit, setCantidadEdit] = useState('1')
  const [notaEdit, setNotaEdit] = useState('')
  const [editandoCarrito, setEditandoCarrito] = useState<number | null>(null)
  const [cantidadCarritoEdit, setCantidadCarritoEdit] = useState('1')
  const [notasCarritoEdit, setNotasCarritoEdit] = useState<string[]>([])

  // Cantidad parseada y válida (>= 1); 0 si está vacío o mal escrito (se valida al agregar).
  const unidadesValidas = (() => {
    const n = Math.round(Number(cantidad))
    return Number.isFinite(n) && n >= 1 ? n : 0
  })()

  const totalUnidades = carrito.reduce((s, c) => s + c.notas.length, 0)
  const totalCarrito = carrito.reduce((s, c) => s + c.precio * c.notas.length, 0)

  // Reset al abrir el diálogo (cambia la sesión), NO en cada tecla.
  const [prevSesion, setPrevSesion] = useState<SesionMesaDto | null>(sesion)

  if (sesion !== prevSesion) {
    setPrevSesion(sesion)
    if (sesion) {
      setProductos([])
      setCombos([])
      setQ('')
      setNota('')
      setCantidad('1')
      setNotas([])
      setSeleccionado(null)
      setCarrito([])
      setEnviando(false)
      setExistentes(sesion.items.filter(i => i.estado === 'Pendiente'))
      setEditandoId(null)
      setCantidadEdit('1')
      setNotaEdit('')
      setEditandoCarrito(null)
      setCantidadCarritoEdit('1')
      setNotasCarritoEdit([])
    }
  }

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
    setQ('')
    setNota('')
    setNotas(Array.from({ length: unidadesValidas || 1 }, () => ''))
  }

  function seleccionarCombo(c: ComboDto) {
    setSeleccionado({ productoId: undefined, comboId: c.id, descripcion: c.descCombo, precio: c.precio })
    setQ('')
    setNota('')
    setNotas(Array.from({ length: unidadesValidas || 1 }, () => ''))
  }

  function agregar() {
    if (!seleccionado) return
    const unidades = unidadesValidas
    if (unidades < 1) {
      notifyError('Ingresá una cantidad válida (mayor a 0)')
      return
    }
    const notasUnidades: (string | null)[] = unidades > 1
      ? notas.map(n => n.trim() || null)
      : Array.from({ length: unidades }, () => nota.trim() || null)

    setCarrito(prev => {
      const existente = prev.find(c =>
        c.productoId === seleccionado.productoId && c.comboId === seleccionado.comboId)
      if (existente) {
        return prev.map(c => (c === existente ? { ...c, notas: [...c.notas, ...notasUnidades] } : c))
      }
      return [...prev, {
        productoId: seleccionado.productoId,
        comboId: seleccionado.comboId,
        descripcion: seleccionado.descripcion,
        precio: seleccionado.precio,
        notas: notasUnidades,
      }]
    })
    setCantidad('1')
    setNota('')
    setNotas([])
  }

  function quitarDelCarrito(index: number) {
    setCarrito(prev => prev.filter((_, i) => i !== index))
  }

  function cambiarCantidadCarrito(index: number, n: number) {
    if (n < 1) { quitarDelCarrito(index); return }
    setCarrito(prev => prev.map((item, i) => {
      if (i !== index) return item
      const notas: (string | null)[] = Array.from({ length: n }, (_, u) => item.notas[u] ?? '')
      return { ...item, notas }
    }))
  }

  function iniciarEdicionCarrito(index: number) {
    const c = carrito[index]
    if (!c) return
    setEditandoCarrito(index)
    setCantidadCarritoEdit(String(c.notas.length))
    setNotasCarritoEdit(c.notas.map(n => n ?? ''))
  }

  function guardarEdicionCarrito() {
    if (editandoCarrito == null) return
    const c = Math.round(Number(cantidadCarritoEdit))
    if (!Number.isFinite(c) || c < 1) { notifyError('Ingresá una cantidad válida (mayor a 0)'); return }
    setCarrito(prev => prev.map((item, i) => {
      if (i !== editandoCarrito) return item
      const notas: (string | null)[] = Array.from({ length: c }, (_, u) => notasCarritoEdit[u]?.trim() || null)
      return { ...item, notas }
    }))
    setEditandoCarrito(null)
  }

  function cambiarCantidadEdicionCarrito(n: number) {
    if (!Number.isFinite(n) || n < 1) return
    setCantidadCarritoEdit(String(n))
    setNotasCarritoEdit(prev => Array.from({ length: n }, (_, u) => prev[u] ?? ''))
  }

  function setCantidadControl(n: number) {
    if (!Number.isFinite(n) || n < 1) return
    setCantidad(String(n))
    setNotas(prev => Array.from({ length: n }, (_, i) => prev[i] ?? ''))
  }

  function iniciarEdicion(item: ItemComandaDto) {
    setEditandoId(item.id)
    setCantidadEdit(String(item.cantidad))
    setNotaEdit(item.nota ?? '')
  }

  async function guardarEdicion() {
    if (!editandoId) return
    const c = Math.round(Number(cantidadEdit))
    if (!Number.isFinite(c) || c < 1) { notifyError('Ingresá una cantidad válida (mayor a 0)'); return }
    try {
      const act = await api.restaurante.actualizarItem(editandoId, { cantidad: c, nota: notaEdit.trim() })
      setExistentes(prev => prev.map(i => (i.id === editandoId ? act : i)))
      setEditandoId(null)
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'No se pudo actualizar el item'))
    }
  }

  async function quitarExistente(itemId: number) {
    try {
      await api.restaurante.cambiarEstadoItem(itemId, 'Cancelado')
      setExistentes(prev => prev.filter(i => i.id !== itemId))
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'No se pudo quitar el item'))
    }
  }

  async function confirmar() {
    if (!sesion) return
    if (carrito.length === 0) return
    setEnviando(true)
    try {
      for (const c of carrito) {
        await api.restaurante.agregarItem(sesion.id, {
          productoId: c.productoId,
          comboId: c.comboId,
          cantidad: c.notas.length,
          notas: c.notas,
          grupo,
        })
      }
      setCarrito([])
      await onAdded()
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'No se pudieron agregar los items'))
    } finally {
      setEnviando(false)
    }
  }

  function handleEnter() {
    if (seleccionado) { agregar(); return }
    if (tab === 'productos' && productos.length > 0) seleccionarProducto(productos[0])
    else if (tab === 'combos' && combos.filter(c => c.activo).length > 0) seleccionarCombo(combos.filter(c => c.activo)[0])
  }

  const estaSeleccionado = (productoId?: number, comboId?: number) =>
    seleccionado != null &&
    seleccionado.productoId === (productoId ?? undefined) &&
    seleccionado.comboId === (comboId ?? undefined)

  return (
    <Dialog open={!!sesion} onClose={onClose} title="Agregar a la comanda" width="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={agregar} disabled={!seleccionado}>Agregar</Button>
          <Button variant="confirm" onClick={confirmar} disabled={carrito.length === 0} loading={enviando}>
            {totalUnidades > 0 ? `Confirmar (${totalUnidades})` : 'Confirmar'}
          </Button>
        </>
      }
    >
      <div className="grid h-[60vh] grid-cols-[1fr_320px] gap-4">
        {/* Columna principal: elegir productos */}
        <div className="flex min-h-0 flex-col">
          <div className="flex shrink-0 gap-1 rounded-lg bg-gray-100 p-1">
            {(['productos', 'combos'] as const).map(t => (
              <button key={t} type="button" onClick={() => { setTab(t); setSeleccionado(null) }}
                className={`flex-1 rounded-md py-1.5 text-xs font-bold uppercase tracking-wide ${tab === t ? 'bg-white shadow text-[oklch(0.52_0.255_278)]' : 'text-gray-500'}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === 'productos' && (
            <div className="relative mt-2 shrink-0">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input autoFocus value={q} onChange={e => setQ(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleEnter() }}
                placeholder="Buscar por nombre o código…"
                className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm" />
            </div>
          )}

          <div className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto">
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

          {seleccionado && (
            <div className="mt-2 flex shrink-0 items-center justify-between gap-2 rounded-lg border border-[oklch(0.52_0.255_278)] bg-[oklch(0.52_0.255_278_/_0.06)] px-3 py-2">
              <span className="min-w-0 truncate text-sm font-semibold text-gray-800">{seleccionado.descripcion}</span>
              <span className="shrink-0 font-semibold text-gray-600">{fmt(seleccionado.precio)}</span>
            </div>
          )}

          <div className="mt-2 grid shrink-0 grid-cols-2 gap-2">
            <label className="text-xs font-semibold text-gray-600">
              Cantidad
              <div className="mt-1">
                <CantidadStepper value={unidadesValidas} onChange={setCantidadControl} onEnter={handleEnter} />
              </div>
            </label>
            {unidadesValidas > 1 ? (
              <div className="text-xs font-semibold text-gray-600">
                Nota por unidad
                <div className="mt-1 h-[80px] space-y-1 overflow-y-auto">
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
              <div className="text-xs font-semibold text-gray-600">
                Nota (opcional)
                <div className="mt-1 h-[80px] space-y-1 overflow-y-auto">
                  <input value={nota} onChange={e => setNota(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleEnter() }}
                    placeholder="Ej: sin cebolla"
                    className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
                </div>
              </div>
            )}
          </div>

          {!seleccionado && (
            <p className="mt-2 shrink-0 text-xs text-gray-400">Tocá un producto para seleccionarlo y después confirmá con Enter o "Agregar".</p>
          )}
          {seleccionado && (
            <p className="mt-2 shrink-0 text-xs text-gray-400">Tocá "Agregar" para sumarlo al resumen. Podés seguir agregando otros y confirmás todo junto.</p>
          )}
        </div>

        {/* Anexo derecho: resumen */}
        <div className="flex min-h-0 flex-col rounded-xl border border-gray-200 bg-gray-50 p-2">
          <div className="mb-1.5 flex shrink-0 items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
              Resumen{totalUnidades > 0 && ` · ${totalUnidades} unidades`}
            </span>
            {carrito.length > 0 && (
              <button type="button" className="text-[11px] font-semibold text-red-500 hover:text-red-700" onClick={() => setCarrito([])}>
                Vaciar
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
            {carrito.length === 0 && existentes.length === 0 ? (
              <p className="text-xs text-gray-400">Todavía no agregaste nada.</p>
            ) : (
              <>
                {carrito.length > 0 && (
                  <p className="pt-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    Nuevos · {totalUnidades} unidades
                  </p>
                )}
                {carrito.map((c, i) => (
                  <div key={`${c.productoId ?? 'c'}-${c.comboId ?? 0}`} className="rounded-md border border-gray-200 bg-white px-2 py-1.5">
                    {editandoCarrito === i ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-gray-800">{c.descripcion}</p>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <CantidadStepper
                              value={Math.max(1, Math.round(Number(cantidadCarritoEdit)) || 1)}
                              onChange={cambiarCantidadEdicionCarrito}
                              onEnter={guardarEdicionCarrito}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          {notasCarritoEdit.map((n, u) => (
                            <input key={u} value={n}
                              onChange={e => setNotasCarritoEdit(prev => prev.map((x, j) => (j === u ? e.target.value : x)))}
                              onKeyDown={e => { if (e.key === 'Enter') guardarEdicionCarrito() }}
                              placeholder={Number(cantidadCarritoEdit) > 1 ? `Nota unidad ${u + 1}` : 'Nota (ej: sin cebolla)'}
                              className="w-full rounded-md border border-gray-300 px-2 py-1 text-[11px] outline-none focus:border-[oklch(0.52_0.255_278)]"
                            />
                          ))}
                        </div>
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" className="px-2 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700" onClick={() => setEditandoCarrito(null)}>
                            Cancelar
                          </button>
                          <button type="button" className="px-2 py-1 text-[11px] font-semibold text-[oklch(0.52_0.255_278)] hover:opacity-80" onClick={guardarEdicionCarrito}>
                            Guardar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{c.descripcion}</span>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <CantidadStepper
                              value={c.notas.length}
                              onChange={n => cambiarCantidadCarrito(i, n)}
                              onMinusAtMin={() => quitarDelCarrito(i)}
                            />
                          </div>
                          <span className="shrink-0 text-[11px] font-semibold text-gray-500 tabular-nums">{fmt(c.precio * c.notas.length)}</span>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button type="button" title="Editar" className="p-1 text-gray-400 hover:text-[oklch(0.52_0.255_278)]" onClick={() => iniciarEdicionCarrito(i)}>
                              <Pencil size={12} />
                            </button>
                            <button type="button" className="p-1 text-gray-400 hover:text-red-500" title="Quitar del resumen" onClick={() => quitarDelCarrito(i)}>
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                        {c.notas.some(n => n?.trim()) && (
                          <div className="mt-1 space-y-0.5">
                            {c.notas.map((n, u) => (n?.trim() ? (
                              <p key={u} className="truncate text-[11px] text-gray-400">📝 {n}</p>
                            ) : null))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}

                {existentes.length > 0 && (
                  <>
                    <p className="pt-1.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                      En la mesa · {existentes.length} sin enviar
                    </p>
                    {existentes.map(item => (
                      <div key={item.id} className="rounded-md border border-gray-200 bg-white px-2 py-1.5">
                        {editandoId === item.id ? (
                          <div className="space-y-1">
                            <p className="truncate text-xs font-semibold text-gray-800">{item.descripcion}</p>
                            <div className="grid grid-cols-2 gap-1">
                              <label className="text-[10px] font-semibold text-gray-500">
                                Cantidad
                                <div className="mt-0.5">
                                  <CantidadStepper
                                    value={Math.max(1, Math.round(Number(cantidadEdit)) || 1)}
                                    onChange={n => setCantidadEdit(String(n))}
                                    onEnter={guardarEdicion}
                                  />
                                </div>
                              </label>
                              <label className="text-[10px] font-semibold text-gray-500">
                                Nota
                                <input
                                  value={notaEdit}
                                  onChange={e => setNotaEdit(e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') guardarEdicion() }}
                                  placeholder="Sin cebolla"
                                  className="mt-0.5 w-full rounded-md border border-gray-300 px-2 py-1 text-[11px] outline-none focus:border-[oklch(0.52_0.255_278)]"
                                />
                              </label>
                            </div>
                            <div className="flex items-center justify-end gap-1">
                              <button type="button" className="px-2 py-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700" onClick={() => setEditandoId(null)}>
                                Cancelar
                              </button>
                              <button type="button" className="px-2 py-1 text-[11px] font-semibold text-[oklch(0.52_0.255_278)] hover:opacity-80" onClick={guardarEdicion}>
                                Guardar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between gap-2">
                              <span className="min-w-0 truncate text-sm text-gray-800">
                                {item.cantidad > 1 ? `${item.cantidad} x ` : ''}{item.descripcion}
                              </span>
                              <div className="flex shrink-0 items-center gap-0.5">
                                <span className="text-[11px] font-semibold text-gray-500">{fmt(item.subtotal)}</span>
                                <button type="button" title="Editar" className="p-1 text-gray-400 hover:text-[oklch(0.52_0.255_278)]" onClick={() => iniciarEdicion(item)}>
                                  <Pencil size={12} />
                                </button>
                                <button type="button" title="Quitar de la mesa" className="p-1 text-gray-400 hover:text-red-500" onClick={() => quitarExistente(item.id)}>
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                            {item.nota && <p className="text-[11px] text-gray-400">📝 {item.nota}</p>}
                          </>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
          {carrito.length > 0 && (
            <div className="mt-2 flex shrink-0 items-center justify-between border-t border-gray-200 pt-2">
              <span className="text-xs font-semibold text-gray-600">Total</span>
              <span className="font-bold text-[oklch(0.52_0.255_278)]">{fmt(totalCarrito)}</span>
            </div>
          )}
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
  const [prevDe, setPrevDe] = useState<SesionMesaDto | null>(de)

  if (de !== prevDe) {
    setPrevDe(de)
    if (de) setHaciaId(sesiones[0]?.id ?? null)
  }

  async function unificar() {
    if (!de || !haciaId) return
    setUnificando(true)
    try {
      await api.restaurante.unificar(de.id, haciaId)
      await onDone()
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'No se pudo unificar'))
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
  const [monto, setMonto] = useState<string>(() => (sesion?.total ?? 0).toFixed(2))
  const montoNum = parseFloat(monto) || 0
  const [clienteId, setClienteId] = useState<number | null>(null)
  const [clientes, setClientes] = useState<ClienteDto[]>([])
  const [cobrando, setCobrando] = useState(false)
  const [prevSesion, setPrevSesion] = useState<SesionMesaDto | null>(sesion)

  if (sesion !== prevSesion) {
    setPrevSesion(sesion)
    setMonto((sesion?.total ?? 0).toFixed(2))
  }

  useEffect(() => {
    if (!sesion) return
    api.clientes.listar('', 1, 50).then(r => setClientes(r.items)).catch(() => {})
  }, [sesion])

  const medio = mediosPago.find(m => m.id === medioId)

  const iconMap: Record<number, React.ReactNode> = {
    1: <Banknote size={16} strokeWidth={1.75} />,
    2: <ArrowRightLeft size={16} strokeWidth={1.75} />,
    3: <CreditCard size={16} strokeWidth={1.75} />,
    4: <Smartphone size={16} strokeWidth={1.75} />,
    5: <QrCode size={16} strokeWidth={1.75} />,
  }

  async function cobrar() {
    if (!sesion) return
    if (montoNum <= 0) { notifyError('Monto inválido'); return }
    if (montoNum < sesion.total && !clienteId) { notifyError('Si el pago es menor al total, elegí un cliente (genera deuda)'); return }
    setCobrando(true)
    try {
      const pago: { medioPagoId: number; monto: number; conCambio?: number } = { medioPagoId: medioId, monto: montoNum }
      if (medio?.pagaVuelto && montoNum > sesion.total) pago.conCambio = montoNum
      const res = await api.restaurante.cobrar(sesion.id, { pagos: [pago], clienteId: clienteId ?? undefined })
      onCobrado(res)
    } catch (e: unknown) {
      notifyError(errorMessage(e, 'No se pudo cobrar la cuenta'))
    } finally {
      setCobrando(false)
    }
  }

  return (
    <Dialog open={!!sesion} onClose={onClose} title="Cobrar cuenta" width="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="confirm" onClick={cobrar} loading={cobrando}>Cobrar {fmt(montoNum)}</Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
          <span className="text-sm text-gray-600">Total mesa</span>
          <span className="font-bold text-[oklch(0.52_0.255_278)]">{fmt(sesion?.total ?? 0)}</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5" role="group" aria-label="Medio de pago">
          {mediosPago.map(mp => {
            const estaSeleccionado = medioId === mp.id
            return (
              <button key={mp.id} type="button" title={mp.nombre}
                onClick={() => setMedioId(mp.id)}
                className={`flex flex-col items-center justify-center gap-[3px] rounded-xl border py-2.5 px-1 transition-all duration-150 select-none ${estaSeleccionado ? 'border-[oklch(0.52_0.255_278)] bg-[oklch(0.52_0.255_278)] text-white shadow-[0_2px_8px_-2px_oklch(0.52_0.255_278_/_0.40)]' : 'border-gray-200 bg-white text-gray-400 hover:border-[oklch(0.52_0.255_278_/_0.35)] hover:bg-[oklch(0.52_0.255_278_/_0.05)] hover:text-[oklch(0.52_0.255_278)]'}`}
                aria-pressed={estaSeleccionado}
              >
                {iconMap[mp.id] ?? <Banknote size={16} strokeWidth={1.75} />}
                <span className="w-full truncate text-center text-[9px] font-bold uppercase tracking-wide leading-none">{mp.nombre}</span>
              </button>
            )
          })}
        </div>

        <MontoInput
          label="Monto recibido"
          value={monto}
          onChange={setMonto}
          warning={montoNum < (sesion?.total ?? 0) && !clienteId}
          hint={montoNum < (sesion?.total ?? 0) && !clienteId ? 'El pago es menor al total: elegí un cliente (genera deuda)' : undefined}
        />

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