// Widget Inline Controls
// Controles de configuración rápida que viven sobre la card del widget.
// Se derivan de los parámetros de la WidgetDefinition marcados como Inline:
// select (período / días) -> control segmentado; number (monto/meta) -> input.

import { useState } from 'react'
import type { WidgetDefinitionParam } from './types'

interface Props {
  params: WidgetDefinitionParam[]
  config: Record<string, any>
  onConfigChange: (patch: Record<string, any>) => void
}

const PERIOD_SHORT: Record<string, string> = {
  '0': 'Hoy',
  '7': 'Semana',
  '14': '2 sem',
  '30': 'Mes',
}

function shortLabel(param: WidgetDefinitionParam, value: string, label: string): string {
  if (param.key === 'period') return PERIOD_SHORT[value] ?? label
  if (param.key === 'days') return `${value}d`
  return label
}

function MoneyInput({ value, onCommit }: { value: number; onCommit: (v: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const display = draft ?? `$${value.toLocaleString('es-AR')}`

  function commit() {
    const cleaned = (draft ?? '').replace(/[^0-9]/g, '')
    setDraft(null)
    if (cleaned.length > 0) onCommit(Number(cleaned))
  }

  return (
    <input
      value={display}
      onChange={(e) => setDraft(e.target.value)}
      onFocus={(e) => { setDraft(''); e.target.select() }}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); commit() }
        if (e.key === 'Escape') { e.preventDefault(); setDraft(null) }
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="w-24 h-6 px-1.5 rounded-md border border-slate-200 bg-white text-[10px] font-semibold text-slate-700 tabular-nums outline-none focus:border-indigo-400 text-right"
      inputMode="numeric"
      title="Meta / monto objetivo"
    />
  )
}

export default function WidgetInlineControls({ params, config, onConfigChange }: Props) {
  if (params.length === 0) return null

  return (
    <div
      className="flex items-center gap-1 pointer-events-auto"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {params.map((param) => {
        if (param.type === 'select') {
          const current = String(config[param.key] ?? param.default ?? '')
          return (
            <div
              key={param.key}
              className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white/95 shadow-sm px-1 py-0.5"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              title={param.label}
            >
              {param.options?.map((opt) => {
                const active = current === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      onConfigChange({ [param.key]: opt.value })
                    }}
                    className={`px-1.5 h-5 rounded-md text-[9px] font-semibold transition-colors ${
                      active
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                  >
                    {shortLabel(param, opt.value, opt.label)}
                  </button>
                )
              })}
            </div>
          )
        }

        if (param.type === 'number') {
          const numeric = Number(config[param.key] ?? param.default ?? 0)
          return (
            <MoneyInput
              key={param.key}
              value={Number.isFinite(numeric) ? numeric : 0}
              onCommit={(v) => onConfigChange({ [param.key]: v })}
            />
          )
        }

        return null
      })}
    </div>
  )
}