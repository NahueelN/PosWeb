import { useEffect, useRef, useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface TimeInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  minuteStep?: 5 | 15
}

type Segmento = 'horas' | 'minutos'

function parseValue(value: string): { h: string; m: string } {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value ?? '')
  if (match) return { h: match[1], m: match[2] }
  return { h: '', m: '' }
}

const pad = (n: number) => String(n).padStart(2, '0')

const clampInt = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export default function TimeInput({ value, onChange, disabled = false, minuteStep = 5 }: TimeInputProps) {
  const horaRef = useRef<HTMLInputElement>(null)
  const minutoRef = useRef<HTMLInputElement>(null)
  const enfocado = useRef(false)
  const [h, setH] = useState('')
  const [m, setM] = useState('')
  const [activo, setActivo] = useState<Segmento | null>(null)

  useEffect(() => {
    if (enfocado.current) return
    const parsed = parseValue(value)
    setH(parsed.h)
    setM(parsed.m)
  }, [value])

  function step(segmento: Segmento, delta: number) {
    if (segmento === 'horas') {
      const actual = h.trim() === '' ? 0 : clampInt(parseInt(h, 10) || 0, 0, 23)
      const siguiente = (actual + delta + 24) % 24
      setH(pad(siguiente))
      return
    }
    const actual = m.trim() === '' ? 0 : clampInt(parseInt(m, 10) || 0, 0, 59)
    const maxValido = 60 - minuteStep
    const crudo = (actual + delta * minuteStep + 60) % 60
    const siguiente = clampInt(Math.round(crudo / minuteStep) * minuteStep, 0, maxValido)
    setM(pad(siguiente))
  }

  function normalizar() {
    enfocado.current = false
    setActivo(null)
    if (h.trim() === '' && m.trim() === '') {
      setH('')
      setM('')
      if (value !== '') onChange('')
      return
    }
    const hNum = h.trim() === '' ? 0 : clampInt(parseInt(h, 10) || 0, 0, 23)
    const mRaw = m.trim() === '' ? 0 : clampInt(parseInt(m, 10) || 0, 0, 59)
    const mNum = clampInt(Math.round(mRaw / minuteStep) * minuteStep, 0, 60 - minuteStep)
    const finalH = pad(hNum)
    const finalM = pad(mNum)
    setH(finalH)
    setM(finalM)
    const final = `${finalH}:${finalM}`
    if (final !== value) onChange(final)
  }

  function onChangeSeg(segmento: Segmento) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/\D/g, '').slice(0, 2)
      if (segmento === 'horas') {
        const n = raw === '' ? '' : (parseInt(raw, 10) > 23 ? '23' : raw)
        setH(n)
        if (raw.length === 2) minutoRef.current?.focus()
      } else {
        const n = raw === '' ? '' : (parseInt(raw, 10) > 59 ? '59' : raw)
        setM(n)
      }
    }
  }

  function onKeyDown(segmento: Segmento) {
    return (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        step(segmento, 1)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        step(segmento, -1)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.currentTarget.blur()
      }
    }
  }

  const segmentoActivo = activo ?? 'horas'
  const clasesControl = `flex items-center overflow-hidden rounded-xl border bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] transition-all duration-150 ${
    disabled
      ? 'border-gray-200 bg-gray-50 opacity-50'
      : 'border-gray-300 hover:border-gray-400 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary-ring)]'
  }`

  const claseInput = 'h-9 w-11 bg-transparent text-center text-sm font-semibold text-gray-900 outline-none tabular-nums placeholder:text-gray-300'

  return (
    <div
      className={clasesControl}
      onFocusCapture={() => { enfocado.current = true }}
      onBlurCapture={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return
        normalizar()
      }}
    >
      <input
        ref={horaRef}
        type="text"
        inputMode="numeric"
        aria-label="Horas"
        value={h}
        onChange={onChangeSeg('horas')}
        onKeyDown={onKeyDown('horas')}
        onFocus={(e) => { e.target.select(); setActivo('horas') }}
        disabled={disabled}
        placeholder="--"
        maxLength={2}
        className={`${claseInput} ${activo === 'horas' ? 'bg-indigo-50' : ''}`}
      />
      <span className="text-gray-400 font-semibold select-none">:</span>
      <input
        ref={minutoRef}
        type="text"
        inputMode="numeric"
        aria-label="Minutos"
        value={m}
        onChange={onChangeSeg('minutos')}
        onKeyDown={onKeyDown('minutos')}
        onFocus={(e) => { e.target.select(); setActivo('minutos') }}
        disabled={disabled}
        placeholder="--"
        maxLength={2}
        className={`${claseInput} ${activo === 'minutos' ? 'bg-indigo-50' : ''}`}
      />
      <div className="flex flex-col border-l border-gray-200 h-9">
        <button
          type="button"
          tabIndex={-1}
          title="Incrementar"
          onClick={() => step(segmentoActivo, 1)}
          disabled={disabled}
          className="flex flex-1 w-7 items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-tr-xl transition-colors disabled:opacity-50"
        >
          <ChevronUp size={13} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          title="Decrementar"
          onClick={() => step(segmentoActivo, -1)}
          disabled={disabled}
          className="flex flex-1 w-7 items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-br-xl transition-colors disabled:opacity-50"
        >
          <ChevronDown size={13} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  )
}