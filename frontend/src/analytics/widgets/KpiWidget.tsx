import type { Widget, DatasetColumn } from '../types'
import { formatCurrency, formatDate } from '../../formats'
import {
  ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react'
import WidgetHeader from './WidgetHeader'
import { getWidgetAccent } from './chrome'

function formatValue(value: unknown, column: DatasetColumn | undefined): string {
  if (value == null) return '—'
  switch (column?.type) {
    case 'currency':
      return formatCurrency(value as number)
    case 'percentage':
      return `${value}%`
    case 'number':
      return Number(value).toLocaleString('es-AR')
    case 'date':
      return formatDate(String(value))
    default:
      return String(value)
  }
}

function VariacionBadge({ value, caption }: { value: number | null; caption?: string }) {
  if (value === null) return <span className="text-[10px] text-gray-300">—</span>
  if (value === 0)
    return (
      <span title={caption} className="inline-flex items-center gap-0.5 text-[10px] text-gray-400 cursor-help">
        <Minus size={8} /> 0%
      </span>
    )
  const pos = value > 0
  return (
    <span
      title={caption}
      className={`inline-flex items-center gap-0.5 text-[10px] font-medium cursor-help ${
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
  const columns = widget.dataset.columns ?? []

  const accent = getWidgetAccent(config.color, widget.definitionId)
  const variacion = row['variacionVentas'] ?? summary?.growth ?? null
  const variacionCaption = widget.definitionId === 'ventas-hoy' ? 'Variación vs. ayer' : undefined

  let value: string
  let sub: string | undefined

  switch (widget.definitionId) {
    // ── Widgets históricos (display específico) ──
    case 'ventas-hoy':
      value = formatCurrency(row['total'] ?? summary?.total ?? 0)
      sub = `${row['cantidad'] ?? 0} ventas`
      break
    case 'caja':
      value = formatCurrency(row['montoInicial'] ?? summary?.total ?? 0)
      sub = row['estado'] === 'Abierta' ? 'Abierta' : 'Cerrada'
      break
    case 'meta':
      value = `${row['porcentaje'] ?? 0}%`
      sub = formatCurrency(row['metaDiaria'] ?? summary?.total ?? 0)
      break
    // ── Genérico: derivado de los metadatos de columna (PAT-WidgetPlatform) ──
    default: {
      const numericCols = columns.filter((c) =>
        c.type === 'currency' || c.type === 'percentage' || c.type === 'number')
      const valueCol = numericCols[0] ?? columns[0]
      value = formatValue(row[valueCol?.name ?? ''], valueCol)

      const subCol = columns.find((c) => c.name !== valueCol?.name)
      if (subCol) {
        const raw = row[subCol.name]
        if (raw != null) {
          sub = subCol.type === 'string'
            ? String(raw)
            : `${formatValue(raw, subCol)} ${subCol.label ?? subCol.name}`
        }
      }
      break
    }
  }

  return (
    <div className="p-3.5 @lg:p-5 h-full flex flex-col relative overflow-hidden @container group hover:bg-white/40 transition-colors">
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${accent.spine}`} />
      <WidgetHeader
        accent={accent}
        title={widget.title}
        icon={config.icon}
        right={<VariacionBadge value={variacion} caption={variacionCaption} />}
      />
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <p className="text-xl @lg:text-3xl font-bold text-gray-900 tracking-tight leading-none tabular-nums">
          {value}
        </p>
        {sub && (
          <p className={`text-[11px] @lg:text-sm text-gray-400 mt-1.5`}>{sub}</p>
        )}
      </div>
    </div>
  )
}