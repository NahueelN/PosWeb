import { type ReactNode, type RefObject } from 'react'
import { ShoppingCart } from 'lucide-react'

interface CartPanelProps {
  /** Header content — usually a title like "Productos (3)" */
  title: ReactNode
  /** Extra controls in the header row (e.g., proveedor name, clear cart button) */
  headerExtra?: ReactNode
  /** Ref for the scrollable cart list container */
  cartRef: RefObject<HTMLDivElement | null>
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
    <div
      className="hidden lg:flex fixed right-0 top-12 bottom-0 w-1/3 flex-col z-30"
      style={{ borderLeft: '1px solid oklch(0.91 0.008 265)', background: 'oklch(0.988 0.003 258)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-2">
          <ShoppingCart size={14} strokeWidth={2} className="text-gray-400" />
          <h3 className="text-[13px] font-bold text-gray-900 tracking-tight">{title}</h3>
        </div>
        {headerExtra}
      </div>

      {/* Cart items */}
      <div ref={cartRef} className="flex-1 overflow-y-auto min-h-0">
        {children}
      </div>

      {/* Footer */}
      {footer}
    </div>
  )
}
