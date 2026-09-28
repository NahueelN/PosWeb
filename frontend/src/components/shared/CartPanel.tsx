import { type ReactNode, type RefObject } from 'react'
import { ShoppingCart } from 'lucide-react'

interface CartPanelProps {
  /** Header content — usually a title like "Productos (3)" */
  title: ReactNode
  /** Extra controls in the header row (e.g., proveedor name, clear cart button) */
  headerExtra?: ReactNode
  /** Ref for the scrollable cart list container */
  cartRef?: RefObject<HTMLDivElement | null>
  /** Cart items content */
  children: ReactNode
  /** Footer section (payment summary) */
  footer: ReactNode
}

/**
 * Shared right panel used by Ventas and Compras.
 * Fixed 1/3 width on lg+, scrollable cart in the middle, footer at the bottom.
 */
export default function CartPanel({ title, headerExtra, cartRef, children, footer }: CartPanelProps) {
  return (
    <div className="hidden lg:flex fixed right-0 top-12 bottom-0 w-1/3 flex-col z-30 border-l border-slate-200 bg-white shadow-[-8px_0_24px_-18px_rgba(15,23,42,0.35)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-slate-50/70 shrink-0">
        <div className="flex min-w-0 items-center gap-2">
          <ShoppingCart size={15} strokeWidth={2} className="text-slate-400" />
          <h3 className="shrink-0 whitespace-nowrap text-[13px] font-bold text-slate-900 tracking-tight">{title}</h3>
        </div>
        {headerExtra}
      </div>

      {/* Cart items */}
      <div ref={cartRef} className="flex-1 overflow-y-auto min-h-0 bg-white">
        {children}
      </div>

      {/* Footer */}
      {footer}
    </div>
  )
}
