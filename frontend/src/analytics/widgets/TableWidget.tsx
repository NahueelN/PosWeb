import type { Widget, DatasetColumn } from '../types'
import { formatCurrency, formatDate } from '../../formats'
import { Package, Table as TableIcon } from 'lucide-react'
import WidgetHeader from './WidgetHeader'
import { getWidgetAccent } from './chrome'

interface Props {
  widget: Widget
}

function formatCell(value: unknown, column: DatasetColumn): string {
  if (value == null || value === '') return '—'
  switch (column.type) {
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

function isNumeric(column: DatasetColumn): boolean {
  return column.type === 'currency' || column.type === 'percentage' || column.type === 'number'
}

/* ── Vista genérica: se renderiza desde los metadatos del Dataset ── */

function GenericTable({ widget }: Props) {
  const columns = widget.dataset.columns ?? []
  const rows = widget.dataset.rows ?? []
  const config = widget.config ?? {}
  const accent = getWidgetAccent(config.color, widget.definitionId)

  return (
    <div className="p-3.5 flex flex-col h-full relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${accent.spine}`} />
      <WidgetHeader
        accent={accent}
        title={widget.title}
        icon={config.icon}
        subtitle={`${rows.length} filas`}
      />

      {rows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-300">
          <div className="text-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center mx-auto mb-2 ring-1 ring-black/[0.02]">
              <TableIcon size={16} className="text-teal-300" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Sin datos</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto -mx-1">
          <table className="w-full text-[11px] border-collapse">
            <thead className="sticky top-0 z-10">
              <tr>
                {columns.map((c, ci) => (
                  <th
                    key={c.name}
                    className={`px-2.5 py-2 font-semibold text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50/95 backdrop-blur border-b border-slate-200/80 whitespace-nowrap ${
                      isNumeric(c) ? 'text-right' : 'text-left'
                    } ${ci === 0 ? 'rounded-tl-lg' : ''} ${ci === columns.length - 1 ? 'rounded-tr-lg' : ''}`}
                  >
                    {c.label ?? c.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={i}
                  className={`transition-colors ${
                    i % 2 === 1 ? 'bg-slate-50/50' : ''
                  } ${accent.rowHover}`}
                >
                  {columns.map((c, ci) => (
                    <td
                      key={c.name}
                      className={`px-2.5 py-1.5 border-b border-slate-100 max-w-[160px] truncate ${
                        isNumeric(c)
                          ? 'text-right font-medium text-slate-800 tabular-nums'
                          : ci === 0
                            ? 'text-slate-700 font-medium'
                            : 'text-slate-500'
                      }`}
                    >
                      {formatCell(r[c.name], c)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ── Vista especializada: ranking de productos más vendidos ── */

function TopProductosTable({ widget }: Props) {
  const data = widget.dataset.rows
  const maxCant = Math.max(...data.map((p) => (p['cantidad'] as number) ?? 0), 1)

  const config = widget.config ?? {}
  const accent = getWidgetAccent(config.color, widget.definitionId)
  const period = config.period
  const periodoTexto = period === '7' ? 'la última semana' : period === '30' ? 'el último mes' : 'hoy'
  const sinVentasTexto = period === '7' ? 'esta semana' : period === '30' ? 'este mes' : 'hoy'

  const rankColors = [
    'bg-teal-500 text-white',
    'bg-teal-400 text-white',
    'bg-teal-300 text-white',
    'bg-gray-100 text-gray-500',
    'bg-gray-100 text-gray-500',
  ]

  return (
    <div className="p-3.5 flex flex-col h-full relative overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${accent.spine}`} />
      <WidgetHeader
        accent={accent}
        title={widget.title}
        icon={config.icon}
        subtitle={`Los más vendidos de ${periodoTexto}`}
      />

      {data.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-300">
          <div className="text-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 flex items-center justify-center mx-auto mb-2 ring-1 ring-black/[0.02]">
              <Package size={16} className="text-teal-300" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Sin ventas {sinVentasTexto}</p>
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

export default function TableWidget({ widget }: Props) {
  if (widget.definitionId === 'top-productos') {
    return <TopProductosTable widget={widget} />
  }
  return <GenericTable widget={widget} />
}