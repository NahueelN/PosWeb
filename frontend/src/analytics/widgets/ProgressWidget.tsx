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

  const colorMap: Record<string, { bar: string; text: string; bg: string }> = {
    emerald: { bar: 'from-emerald-500 to-emerald-400', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    indigo: { bar: 'from-indigo-500 to-indigo-400', text: 'text-indigo-600', bg: 'bg-indigo-50' },
    blue: { bar: 'from-blue-500 to-blue-400', text: 'text-blue-600', bg: 'bg-blue-50' },
    amber: { bar: 'from-amber-500 to-amber-400', text: 'text-amber-600', bg: 'bg-amber-50' },
    red: { bar: 'from-red-500 to-red-400', text: 'text-red-600', bg: 'bg-red-50' },
    purple: { bar: 'from-purple-500 to-purple-400', text: 'text-purple-600', bg: 'bg-purple-50' },
  }

  const colors = colorMap[color] ?? colorMap.emerald

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
    <div className="bg-white rounded-xl border border-gray-100 p-2 group hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={`w-5 h-5 rounded-md flex items-center justify-center ${colors.bg} shrink-0`}>
          <Target size={10} className={colors.text} strokeWidth={2.5} />
        </div>
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider flex-1">
          {widget.title}
        </p>
        <span className={`text-[10px] font-bold ${colors.text}`}>
          {formatValue(value)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-700 ease-out`}
          style={{ width: `${Math.max(pct, 1)}%` }}
        />
      </div>

      {config.showLabel !== false && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-[9px] text-gray-400">0</span>
          <span className="text-[9px] text-gray-400">{formatValue(max)}</span>
        </div>
      )}
    </div>
  )
}
