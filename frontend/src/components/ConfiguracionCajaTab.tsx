import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../api/client'
import Card from './ui/Card'
import SelectAltaCruzada from './ui/SelectAltaCruzada'
import TimeInput from './ui/TimeInput'
import { Plus, Trash2, Check, X } from 'lucide-react'
import type { EnvioCierreCajaConfig } from '../types'
import { normalizarEnvioCierre, normalizarTelefonoWhatsApp } from '../lib/cierreCaja'
import { sanitizePhone } from '../lib/whatsapp'

type ModoPeriodo = 'duracion' | 'horario' | ''

type Periodo = { inicio: string; fin: string }
type FilaPeriodo = Periodo & { id: number }

const MINUTOS_DIA = 24 * 60
const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/

function formatHora(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function aMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function pertenece(t: Periodo, hhmm: string): boolean {
  const h = aMin(hhmm)
  const ini = aMin(t.inicio)
  const fin = aMin(t.fin)
  if (ini === fin) return true
  if (ini < fin) return h >= ini && h < fin
  // Cruza medianoche (Inicio > Fin)
  return h >= ini || h < fin
}

function seSuperponen(a: Periodo, b: Periodo): boolean {
  const partesA = a.inicio < a.fin ? [[aMin(a.inicio), aMin(a.fin)]] : (a.inicio === a.fin ? [[0, MINUTOS_DIA]] : [[aMin(a.inicio), MINUTOS_DIA], [0, aMin(a.fin)]])
  const partesB = b.inicio < b.fin ? [[aMin(b.inicio), aMin(b.fin)]] : (b.inicio === b.fin ? [[0, MINUTOS_DIA]] : [[aMin(b.inicio), MINUTOS_DIA], [0, aMin(b.fin)]])
  for (const [as, ae] of partesA as [number, number][]) {
    for (const [bs, be] of partesB as [number, number][]) {
      if (as < be && bs < ae) return true
    }
  }
  return false
}

function haySuperposicion(lista: Periodo[]): boolean {
  return lista.some((p, i) => lista.slice(0, i).some(q => seSuperponen(p, q)))
}

function resumenTurno(p: Periodo): string {
  if (!HORA_VALIDA.test(p.inicio) || !HORA_VALIDA.test(p.fin)) return ''
  const ini = aMin(p.inicio)
  const fin = aMin(p.fin)
  let dur: number
  if (ini === fin) dur = MINUTOS_DIA
  else if (ini < fin) dur = fin - ini
  else dur = MINUTOS_DIA - ini + fin
  const hs = Math.floor(dur / 60)
  const min = dur % 60
  return min === 0 ? `${hs} hs` : `${hs} hs ${min} min`
}

function ordenar(v: FilaPeriodo[]): FilaPeriodo[] {
  return [...v].sort((a, b) => {
    if (!HORA_VALIDA.test(a.inicio)) return 1
    if (!HORA_VALIDA.test(b.inicio)) return -1
    return aMin(a.inicio) - aMin(b.inicio)
  })
}

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function AltaDestinatario({
  label,
  placeholder,
  validador,
  onAgregar,
  prefijo,
}: {
  label: string
  placeholder: string
  validador: (v: string) => boolean
  onAgregar: (v: string) => void
  prefijo?: string
}) {
  const [abierto, setAbierto] = useState(false)
  const [valor, setValor] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const abrir = () => {
    setValor('')
    setError(false)
    setAbierto(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const confirmar = () => {
    let v = valor.trim().replace(/\D/g, '')
    if (prefijo) {
      if (v.startsWith('549')) v = v.slice(3)
      else if (v.startsWith('54')) v = v.slice(2)
      v = `${prefijo}${v}`
    }
    if (!validador(v)) {
      setError(true)
      return
    }
    onAgregar(v)
    setAbierto(false)
  }

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={abrir}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg px-2 py-1.5 transition-colors"
      >
        <Plus size={14} /> {label}
      </button>
    )
  }

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-1.5">
        {prefijo ? (
          <div className={`flex flex-1 min-w-0 items-center border rounded-lg focus-within:ring-2 focus-within:ring-[var(--color-primary-ring)] focus-within:border-[var(--color-primary)] transition-all duration-150 ${
            error ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`}>
            <span className="pl-2.5 text-sm text-gray-500 select-none">{prefijo}</span>
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              value={valor}
              onChange={e => { setValor(e.target.value.replace(/\D/g, '')); setError(false) }}
              onKeyDown={e => {
                if (e.key === 'Enter') confirmar()
                if (e.key === 'Escape') setAbierto(false)
              }}
              placeholder={placeholder}
              className="flex-1 min-w-0 px-2.5 py-1.5 text-sm focus:outline-none bg-transparent"
            />
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={valor}
            onChange={e => { setValor(e.target.value); setError(false) }}
            onKeyDown={e => {
              if (e.key === 'Enter') confirmar()
              if (e.key === 'Escape') setAbierto(false)
            }}
            placeholder={placeholder}
            className={`flex-1 min-w-0 px-2.5 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] outline-none transition-all duration-150 ${
              error ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
        )}
        <button
          type="button"
          onClick={confirmar}
          className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
          title="Confirmar"
        >
          <Check size={16} />
        </button>
        <button
          type="button"
          onClick={() => setAbierto(false)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          title="Cancelar"
        >
          <X size={16} />
        </button>
      </div>
      {error && <p className="text-xs text-red-500 pl-1">El formato no es válido.</p>}
    </div>
  )
}

function ModoCajaCard({
  activo,
  titulo,
  descripcion,
  onSeleccionar,
  children,
}: {
  activo: boolean
  titulo: string
  descripcion: string
  onSeleccionar: (e: { target: EventTarget }) => void
  children?: ReactNode
}) {
  return (
    <div
      role="button"
      aria-pressed={activo}
      tabIndex={activo ? -1 : 0}
      onClick={onSeleccionar}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !activo) {
          e.preventDefault()
          onSeleccionar({ target: e.currentTarget })
        }
      }}
      className={`rounded-2xl border-2 p-4 transition-all duration-150 ${
        activo
          ? 'border-[var(--color-primary)] bg-white shadow-sm'
          : 'border-gray-200 bg-gray-50 opacity-70 hover:opacity-100 cursor-pointer'
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${activo ? 'border-[var(--color-primary)]' : 'border-gray-400'}`}>
          {activo && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />}
        </span>
        <h4 className={`text-sm font-semibold ${activo ? 'text-gray-800' : 'text-gray-500'}`}>{titulo}</h4>
      </div>
      {children}
      {descripcion && <p className="text-xs text-gray-400 mt-3 leading-relaxed">{descripcion}</p>}
    </div>
  )
}

export default function ConfiguracionCajaTab() {
  const [modo, setModo] = useState<ModoPeriodo>('')
  const [cantidad, setCantidad] = useState('8')
  const [unidad, setUnidad] = useState('horas')
  const [periodos, setPeriodos] = useState<FilaPeriodo[]>([])
  const [cargado, setCargado] = useState(false)
  const timer = useRef<number | null>(null)
  const nextId = useRef(1000)
  const [envio, setEnvio] = useState<EnvioCierreCajaConfig>({
    envioAutomatico: false,
    whatsapp: { habilitado: false, destinatarios: [] },
    email: { habilitado: false, destinatarios: [] },
  })
  const envioTimer = useRef<number | null>(null)
  const [subTab, setSubTab] = useState<'cierre' | 'envio'>('cierre')

  useEffect(() => {
    let mounted = true
    api.preferencias.obtener().then(res => {
      if (!mounted) return
      const pref = res.preferencias?.cajaPeriodo
      if (pref?.modo === 'duracion') {
        setModo('duracion')
        if (pref.cantidad != null) setCantidad(String(pref.cantidad))
        if (pref.unidad === 'dias') setUnidad('dias')
      } else if (pref?.modo === 'horario') {
        setModo('horario')
        if (Array.isArray(pref.periodos)) {
          setPeriodos(ordenar(pref.periodos.map((p, i) => ({ id: i + 1, inicio: p.inicio ?? '', fin: p.fin ?? '' }))))
        }
      }
      setEnvio(normalizarEnvioCierre(res.preferencias?.envioCierreCaja))
      setCargado(true)
    }).catch(() => setCargado(true))
    return () => { mounted = false }
  }, [])

  const persistir = (nuevoModo: ModoPeriodo, nuevaCantidad: string, nuevaUnidad: string, nuevosPeriodos: Periodo[]) => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      let valor: Record<string, unknown> | null = null
      if (nuevoModo === 'duracion') {
        const n = Number(nuevaCantidad)
        if (!nuevaCantidad.trim() || isNaN(n) || n <= 0) return
        valor = { modo: 'duracion', cantidad: n, unidad: nuevaUnidad }
      } else if (nuevoModo === 'horario') {
        const completos = nuevosPeriodos.map(p => ({ inicio: p.inicio.trim(), fin: p.fin.trim() }))
        if (completos.length === 0) {
          valor = null
        } else {
          const todosValidos = completos.every(p => HORA_VALIDA.test(p.inicio) && HORA_VALIDA.test(p.fin))
          if (!todosValidos || haySuperposicion(completos)) return
          valor = { modo: 'horario', periodos: completos }
        }
      }
      api.preferencias.guardar({ cajaPeriodo: valor }).catch(() => {})
    }, 500)
  }

  const persistirEnvio = (next: EnvioCierreCajaConfig) => {
    if (envioTimer.current) window.clearTimeout(envioTimer.current)
    envioTimer.current = window.setTimeout(() => {
      api.preferencias.guardar({ envioCierreCaja: next }).catch(() => {})
    }, 500)
  }

  const setEnvioAutomatico = (v: boolean) => {
    const next = { ...envio, envioAutomatico: v }
    setEnvio(next)
    persistirEnvio(next)
  }

  const setCanal = (canal: 'whatsapp' | 'email', v: boolean) => {
    const next: EnvioCierreCajaConfig = {
      ...envio,
      [canal]: { ...envio[canal], habilitado: v },
    }
    setEnvio(next)
    persistirEnvio(next)
  }

  const agregarDestinatario = (canal: 'whatsapp' | 'email', valor: string) => {
    if (envio[canal].destinatarios.includes(valor)) return
    const next: EnvioCierreCajaConfig = {
      ...envio,
      [canal]: { ...envio[canal], destinatarios: [...envio[canal].destinatarios, valor] },
    }
    setEnvio(next)
    persistirEnvio(next)
  }

  const quitarDestinatario = (canal: 'whatsapp' | 'email', index: number) => {
    const next: EnvioCierreCajaConfig = {
      ...envio,
      [canal]: { ...envio[canal], destinatarios: envio[canal].destinatarios.filter((_, i) => i !== index) },
    }
    setEnvio(next)
    persistirEnvio(next)
  }

  const seleccionarModo = (nuevoModo: ModoPeriodo, e: { target: EventTarget }) => {
    const target = e.target as HTMLElement | null
    if (target && target.closest('input, select, button')) return
    if (nuevoModo === modo) return
    let nuevosPeriodos = periodos
    if (nuevoModo === 'horario' && periodos.length === 0) {
      nuevosPeriodos = [{ id: nextId.current++, inicio: '08:00', fin: '' }]
      setPeriodos(nuevosPeriodos)
    }
    setModo(nuevoModo)
    persistir(nuevoModo, cantidad, unidad, nuevosPeriodos)
  }

  const handleCantidad = (v: string) => {
    const limpio = v.replace(/[^\d.]/g, '')
    setCantidad(limpio)
    if (modo === 'duracion') persistir(modo, limpio, unidad, periodos)
  }

  const handleUnidad = (v: string) => {
    setUnidad(v)
    persistir(modo, cantidad, v, periodos)
  }

  const actualizarPeriodo = (id: number, campo: 'inicio' | 'fin', v: string) => {
    const next = ordenar(periodos.map(p => (p.id === id ? { ...p, [campo]: v } : p)))
    setPeriodos(next)
    persistir(modo, cantidad, unidad, next)
  }

  const agregarPeriodo = () => {
    const ultimo = periodos.length > 0 ? periodos[periodos.length - 1] : null
    const inicio = ultimo && HORA_VALIDA.test(ultimo.fin) ? ultimo.fin : '08:00'
    setPeriodos([...periodos, { id: nextId.current++, inicio, fin: '' }])
  }

  const eliminarPeriodo = (id: number) => {
    if (periodos.length <= 1 || periodos[0].id === id) return
    const next = periodos.filter(p => p.id !== id)
    setPeriodos(next)
    persistir(modo, cantidad, unidad, next)
  }

  const ejemploDuracion = useMemo(() => {
    const n = Number(cantidad)
    if (!cantidad.trim() || isNaN(n) || n <= 0) return 'Definí la duración para calcular el vencimiento.'
    const horas = unidad === 'dias' ? n * 24 : n
    const ahora = new Date()
    const limite = new Date(ahora.getTime() + horas * 3600_000)
    return `Si la caja se abre hoy a las ${formatHora(ahora)}, deberá cerrarse antes de las ${formatHora(limite)}.`
  }, [cantidad, unidad])

  const ejemploHorario = useMemo(() => {
    const completos = periodos.filter(p => HORA_VALIDA.test(p.inicio) && HORA_VALIDA.test(p.fin))
    if (completos.length === 0) {
      return periodos.length === 0
        ? 'Agregá un turno para configurar el horario.'
        : 'Completá la hora de inicio y cierre de cada turno.'
    }
    if (haySuperposicion(completos)) return 'Los turnos no pueden superponerse.'
    const ahora = new Date()
    const apertura = formatHora(ahora)
    const turno = completos.find(t => pertenece(t, apertura))
    if (!turno) return `La hora actual (${apertura}) está fuera de los turnos configurados. No se podrá operar en este horario.`
    return `Si la caja se abre hoy a las ${apertura}, deberá cerrarse antes de las ${turno.fin}.`
  }, [periodos])

  const deshabilitadoDuracion = !cargado || modo !== 'duracion'
  const deshabilitadoHorario = !cargado || modo !== 'horario'

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex border-b border-gray-200 mb-4">
        <button
          type="button"
          onClick={() => setSubTab('cierre')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            subTab === 'cierre' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          Cierre de caja
        </button>
        <button
          type="button"
          onClick={() => setSubTab('envio')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            subTab === 'envio' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
          }`}
        >
          Envío
        </button>
      </div>
      {subTab === 'cierre' ? (
      <Card padding="lg" className="flex-1">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Cierre obligatorio de caja</h3>
      <p className="text-xs text-gray-400 mb-4">
        Definí cuándo vence la caja. Al vencer, el sistema te obligará a cerrarla antes de continuar.
      </p>

      <div className="space-y-3">
        <ModoCajaCard
          activo={modo === ''}
          titulo="Sin límite"
          descripcion="Las cajas no vencen. Nunca se obliga al cierre."
          onSeleccionar={(e) => seleccionarModo('', e)}
        />

        <ModoCajaCard
          activo={modo === 'duracion'}
          titulo="Por duración"
          descripcion={ejemploDuracion}
          onSeleccionar={(e) => seleccionarModo('duracion', e)}
        >
          <div className="flex items-end gap-2 flex-wrap">
            <span className="text-sm text-gray-600 pb-2.5">Cada</span>
            <input
              type="text"
              inputMode="decimal"
              value={cantidad}
              onChange={e => handleCantidad(e.target.value)}
              disabled={deshabilitadoDuracion}
              placeholder="8"
              className="w-20 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center font-mono focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400 outline-none transition-all duration-150 disabled:opacity-50"
            />
            <div className="w-32 [&>div>select]:h-8 [&>div>select]:text-sm">
              <SelectAltaCruzada
                value={unidad}
                onChange={handleUnidad}
                options={[
                  { value: 'horas', label: 'Horas' },
                  { value: 'dias', label: 'Días' },
                ]}
                showCreate={false}
                disabled={deshabilitadoDuracion}
              />
            </div>
          </div>
        </ModoCajaCard>

        <ModoCajaCard
          activo={modo === 'horario'}
          titulo="Por horario fijo"
          descripcion={ejemploHorario}
          onSeleccionar={(e) => seleccionarModo('horario', e)}
        >
          <div className="space-y-2">
            {periodos.map((p, i) => (
              <div key={p.id} className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
                <span className="text-[11px] font-semibold text-gray-400 w-14 shrink-0">Turno {i + 1}</span>
                <TimeInput
                  value={p.inicio}
                  onChange={v => actualizarPeriodo(p.id, 'inicio', v)}
                  disabled={deshabilitadoHorario}
                  minuteStep={15}
                />
                <span className="text-gray-400">→</span>
                <TimeInput
                  value={p.fin}
                  onChange={v => actualizarPeriodo(p.id, 'fin', v)}
                  disabled={deshabilitadoHorario}
                  minuteStep={15}
                />
                {resumenTurno(p) && (
                  <span className="text-[11px] font-medium text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                    {resumenTurno(p)}
                  </span>
                )}
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => eliminarPeriodo(p.id)}
                    disabled={deshabilitadoHorario}
                    title="Eliminar turno"
                    className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={agregarPeriodo}
            disabled={deshabilitadoHorario}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg px-2 py-1.5 transition-colors disabled:opacity-50"
          >
            <Plus size={14} /> Agregar turno
          </button>
        </ModoCajaCard>
      </div>
      </Card>
      ) : (
      <Card padding="lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-1">Envío del cierre de caja</h3>
        <p className="text-xs text-gray-400 mb-4">
          Enviá automáticamente el resumen cuando se cierre una caja.
        </p>

        <label className="flex items-center justify-between gap-3 cursor-pointer py-1.5">
          <span className="text-sm font-medium text-gray-700">Enviar automáticamente</span>
          <input
            type="checkbox"
            checked={envio.envioAutomatico}
            onChange={e => setEnvioAutomatico(e.target.checked)}
            className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
        </label>

        <div className={`mt-3 space-y-4 transition-opacity duration-150 ${envio.envioAutomatico ? '' : 'opacity-40 pointer-events-none select-none'}`}>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Canales</p>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={envio.whatsapp.habilitado}
                  onChange={e => setCanal('whatsapp', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                WhatsApp
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={envio.email.habilitado}
                  onChange={e => setCanal('email', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Email
              </label>
            </div>
          </div>

          {envio.whatsapp.habilitado && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">WhatsApp</p>
              <div className="space-y-1.5">
                {envio.whatsapp.destinatarios.map((d, i) => (
                  <div key={`${d}-${i}`} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="text-sm text-gray-700 truncate">{d}</span>
                    <button
                      type="button"
                      onClick={() => quitarDestinatario('whatsapp', i)}
                      title="Quitar número"
                      className="ml-auto p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <AltaDestinatario
                label="Agregar número"
                placeholder="351 1234-5678"
                prefijo="+549"
                validador={v => sanitizePhone(v).length >= 8}
                onAgregar={v => agregarDestinatario('whatsapp', normalizarTelefonoWhatsApp(v))}
              />
            </div>
          )}

          {envio.email.habilitado && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Email</p>
              <div className="space-y-1.5">
                {envio.email.destinatarios.map((d, i) => (
                  <div key={`${d}-${i}`} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5">
                    <span className="text-sm text-gray-700 truncate">{d}</span>
                    <button
                      type="button"
                      onClick={() => quitarDestinatario('email', i)}
                      title="Quitar email"
                      className="ml-auto p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <AltaDestinatario
                label="Agregar email"
                placeholder="administracion@empresa.com"
                validador={v => EMAIL_VALIDO.test(v)}
                onAgregar={v => agregarDestinatario('email', v)}
              />
            </div>
          )}
        </div>
      </Card>
      )}
    </div>
  )
}