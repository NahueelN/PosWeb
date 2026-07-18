import type { Widget } from '../types'
import { formatCurrency } from '../../formats'
import {
  DollarSign, Wallet, TrendingUp, BarChart3, Target,
  ArrowUpRight, ArrowDownRight, Minus
} from 'lucide-react'

const iconMap: Record<string, React.ElementType> = {
  dollar: DollarSign,
  wallet: Wallet,
  trending: TrendingUp,
  chart: BarChart3,
  target: Target,
}

const colorMap: Record<string, { text: string; bg: string }> = {
  indigo: { text: 'text-indigo-600', bg: 'bg-indigo-50' },
  emerald: { text: 'text-emerald-600', bg: 'bg-emerald-50' },
  blue: { text: 'text-blue-600', bg: 'bg-blue-50' },
  purple: { text: 'text-purple-600', bg: 'bg-purple-50' },
  amber: { text: 'text-amber-600', bg: 'bg-amber-50' },
  gray: { text: 'text-gray-400', bg: 'bg-gray-50' },
}

function VariacionBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[10px] text-gray-300">—</span>
  if (value === 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400">
        <Minus size={9} /> 0%
      </span>
    )
  const pos = value > 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
        pos ? 'text-emerald-600' : 'text-red-500'
      }`}
    >
      {pos ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
      {Math.abs(value)}%
    </span>
  )
}

interface Props {
  widget: Widget
}

export default function KpiWidget({ widget }: Props) {
  const row = widget.dataset.rows[0] ?? {}
  const summary = widget.dataset.summary
  const config = widget.config ?? {}

  const Icon = iconMap[config.icon ?? 'dollar'] ?? DollarSign
  const colors = colorMap[config.color ?? 'indigo'] ?? colorMap.indigo

  // Extract values from dataset
  const total = row['total'] ?? summary?.total ?? 0
  const variacion = row['variacionVentas'] ?? summary?.growth ?? null

  // Format value based on widget id
  let value: string
  let sub: string | undefined

  switch (widget.id) {
    case 'ventas-hoy':
      value = formatCurrency(total)
      sub = `${row['cantidad'] ?? 0} ventas`
      break
    case 'caja':
      value = formatCurrency(row['montoInicial'] ?? total)
      sub = row['estado'] === 'Abierta' ? 'Abierta' : 'Cerrada'
      break
    case 'meta':
      value = `${row['porcentaje'] ?? 0}%`
      sub = formatCurrency(row['metaDiaria'] ?? total)
      break
    default:
      value = formatCurrency(total)
      break
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 group hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${colors.bg} shrink-0 transition-transform duration-200 group-hover:scale-110`}
        >
          <Icon size={12} className={colors.text} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider leading-none mb-0.5">
            {widget.title}
          </p>
          <p className="text-base font-bold text-gray-900 tracking-tight leading-none">{value}</p>
          {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <VariacionBadge value={variacion} />
      </div>
    </div>
  )
}
