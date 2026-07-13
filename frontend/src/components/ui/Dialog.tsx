import { type ReactNode, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import DialogHeader, { type DialogHeaderProps } from './DialogHeader'
import ErrorBoundary from './ErrorBoundary'
import { useNotification } from '../../context/NotificationContext'

// ── Types ──────────────────────────────────────────────────────────

export interface DialogProps {
  /** Whether the dialog is visible */
  open: boolean
  /** Called when the user requests closing (backdrop click, Escape, X button) */
  onClose: () => void
  /** Optional title — renders DialogHeader with primary background */
  title?: string
  /** Optional Lucide icon next to the title (component or element) */
  icon?: DialogHeaderProps['icon']
  /** Optional entity name — rendered with more weight below the title */
  highlight?: string
  /** Optional description below the title, rendered in the body area */
  description?: string
  /** Dialog width. 'sm' = 384px, 'md' = 448px, 'lg' = 512px, 'xl' = 1024px */
  width?: 'sm' | 'md' | 'lg' | 'xl'
  /** Main content */
  children?: ReactNode
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
  xl: 'max-w-[1100px]',
}

// ── Component ──────────────────────────────────────────────────────

export default function Dialog({
  open,
  onClose,
  title,
  icon,
  highlight,
  description,
  width = 'sm',
  children,
  footer,
  closeOnBackdrop = true,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const { notifyError } = useNotification()

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
    // If an element already has focus inside the dialog (autoFocus), respect it
    if (el.contains(document.activeElement)) return
    // Focus the first focusable element inside the body first, fallback to whole dialog
    const body = el.querySelector<HTMLElement>('[data-dialog-body]')
    const query = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    const first = (body?.querySelector<HTMLElement>(query)) ?? el.querySelector<HTMLElement>(query)
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
          'overflow-hidden',
          widthMap[width] || widthMap.sm,
          'mx-4 max-h-[85vh] flex flex-col',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* DialogHeader — primary background, icon, title, highlight, X */}
        {title && (
          <DialogHeader icon={icon} title={title} highlight={highlight} onClose={onClose} />
        )}

        {/* Description badge (only when there's no header — rare) */}
        {!title && description && (
          <div className="px-6 pt-6 pb-2 shrink-0">
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        )}

        {/* Body */}
        <div data-dialog-body className="px-6 py-3 overflow-y-auto">
          <ErrorBoundary onUnexpectedError={(err) => { notifyError(err.message); onClose() }}>
            {title && description && (
              <p className="text-sm text-gray-500 mb-4">{description}</p>
            )}
            {children}
          </ErrorBoundary>
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 pb-6 pt-2 flex items-center justify-end gap-3 shrink-0"
            onKeyDown={(e) => {
              if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
              const buttons = e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled])')
              if (buttons.length < 2) return
              const idx = Array.from(buttons).indexOf(document.activeElement as HTMLElement)
              if (idx < 0) return
              e.preventDefault()
              const next = e.key === 'ArrowRight' ? (idx + 1) % buttons.length : (idx - 1 + buttons.length) % buttons.length
              buttons[next]?.focus()
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
