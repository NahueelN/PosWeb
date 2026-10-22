import type { Widget } from '../types'
import WidgetHeader from './WidgetHeader'
import { getWidgetAccent } from './chrome'

interface Props {
  widget: Widget
}

export default function ProgressWidget({ widget }: Props) {
  const row = widget.dataset.rows[0] ?? {}
  const config = widget.config ?? {}

  const value = (row['value'] as number) ?? 0
  const max = config.max ?? (row['max'] as number) ?? 100
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  const accent = getWidgetAccent(config.color, widget.definitionId)

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
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${accent.spine}`} />
      <WidgetHeader
        accent={accent}
        title={widget.title}
        icon={config.icon}
        right={<span className={`text-[11px] font-bold ${accent.chipText}`}>{formatValue(value)}</span>}
      />

      <div className="relative h-1.5 bg-gray-50 rounded-full overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${accent.spine} transition-all duration-700 ease-out`}
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
