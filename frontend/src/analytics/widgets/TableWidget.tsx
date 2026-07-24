
import type { Widget } from '../types'
import { formatCurrency } from '../../formats'
import { Package } from 'lucide-react'

interface Props {
  widget: Widget
}

export default function TableWidget({ widget }: Props) {
  const data = widget.dataset.rows
  const maxCant = Math.max(...data.map((p) => (p['cantidad'] as number) ?? 0), 1)

  const rankColors = [
    'bg-teal-500 text-white',
    'bg-teal-400 text-white',
    'bg-teal-300 text-white',
    'bg-gray-100 text-gray-500',
    'bg-gray-100 text-gray-500',
  ]

  return (
    <div className="p-3.5 flex flex-col h-full relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-teal-400 to-emerald-300" />
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[11px] font-semibold text-gray-900 tracking-wide">{widget.title}</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Los más vendidos hoy</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-300">
          <div className="text-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center mx-auto mb-2 ring-1 ring-black/[0.02]">
              <Package size={16} className="text-teal-300" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Sin ventas hoy</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 flex-1">
          {data.map((p, i) => {
            const cantidad = (p['cantidad'] as number) ?? 0
            const pct = maxCant > 0 ? (cantidad / maxCant) * 100 : 0
            return (
              <div key={p['productoId'] ?? i} className="group">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${rankColors[i] || rankColors[4]}`}
                  >
                    {i + 1}
                  </span>
                  <p className="text-xs font-medium text-gray-700 truncate flex-1 min-w-0 group-hover:text-teal-500 transition-colors">
                    {p['nombre'] ?? 'Sin nombre'}
                  </p>
                  <span className="text-[10px] font-medium text-gray-400 shrink-0">
                    {cantidad} u.
                  </span>
                  <span className="text-xs font-bold text-gray-900 shrink-0">
                    {formatCurrency((p['subtotal'] as number) ?? 0)}
                  </span>
                </div>
                <div className="ml-7 mt-1.5 h-1 bg-gray-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-300 to-emerald-300 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
