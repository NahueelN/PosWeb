import { useNavigate } from 'react-router-dom'
import type { Widget } from '../types'
import { Package, Wallet, FileText, Users, AlertTriangle, CircleCheck, ChevronRight } from 'lucide-react'

interface Props {
  widget: Widget
}

export default function AlertWidget({ widget }: Props) {
  const navigate = useNavigate()
  const row = widget.dataset.rows[0] ?? {}

  const alerts = [
    {
      label: 'Stock bajo',
      count: (row['stockBajo'] as number) ?? 0,
      icon: Package,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      path: '/stock',
    },
    {
      label: 'Caja abierta',
      count: (row['cajaAbierta'] as boolean) ? 1 : 0,
      icon: Wallet,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      path: '/caja',
    },
    {
      label: 'Pedidos pendientes',
      count: (row['pedidosPendientes'] as number) ?? 0,
      icon: FileText,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      path: '/pedidos',
    },
    {
      label: 'Deudas clientes',
      count: (row['deudasCliente'] as number) ?? 0,
      icon: Users,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      path: '/deudas',
    },
    {
      label: 'Deudas proveedores',
      count: (row['deudasProveedor'] as number) ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      path: '/deudas',
    },
  ].filter((a) => a.count > 0)

  return (
    <div className="p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xs font-semibold text-gray-900">{widget.title}</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {alerts.length > 0 ? `${alerts.length} activas` : 'Todo en orden'}
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mb-2">
            <CircleCheck size={16} className="text-emerald-500" />
          </div>
          <p className="text-xs font-medium text-gray-600">Sin alertas</p>
        </div>
      ) : (
        <div className="space-y-1 flex-1">
          {alerts.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className="w-full flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 transition-colors text-left group"
            >
              <div className={`w-6 h-6 rounded-md ${a.bg} flex items-center justify-center shrink-0`}>
                <a.icon size={12} className={a.color} strokeWidth={2} />
              </div>
              <span className="text-[13px] font-medium text-gray-700 flex-1 truncate">{a.label}</span>
              <span className={`text-[13px] font-bold ${a.color}`}>{a.count}</span>
              <ChevronRight size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
