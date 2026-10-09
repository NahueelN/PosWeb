import { useState } from 'react'
import type { Widget } from '../types'
import { formatCurrency } from '../../formats'
import { BarChart3 } from 'lucide-react'

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
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-sky-400 to-indigo-300" />
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[11px] font-semibold text-gray-900 tracking-wide">{widget.title}</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">{periodLabel(widget.config?.period)}</p>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-br from-sky-50 to-indigo-50 text-indigo-500 ring-1 ring-black/[0.02]">
          <BarChart3 size={10} />
          <span className="text-[9px] font-semibold">{valueCol?.label ?? 'Total'}</span>
        </div>
      </div>

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
          <div className="flex items-end gap-1 h-full relative overflow-x-auto">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border-t border-gray-50 w-full" />
              ))}
            </div>

            {data.map((d, i) => {
              const pct = max > 0 ? (d.value / max) * 100 : 0
              return (
                <div
                  key={i}
                  className="flex-1 min-w-[18px] flex flex-col items-center gap-0.5 relative z-10 justify-end"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltip({ idx: i, x: rect.left + rect.width / 2, y: rect.top })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <div
                    className="w-full rounded-[3px] bg-gradient-to-t from-indigo-400 to-sky-300 transition-all duration-500 ease-out cursor-pointer hover:from-indigo-500 hover:to-sky-400"
                    style={{
                      height: `${Math.max(pct, 3)}%`,
                      opacity: d.value > 0 ? 1 : 0.15,
                    }}
                  />
                  <span className="text-[9px] font-medium text-gray-400 whitespace-nowrap">{d.label}</span>
                </div>
              )
            })}
          </div>

          {tooltip && (
            <div
              className="fixed z-50 bg-gray-900 text-white text-[10px] font-medium px-2 py-1 rounded-lg shadow-xl pointer-events-none"
              style={{ left: tooltip.x, top: tooltip.y - 28, transform: 'translateX(-50%)' }}
            >
              {data[tooltip.idx].label}: {formatValue(data[tooltip.idx].value)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
