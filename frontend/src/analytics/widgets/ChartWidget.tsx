import { useState } from 'react'
import type { Widget } from '../types'
import { formatCurrency } from '../../formats'
import { BarChart3 } from 'lucide-react'

interface Props {
  widget: Widget
}

export default function ChartWidget({ widget }: Props) {
  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number } | null>(null)
  const data = widget.dataset.rows.map((r) => ({
    fecha: r['fecha'] as string,
    total: (r['total'] as number) ?? 0,
  }))
  const max = Math.max(...data.map((d) => d.total), 1)

  return (
    <div className="p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xs font-semibold text-gray-900">{widget.title}</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Últimos 7 días</p>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">
          <BarChart3 size={11} />
          <span className="text-[10px] font-semibold">{widget.config?.period ?? 'Semanal'}</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-300">
          <div className="text-center">
            <BarChart3 size={24} className="mx-auto mb-1.5 opacity-40" />
            <p className="text-xs">Sin datos</p>
          </div>
        </div>
      ) : (
        <div className="relative" style={{ height: 100 }}>
          <div className="flex items-end gap-1 h-full relative">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {[0, 1, 2].map((i) => (
                <div key={i} className="border-t border-gray-100 w-full" />
              ))}
            </div>

            {data.map((d, i) => {
              const pct = max > 0 ? (d.total / max) * 100 : 0
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-0.5 relative z-10"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltip({ idx: i, x: rect.left + rect.width / 2, y: rect.top })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <div
                    className="w-full rounded-md bg-gradient-to-t from-indigo-500 to-indigo-400 transition-all duration-500 ease-out cursor-pointer hover:from-indigo-600 hover:to-indigo-500"
                    style={{
                      height: `${Math.max(pct, 3)}%`,
                      opacity: d.total > 0 ? 1 : 0.15,
                    }}
                  />
                  <span className="text-[10px] font-medium text-gray-400">{d.fecha}</span>
                </div>
              )
            })}
          </div>

          {tooltip && (
            <div
              className="fixed z-50 bg-gray-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-xl pointer-events-none"
              style={{ left: tooltip.x, top: tooltip.y - 32, transform: 'translateX(-50%)' }}
            >
              {formatCurrency(data[tooltip.idx].total)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
