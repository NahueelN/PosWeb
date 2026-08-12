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
  venta: 'text-indigo-500',
  compra: 'text-emerald-500',
  caja: 'text-amber-500',
  gasto: 'text-red-400',
}

const bgMap: Record<string, string> = {
  venta: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
  compra: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
  caja: 'bg-gradient-to-br from-amber-50 to-amber-100',
  gasto: 'bg-gradient-to-br from-red-50 to-red-100',
}

interface Props {
  widget: Widget
}

export default function ListWidget({ widget }: Props) {
  const data = widget.dataset.rows

  if (widget.id === 'resumen') {
    const row = data[0] ?? {}
    const items = [
      { label: 'Ventas', value: ((row['ventas'] as number) ?? 0).toString(), icon: Receipt, textColor: 'text-indigo-500', bgColor: 'from-indigo-50 to-indigo-100' },
      { label: 'Productos', value: ((row['productos'] as number) ?? 0).toString(), icon: Package, textColor: 'text-emerald-500', bgColor: 'from-emerald-50 to-emerald-100' },
      { label: 'Clientes', value: ((row['clientes'] as number) ?? 0).toString(), icon: Users, textColor: 'text-violet-500', bgColor: 'from-violet-50 to-violet-100' },
    ]

    return (
      <div className="p-3.5 h-full flex flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-400 to-teal-300" />
        <h3 className="text-[11px] font-semibold text-gray-900 tracking-wide mb-3">{widget.title}</h3>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${item.bgColor} flex items-center justify-center ring-1 ring-black/[0.02]`}>
                  <item.icon size={12} className={item.textColor} />
                </div>
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-3.5 flex flex-col h-full relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-emerald-400 to-teal-300" />
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[11px] font-semibold text-gray-900 tracking-wide">{widget.title}</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Últimos movimientos</p>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center mb-2 ring-1 ring-black/[0.02]">
            <Clock size={14} className="text-gray-300" />
          </div>
          <p className="text-xs text-gray-400 font-medium">Sin actividad hoy</p>
        </div>
      ) : (
        <div className="space-y-0.5 flex-1 overflow-y-auto">
          {data.map((a, i) => {
            const tipo = (a['tipo'] as string) ?? ''
            const Icon = iconMap[tipo] ?? Receipt
            const color = colorMap[tipo] ?? 'text-gray-500'
            const bg = bgMap[tipo] ?? 'bg-gradient-to-br from-gray-50 to-gray-100'

            return (
              <div
                key={`${tipo}-${a['fecha']}-${i}`}
                className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-gray-50/80 transition-colors"
              >
                <div className={`w-6 h-6 rounded-lg ${bg} flex items-center justify-center shrink-0 ring-1 ring-black/[0.02]`}>
                  <Icon size={11} className={color} strokeWidth={2} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-gray-700 truncate">
                    {a['descripcion'] ?? ''}
                  </p>
                </div>
                {a['monto'] != null && (
                  <span className="text-[11px] font-semibold text-gray-900 shrink-0">
                    {formatCurrency(a['monto'] as number)}
                  </span>
                )}
                <span className="text-[9px] text-gray-400 shrink-0">
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
