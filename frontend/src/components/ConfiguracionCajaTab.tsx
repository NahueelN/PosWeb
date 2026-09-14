import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../api/client'
import Card from './ui/Card'
import SelectAltaCruzada from './ui/SelectAltaCruzada'
import TimeInput from './ui/TimeInput'
import { Plus, Trash2 } from 'lucide-react'

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
    </div>
  )
}