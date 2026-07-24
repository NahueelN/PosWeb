import type { Widget } from '../types'
import { Gauge as GaugeIcon } from 'lucide-react'

interface Props {
  widget: Widget
}

export default function GaugeWidget({ widget }: Props) {
  const row = widget.dataset.rows[0] ?? {}
  const config = widget.config ?? {}

  const value = (row['value'] as number) ?? 0
  const min = config.min ?? (row['min'] as number) ?? 0
  const max = config.max ?? (row['max'] as number) ?? 100
  const range = max - min
  const pct = range > 0 ? Math.max(0, Math.min(1, (value - min) / range)) : 0

  const size = 120
  const cx = size / 2
  const cy = size / 2 + 8
  const r = 44
  const strokeWidth = 10
  const startAngle = -180
  const endAngle = 0
  const sweepAngle = startAngle + pct * (endAngle - startAngle)

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  const bgStart = polarToCartesian(cx, cy, r, startAngle)
  const bgEnd = polarToCartesian(cx, cy, r, endAngle)
  const valStart = polarToCartesian(cx, cy, r, startAngle)
  const valEnd = polarToCartesian(cx, cy, r, sweepAngle)
  const largeArc = Math.abs(sweepAngle - startAngle) > 180 ? 1 : 0

  const getColor = (p: number) => {
    if (p < 0.3) return '#ef4444'
    if (p < 0.6) return '#f59e0b'
    return '#10b981'
  }
  const color = getColor(pct)
  const ticks = [0, 0.25, 0.5, 0.75, 1]

  const formatValue = (v: number) => {
    switch (config.valueFormat) {
      case 'currency':
        return `$${v.toLocaleString('es-AR')}`
      case 'percentage':
        return `${Math.round(pct * 100)}%`
      default:
        return v.toLocaleString('es-AR')
    }
  }

  return (
    <div className="p-3.5 h-full flex flex-col justify-center relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-amber-400 to-orange-300" />
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center shrink-0 ring-1 ring-black/[0.02]">
          <GaugeIcon size={11} className="text-amber-500" strokeWidth={2.5} />
        </div>
        <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest flex-1 leading-none">
          {widget.title}
        </p>
      </div>

      <div className="flex justify-center -mt-1">
        <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
          <path
            d={`M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 1 1 ${bgEnd.x} ${bgEnd.y}`}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {pct > 0.005 && (
            <path
              d={`M ${valStart.x} ${valStart.y} A ${r} ${r} 0 ${largeArc} 1 ${valEnd.x} ${valEnd.y}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              style={{ transition: 'all 0.7s ease-out' }}
            />
          )}

          {ticks.map((t) => {
            const tickAngle = startAngle + t * (endAngle - startAngle)
            const outer = polarToCartesian(cx, cy, r + strokeWidth / 2 + 4, tickAngle)
            const inner = polarToCartesian(cx, cy, r + strokeWidth / 2 + 1, tickAngle)
            return (
              <line
                key={t}
                x1={outer.x} y1={outer.y}
                x2={inner.x} y2={inner.y}
                stroke="#e5e7eb"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            )
          })}

          {pct > 0 && (
            <circle
              cx={valEnd.x}
              cy={valEnd.y}
              r={4}
              fill={color}
              stroke="white"
              strokeWidth={2}
              style={{ transition: 'all 0.7s ease-out' }}
            />
          )}

          <text x={cx} y={cy - 4} textAnchor="middle" className="fill-gray-900 font-bold" fontSize={16}>
            {formatValue(value)}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" className="fill-gray-400" fontSize={7}>
            {formatValue(min)} — {formatValue(max)}
          </text>
        </svg>
      </div>
    </div>
  )
}
