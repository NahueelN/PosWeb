import type { ReactNode } from 'react'

interface DialogActionsProps {
  children: ReactNode
}

export default function DialogActions({ children }: DialogActionsProps) {
  return (
    <div
      className="flex items-center justify-end gap-3"
      onKeyDown={(e) => {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
        const buttons = e.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled])')
        if (buttons.length < 2) return
        const idx = Array.from(buttons).indexOf(document.activeElement as HTMLElement)
        if (idx < 0) return
        e.preventDefault()
        const next = e.key === 'ArrowRight'
          ? (idx + 1) % buttons.length
          : (idx - 1 + buttons.length) % buttons.length
        buttons[next]?.focus()
      }}
    >
      {children}
    </div>
  )
}
