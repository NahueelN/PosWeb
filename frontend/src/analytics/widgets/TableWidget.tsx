import { useNavigate } from 'react-router-dom'
import type { Widget } from '../types'
import { formatCurrency } from '../../formats'
import { Package, ChevronRight } from 'lucide-react'

interface Props {
  widget: Widget
}

export default function TableWidget({ widget }: Props) {
  const navigate = useNavigate()
  const data = widget.dataset.rows
  const maxCant = Math.max(...data.map((p) => (p['cantidad'] as number) ?? 0), 1)

  const rankColors = [
    'bg-indigo-500 text-white',
    'bg-indigo-400 text-white',
    'bg-indigo-300 text-white',
    'bg-gray-200 text-gray-600',
    'bg-gray-200 text-gray-600',
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xs font-semibold text-gray-900">{widget.title}</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Los más vendidos hoy</p>
        </div>
        <button
          onClick={() => navigate('/estadisticas')}
          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-0.5"
        >
          Ver todos <ChevronRight size={10} />
        </button>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-300">
          <div className="text-center">
            <Package size={20} className="mx-auto mb-1 opacity-40" />
            <p className="text-xs">Sin ventas hoy</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2 flex-1">
          {data.map((p, i) => {
            const cantidad = (p['cantidad'] as number) ?? 0
            const pct = maxCant > 0 ? (cantidad / maxCant) * 100 : 0
            return (
              <div key={p['productoId'] ?? i} className="group">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${rankColors[i] || rankColors[4]}`}
                  >
                    {i + 1}
                  </span>
                  <p className="text-[13px] font-medium text-gray-900 truncate flex-1 min-w-0 group-hover:text-indigo-600 transition-colors">
                    {p['nombre'] ?? 'Sin nombre'}
                  </p>
                  <span className="text-[11px] font-semibold text-gray-400 shrink-0">
                    {cantidad} u.
                  </span>
                  <span className="text-[13px] font-bold text-gray-900 shrink-0 ml-1">
                    {formatCurrency((p['subtotal'] as number) ?? 0)}
                  </span>
                </div>
                <div className="ml-6 mt-1 h-[2px] bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-300 rounded-full transition-all duration-700 ease-out"
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
