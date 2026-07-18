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

  // SVG gauge: semicircle from -90° to 90°
  const size = 120
  const cx = size / 2
  const cy = size / 2 + 8
  const r = 44
  const strokeWidth = 10
  const circumference = Math.PI * r // semicircle

  // Arc from left to right
  const startAngle = -180
  const endAngle = 0
  const sweepAngle = startAngle + pct * (endAngle - startAngle)

  function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  // Background arc
  const bgStart = polarToCartesian(cx, cy, r, startAngle)
  const bgEnd = polarToCartesian(cx, cy, r, endAngle)

  // Value arc
  const valStart = polarToCartesian(cx, cy, r, startAngle)
  const valEnd = polarToCartesian(cx, cy, r, sweepAngle)

  const largeArc = Math.abs(sweepAngle - startAngle) > 180 ? 1 : 0

  // Color based on value position
  const getColor = (p: number) => {
    if (p < 0.3) return '#ef4444'       // red
    if (p < 0.6) return '#f59e0b'       // amber
    return '#10b981'                      // emerald
  }
  const color = getColor(pct)

  // Tick marks
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
    <div className="bg-white rounded-xl border border-gray-100 p-2 group hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-5 h-5 rounded-md flex items-center justify-center bg-amber-50 shrink-0">
          <GaugeIcon size={10} className="text-amber-600" strokeWidth={2.5} />
        </div>
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider flex-1">
          {widget.title}
        </p>
      </div>

      <div className="flex justify-center">
        <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
          {/* Background arc */}
          <path
            d={`M ${bgStart.x} ${bgStart.y} A ${r} ${r} 0 1 1 ${bgEnd.x} ${bgEnd.y}`}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value arc */}
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

          {/* Tick marks */}
          {ticks.map((t) => {
            const tickAngle = startAngle + t * (endAngle - startAngle)
            const outer = polarToCartesian(cx, cy, r + strokeWidth / 2 + 4, tickAngle)
            const inner = polarToCartesian(cx, cy, r + strokeWidth / 2 + 1, tickAngle)
            return (
              <line
                key={t}
                x1={outer.x} y1={outer.y}
                x2={inner.x} y2={inner.y}
                stroke="#d1d5db"
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            )
          })}

          {/* Needle dot */}
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

          {/* Center value */}
          <text x={cx} y={cy - 4} textAnchor="middle" className="fill-gray-900 font-bold" fontSize={16}>
            {formatValue(value)}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" className="fill-gray-400" fontSize={8}>
            {formatValue(min)} — {formatValue(max)}
          </text>
        </svg>
      </div>
    </div>
  )
}
