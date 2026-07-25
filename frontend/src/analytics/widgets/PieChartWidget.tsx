import { useState } from 'react'
import type { Widget } from '../types'
import { PieChart as PieChartIcon } from 'lucide-react'

interface PieSlice {
  label: string
  value: number
  color: string
  pct: number
  startAngle: number
  endAngle: number
}

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#f97316', '#14b8a6',
]

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeArc(cx: number, cy: number, r: number, start: number, end: number) {
  const startPt = polarToCartesian(cx, cy, r, end)
  const endPt = polarToCartesian(cx, cy, r, start)
  const largeArc = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${startPt.x} ${startPt.y} A ${r} ${r} 0 ${largeArc} 0 ${endPt.x} ${endPt.y} Z`
}

interface Props {
  widget: Widget
}

export default function PieChartWidget({ widget }: Props) {
  const [hovered, setHovered] = useState<number | null>(null)
  const config = widget.config ?? {}
  const rows = widget.dataset.rows

  if (rows.length === 0) {
    return (
      <div className="p-3.5 flex flex-col items-center justify-center text-gray-300 h-full relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-400 to-rose-300" />
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-50 to-rose-50 flex items-center justify-center mb-2 ring-1 ring-black/[0.02]">
          <PieChartIcon size={16} className="text-violet-300" />
        </div>
        <p className="text-xs text-gray-400 font-medium">Sin datos</p>
      </div>
    )
  }

  const total = rows.reduce((sum, r) => sum + ((r['value'] as number) ?? 0), 0)
  const slices: PieSlice[] = []
  let angle = 0

  rows.forEach((r, i) => {
    const val = (r['value'] as number) ?? 0
    const pct = total > 0 ? (val / total) * 100 : 0
    const sweep = (val / total) * 360
    slices.push({
      label: (r['label'] as string) ?? `Item ${i + 1}`,
      value: val,
      color: COLORS[i % COLORS.length],
      pct: Math.round(pct * 10) / 10,
      startAngle: angle,
      endAngle: angle + sweep,
    })
    angle += sweep
  })

  const size = 140
  const cx = size / 2
  const cy = size / 2
  const r = 56
  const innerR = config.donut ? 32 : 0

  function describeDonutSlice(start: number, end: number) {
    const outer1 = polarToCartesian(cx, cy, r, start)
    const outer2 = polarToCartesian(cx, cy, r, end)
    const inner1 = polarToCartesian(cx, cy, innerR, end)
    const inner2 = polarToCartesian(cx, cy, innerR, start)
    const largeArc = end - start > 180 ? 1 : 0
    return [
      `M ${outer1.x} ${outer1.y}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${outer2.x} ${outer2.y}`,
      `L ${inner1.x} ${inner1.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${inner2.x} ${inner2.y}`,
      'Z',
    ].join(' ')
  }

  const formatCurrency = (v: number) =>
    `$${v.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  return (
    <div className="p-3.5 flex flex-col h-full relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-violet-400 to-rose-300" />
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold text-gray-900 tracking-wide">{widget.title}</h3>
        {config.showPercentages !== false && (
          <span className="text-[10px] text-gray-400">{rows.length} items</span>
        )}
      </div>

      <div className="flex items-center gap-4 flex-1">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
          {slices.map((s, i) => {
            const isHovered = hovered === i
            const scale = isHovered ? 1.04 : 1
            return (
              <g key={i} style={{ transform: `scale(${scale})`, transformOrigin: `${cx}px ${cy}px`, transition: 'transform 0.15s ease' }}>
                <path
                  d={innerR > 0 ? describeDonutSlice(s.startAngle, s.endAngle) : describeArc(cx, cy, r, s.startAngle, s.endAngle)}
                  fill={s.color}
                  opacity={hovered !== null && hovered !== i ? 0.4 : 1}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{ cursor: 'pointer', transition: 'opacity 0.15s ease' }}
                />
              </g>
            )
          })}
          {config.donut && (
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" className="fill-gray-900 font-bold" fontSize={16}>
              {formatCurrency(total)}
            </text>
          )}
        </svg>

        <div className="flex flex-col gap-1.5 min-w-0 flex-1">
          {slices.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-1.5 text-[10px] transition-opacity ${hovered !== null && hovered !== i ? 'opacity-30' : ''}`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              <span className="text-gray-500 truncate">{s.label}</span>
              <span className="ml-auto text-gray-900 font-semibold whitespace-nowrap">
                {config.showPercentages !== false ? `${s.pct}%` : formatCurrency(s.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
