import { useState } from 'react'
import type { Widget } from '../types'
import { formatCurrency } from '../../formats'
import { BarChart3 } from 'lucide-react'
import WidgetHeader from './WidgetHeader'
import { getWidgetAccent } from './chrome'

interface Props {
  widget: Widget
}

function periodLabel(period: string | undefined): string {
  switch (period) {
    case '0': return 'Hoy'
    case '7': return 'Últimos 7 días'
    case '14': return 'Últimos 14 días'
    case '30': return 'Últimos 30 días'
    default: return 'Últimos 7 días'
  }
}

export default function ChartWidget({ widget }: Props) {
  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number } | null>(null)

  const config = widget.config ?? {}
  const accent = getWidgetAccent(config.color, widget.definitionId)

  const columns = widget.dataset.columns ?? []
  const rows = widget.dataset.rows ?? []

  const labelCol =
    columns.find((c) => c.name === 'label') ??
    columns.find((c) => c.name === 'fecha') ??
    columns.find((c) => c.type === 'string')

  const valueCol =
    columns.find((c) => c.name === 'value') ??
    columns.find((c) => c.name === 'total') ??
    columns.find((c) => c.type === 'currency' || c.type === 'number')

  const data = rows.map((r) => ({
    label: String(r[labelCol?.name ?? ''] ?? ''),
    value: Number(r[valueCol?.name ?? ''] ?? 0),
  }))

  const max = Math.max(...data.map((d) => d.value), 1)
  const isCurrency = valueCol?.type === 'currency'
  const formatValue = (v: number) => (isCurrency ? formatCurrency(v) : v.toLocaleString('es-AR'))

  return (
    <div className="p-3.5 flex flex-col h-full relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${accent.spine}`} />
      <WidgetHeader
        accent={accent}
        title={widget.title}
        icon={config.icon}
        subtitle={periodLabel(config.period)}
        right={
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-br from-sky-50 to-indigo-50 text-indigo-500 ring-1 ring-black/[0.02]">
            <BarChart3 size={10} />
            <span className="text-[9px] font-semibold">{valueCol?.label ?? 'Total'}</span>
          </div>
        }
      />

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-300">
          <div className="text-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-50 to-indigo-50 flex items-center justify-center mx-auto mb-2 ring-1 ring-black/[0.02]">
              <BarChart3 size={16} className="text-sky-300" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Sin datos</p>
          </div>
        </div>
      ) : (
        <div className="relative flex-1" style={{ minHeight: 100 }}>
          <div className="flex items-end gap-1.5 h-full relative overflow-x-auto">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border-t border-slate-100 w-full" />
              ))}
            </div>

            {data.map((d, i) => {
              const pct = max > 0 ? (d.value / max) * 100 : 0
              return (
                <div
                  key={i}
                  className="flex-1 min-w-[18px] min-h-0 flex flex-col items-center gap-1 relative z-10 justify-end"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltip({ idx: i, x: rect.left + rect.width / 2, y: rect.top })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <div
                    className={`w-full rounded-[5px] bg-gradient-to-t ${accent.barFrom} ${accent.barTo} transition-all duration-500 ease-out cursor-pointer ${accent.barHoverFrom} ${accent.barHoverTo} hover:shadow-lg hover:shadow-indigo-500/25`}
                    style={{
                      height: `${Math.max(pct, 4)}%`,
                      opacity: d.value > 0 ? 1 : 0.12,
                    }}
                  />
                  <span className="text-[9px] font-medium text-gray-400 whitespace-nowrap">{d.label}</span>
                </div>
              )
            })}
          </div>

          {tooltip && (
            <div
              className="fixed z-50 bg-gray-900 text-white text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none tabular-nums"
              style={{ left: tooltip.x, top: tooltip.y - 30, transform: 'translateX(-50%)' }}
            >
              {data[tooltip.idx].label}: {formatValue(data[tooltip.idx].value)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
