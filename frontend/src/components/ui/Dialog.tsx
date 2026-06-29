import { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────

export interface DialogProps {
  /** Whether the dialog is visible */
  open: boolean
  /** Called when the user requests closing (backdrop click, Escape, X button) */
  onClose: () => void
  /** Optional title — renders a header row */
  title?: string
  /** Optional description below the title */
  description?: string
  /** Dialog width. 'sm' = 384px, 'md' = 448px, 'lg' = 512px */
  width?: 'sm' | 'md' | 'lg'
  /** Main content */
  children: ReactNode
  /** Footer actions (buttons). Rendered right-aligned with gap. */
  footer?: ReactNode
  /** Whether clicking the backdrop closes the dialog. Default true. */
  closeOnBackdrop?: boolean
}

// ── Constants ──────────────────────────────────────────────────────

const widthMap: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

// ── Component ──────────────────────────────────────────────────────

export default function Dialog({
  open,
  onClose,
  title,
  description,
  width = 'sm',
  children,
  footer,
  closeOnBackdrop = true,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Trap focus inside dialog when open
  useEffect(() => {
    if (!open) return
    const el = dialogRef.current
    if (!el) return
    // Focus the first focusable element
    const first = el.querySelector<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    first?.focus()
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={[
          'bg-white rounded-2xl shadow-xl w-full animate-[fadeIn_0.15s_ease]',
          widthMap[width] || widthMap.sm,
          'mx-4 max-h-[85vh] flex flex-col',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-2 shrink-0">
            <div className="min-w-0">
              {title && (
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              )}
              {description && (
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="ml-4 w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
              aria-label="Cerrar"
            >
              <X size={16} strokeWidth={2} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-3 overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
