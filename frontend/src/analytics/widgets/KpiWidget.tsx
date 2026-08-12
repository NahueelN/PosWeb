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

const accentMap: Record<string, { bar: string; iconBg: string; iconText: string }> = {
  indigo:  { bar: 'from-indigo-400 to-indigo-300', iconBg: 'from-indigo-50 to-indigo-100', iconText: 'text-indigo-500' },
  emerald: { bar: 'from-emerald-400 to-emerald-300', iconBg: 'from-emerald-50 to-emerald-100', iconText: 'text-emerald-500' },
  blue:    { bar: 'from-sky-400 to-sky-300', iconBg: 'from-sky-50 to-sky-100', iconText: 'text-sky-500' },
  purple:  { bar: 'from-violet-400 to-violet-300', iconBg: 'from-violet-50 to-violet-100', iconText: 'text-violet-500' },
  amber:   { bar: 'from-amber-400 to-amber-300', iconBg: 'from-amber-50 to-amber-100', iconText: 'text-amber-500' },
  gray:    { bar: 'from-gray-300 to-gray-200', iconBg: 'from-gray-50 to-gray-100', iconText: 'text-gray-400' },
}

function VariacionBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-[10px] text-gray-300">—</span>
  if (value === 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400">
        <Minus size={8} /> 0%
      </span>
    )
  const pos = value > 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[10px] font-medium ${
        pos ? 'text-emerald-500' : 'text-red-400'
      }`}
    >
      {pos ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
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
  const accent = accentMap[config.color ?? 'indigo'] ?? accentMap.indigo

  const total = row['total'] ?? summary?.total ?? 0
  const variacion = row['variacionVentas'] ?? summary?.growth ?? null

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
    <div className="p-3.5 @lg:p-5 h-full flex flex-col justify-center relative overflow-hidden @container">
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${accent.bar}`} />
      <div className="flex items-start gap-2.5">
        <div
          className={`w-8 h-8 @lg:w-10 @lg:h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${accent.iconBg} shrink-0 mt-0.5 ring-1 ring-black/[0.02]`}
        >
          <Icon size={14} className={accent.iconText} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[10px] @lg:text-xs font-medium text-gray-400 uppercase tracking-widest leading-none">
              {widget.title}
            </p>
          </div>
          <p className="text-xl @lg:text-3xl font-bold text-gray-900 tracking-tight leading-none mt-1">
            {value}
          </p>
          {sub && (
            <p className={`text-[11px] @lg:text-sm text-gray-400 mt-1.5`}>{sub}</p>
          )}
        </div>
        <div className="shrink-0 mt-0.5">
          <VariacionBadge value={variacion} />
        </div>
      </div>
    </div>
  )
}
