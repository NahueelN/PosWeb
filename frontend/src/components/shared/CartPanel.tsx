import { type ReactNode, type RefObject } from 'react'

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
    <div className="hidden lg:flex fixed right-0 top-16 bottom-0 w-1/3 border-l border-gray-200 bg-gray-50 z-30 flex flex-col p-4 gap-3">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
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
