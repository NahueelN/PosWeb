import type { ReactNode } from 'react'
import { Trash2 } from 'lucide-react'

interface CarritoPopupProps {
  title: string
  count: number
  onClear?: () => void
  emptyState: ReactNode
  children: ReactNode
  footer?: ReactNode
}

/** Reusable cart panel for two-column creation dialogs. */
export default function CarritoPopup({ title, count, onClear, emptyState, children, footer }: CarritoPopupProps) {
  return (
    <section className="min-w-0 flex flex-col border border-gray-300 bg-white overflow-hidden lg:min-h-0 lg:flex-1">
      <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-gray-300 shrink-0">
        <h3 className="text-xs font-semibold text-black">{title} ({count})</h3>
        {count > 0 && onClear && (
          <button type="button" onClick={onClear}
            className="inline-flex items-center gap-1 px-2 py-0.5 border border-gray-300 text-[12px] text-black hover:border-red-400 hover:text-red-600 transition-colors">
            <Trash2 size={13} /> Limpiar todo
          </button>
        )}
      </div>
      {count === 0 ? (
        <div className="px-3 py-12 text-center text-sm text-black lg:flex-1 lg:flex lg:items-center lg:justify-center">{emptyState}</div>
      ) : (
        <div className="max-h-[420px] lg:max-h-none lg:flex-1 lg:min-h-0 overflow-y-auto">{children}</div>
      )}
      {footer && <div className="shrink-0 border-t border-gray-300">{footer}</div>}
    </section>
  )
}
