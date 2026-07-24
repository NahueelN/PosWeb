import type { Widget } from '../types'
import { Target } from 'lucide-react'

interface Props {
  widget: Widget
}

export default function ProgressWidget({ widget }: Props) {
  const row = widget.dataset.rows[0] ?? {}
  const config = widget.config ?? {}

  const value = (row['value'] as number) ?? 0
  const max = config.max ?? (row['max'] as number) ?? 100
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const color = config.color ?? 'emerald'

  const accentMap: Record<string, { bar: string; text: string; iconBg: string; topBar: string }> = {
    emerald: { bar: 'from-emerald-400 to-emerald-300', text: 'text-emerald-500', iconBg: 'from-emerald-50 to-emerald-100', topBar: 'from-emerald-400 to-emerald-300' },
    indigo:  { bar: 'from-indigo-400 to-indigo-300', text: 'text-indigo-500', iconBg: 'from-indigo-50 to-indigo-100', topBar: 'from-indigo-400 to-indigo-300' },
    blue:    { bar: 'from-sky-400 to-sky-300', text: 'text-sky-500', iconBg: 'from-sky-50 to-sky-100', topBar: 'from-sky-400 to-sky-300' },
    amber:   { bar: 'from-amber-400 to-amber-300', text: 'text-amber-500', iconBg: 'from-amber-50 to-amber-100', topBar: 'from-amber-400 to-amber-300' },
    red:     { bar: 'from-red-400 to-red-300', text: 'text-red-400', iconBg: 'from-red-50 to-red-100', topBar: 'from-red-400 to-red-300' },
    purple:  { bar: 'from-purple-400 to-purple-300', text: 'text-purple-500', iconBg: 'from-purple-50 to-purple-100', topBar: 'from-purple-400 to-purple-300' },
  }

  const accent = accentMap[color] ?? accentMap.emerald

  const formatValue = (v: number) => {
    switch (config.valueFormat) {
      case 'currency':
        return `$${v.toLocaleString('es-AR')}`
      case 'percentage':
        return `${Math.round(v)}%`
      default:
        return v.toLocaleString('es-AR')
    }
  }

  return (
    <div className="p-3.5 h-full flex flex-col justify-center relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${accent.topBar}`} />
      <div className="flex items-center gap-2.5 mb-2">
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${accent.iconBg} flex items-center justify-center shrink-0 ring-1 ring-black/[0.02]`}>
          <Target size={11} className={accent.text} strokeWidth={2.5} />
        </div>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest flex-1 leading-none">
          {widget.title}
        </p>
        <span className={`text-[11px] font-bold ${accent.text}`}>
          {formatValue(value)}
        </span>
      </div>

      <div className="relative h-1.5 bg-gray-50 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${accent.bar} transition-all duration-700 ease-out`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>

      {config.showLabel !== false && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-[8px] text-gray-400 font-medium">0</span>
          <span className="text-[8px] text-gray-400 font-medium">{formatValue(max)}</span>
        </div>
      )}
    </div>
  )
}
