// Widget Header
// Encabezado unificado de widget: chip de ícono + título + subtítulo + slot derecho.
// Usado por todos los widgets para mantener el mismo lenguaje visual.

import type { ReactNode } from 'react'
import type { WidgetAccent } from './chrome'
import { resolveWidgetIcon } from './chrome'

interface Props {
  accent: WidgetAccent
  title: string
  icon?: string | null
  subtitle?: string | ReactNode
  right?: ReactNode
}

export default function WidgetHeader({ accent, title, icon, subtitle, right }: Props) {
  const Icon = resolveWidgetIcon(icon)
  return (
    <div className="flex items-center gap-2.5 min-w-0 mb-2.5">
      <div
        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${accent.chipBg} flex items-center justify-center ring-1 ring-black/[0.02] shrink-0`}
      >
        <Icon size={13} className={accent.chipText} strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[11px] font-semibold text-gray-900 tracking-wide truncate">
          {title}
        </h3>
        {subtitle && <p className="text-[10px] text-gray-400 mt-0.5 truncate">{subtitle}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}