import type { ReactNode } from 'react'
import DialogSectionHeader from './DialogSectionHeader'

interface DialogDashboardProps {
  icon?: ReactNode
  title: string
  children: ReactNode
  className?: string
}

export default function DialogDashboard({ icon, title, children, className = '' }: DialogDashboardProps) {
  return (
    <div className={`border border-gray-200/60 rounded-xl bg-white shadow-[var(--shadow-card)] overflow-hidden ${className}`}>
      <DialogSectionHeader icon={icon} title={title} />
      <div className="p-2 space-y-2">{children}</div>
    </div>
  )
}

// ── Dashboard Row ───────────────────────────────────────────────────

interface DashboardRowProps {
  label: string
  value: string
  variant?: 'default' | 'primary' | 'confirm'
}

const variantStyles: Record<string, string> = {
  default: 'text-gray-900',
  primary: 'text-[var(--color-primary)]',
  confirm: 'text-[var(--color-confirm)]',
}

export function DialogDashboardRow({ label, value, variant = 'default' }: DashboardRowProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className={`text-sm font-bold ${variantStyles[variant]}`}>{value}</span>
    </div>
  )
}
