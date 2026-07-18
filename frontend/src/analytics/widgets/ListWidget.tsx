import type { Widget } from '../types'
import { formatCurrency, formatTime } from '../../formats'
import { Receipt, FileText, Wallet, AlertTriangle, Clock, Package, Users } from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  venta: Receipt,
  compra: FileText,
  caja: Wallet,
  gasto: AlertTriangle,
}

const colorMap: Record<string, string> = {
  venta: 'text-indigo-600',
  compra: 'text-emerald-600',
  caja: 'text-amber-600',
  gasto: 'text-red-500',
}

const bgMap: Record<string, string> = {
  venta: 'bg-indigo-50',
  compra: 'bg-emerald-50',
  caja: 'bg-amber-50',
  gasto: 'bg-red-50',
}

interface Props {
  widget: Widget
}

export default function ListWidget({ widget }: Props) {
  const data = widget.dataset.rows

  // Detect if this is a Resumen Operativo widget (has ventas/productos/clientes)
  if (widget.id === 'resumen') {
    const row = data[0] ?? {}
    const items = [
      { label: 'Ventas', value: ((row['ventas'] as number) ?? 0).toString(), icon: Receipt, color: 'text-indigo-600' },
      { label: 'Productos', value: ((row['productos'] as number) ?? 0).toString(), icon: Package, color: 'text-emerald-600' },
      { label: 'Clientes', value: ((row['clientes'] as number) ?? 0).toString(), icon: Users, color: 'text-purple-600' },
    ]

    return (
      <div className="bg-white rounded-xl border border-gray-100 p-3">
        <h3 className="text-xs font-semibold text-gray-900 mb-2">{widget.title}</h3>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <item.icon size={13} className={item.color} />
                <span className="text-[12px] text-gray-500">{item.label}</span>
              </div>
              <span className="text-[13px] font-bold text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Activity feed or other list widgets
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xs font-semibold text-gray-900">{widget.title}</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Últimos movimientos</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <Clock size={20} className="text-gray-300 mb-1" />
          <p className="text-xs text-gray-400">Sin actividad hoy</p>
        </div>
      ) : (
        <div className="space-y-0.5 flex-1 overflow-y-auto">
          {data.map((a, i) => {
            const tipo = (a['tipo'] as string) ?? ''
            const Icon = iconMap[tipo] ?? Receipt
            const color = colorMap[tipo] ?? 'text-gray-600'
            const bg = bgMap[tipo] ?? 'bg-gray-50'

            return (
              <div
                key={`${tipo}-${a['fecha']}-${i}`}
                className="flex items-center gap-2 py-1.5 px-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className={`w-6 h-6 rounded-md ${bg} flex items-center justify-center shrink-0`}>
                  <Icon size={11} className={color} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-gray-700 truncate">
                    {a['descripcion'] ?? ''}
                  </p>
                </div>
                {a['monto'] != null && (
                  <span className="text-[11px] font-semibold text-gray-900 shrink-0">
                    {formatCurrency(a['monto'] as number)}
                  </span>
                )}
                <span className="text-[10px] text-gray-400 shrink-0">
                  {formatTime(a['fecha'] as string)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
