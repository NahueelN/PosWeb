import type { ReactNode } from 'react'
import DialogSectionHeader from './DialogSectionHeader'

interface DialogSectionProps {
  icon?: ReactNode
  title: string
  children: ReactNode
  className?: string
}

export default function DialogSection({ icon, title, children, className = '' }: DialogSectionProps) {
  return (
    <div className={`border border-gray-200/60 rounded-xl bg-white shadow-[var(--shadow-card)] overflow-hidden ${className}`}>
      <DialogSectionHeader icon={icon} title={title} />
      <div className="p-2">{children}</div>
    </div>
  )
}
