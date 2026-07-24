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
      color: 'text-amber-500',
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
      path: '/stock',
    },
    {
      label: 'Caja abierta',
      count: (row['cajaAbierta'] as boolean) ? 1 : 0,
      icon: Wallet,
      color: 'text-emerald-500',
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      path: '/caja',
    },
    {
      label: 'Pedidos pendientes',
      count: (row['pedidosPendientes'] as number) ?? 0,
      icon: FileText,
      color: 'text-sky-500',
      bg: 'bg-gradient-to-br from-sky-50 to-sky-100',
      path: '/pedidos',
    },
    {
      label: 'Deudas clientes',
      count: (row['deudasCliente'] as number) ?? 0,
      icon: Users,
      color: 'text-violet-500',
      bg: 'bg-gradient-to-br from-violet-50 to-violet-100',
      path: '/deudas',
    },
    {
      label: 'Deudas proveedores',
      count: (row['deudasProveedor'] as number) ?? 0,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      path: '/deudas',
    },
  ].filter((a) => a.count > 0)

  return (
    <div className="p-3.5 flex flex-col h-full relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-400 to-rose-300" />
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[11px] font-semibold text-gray-900 tracking-wide">{widget.title}</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {alerts.length > 0 ? `${alerts.length} activas` : 'Todo en orden'}
          </p>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center mb-2 ring-1 ring-black/[0.02]">
            <CircleCheck size={16} className="text-emerald-400" />
          </div>
          <p className="text-xs text-gray-500 font-medium">Sin alertas</p>
        </div>
      ) : (
        <div className="space-y-1 flex-1">
          {alerts.map((a) => (
            <button
              key={a.label}
              onClick={() => navigate(a.path)}
              className="w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-gray-50/80 transition-colors text-left group"
            >
              <div className={`w-6 h-6 rounded-lg ${a.bg} flex items-center justify-center shrink-0 ring-1 ring-black/[0.02]`}>
                <a.icon size={11} className={a.color} strokeWidth={2} />
              </div>
              <span className="text-xs font-medium text-gray-700 flex-1 truncate">{a.label}</span>
              <span className={`text-xs font-bold ${a.color}`}>{a.count}</span>
              <ChevronRight size={11} className="text-gray-300 group-hover:text-gray-400 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
