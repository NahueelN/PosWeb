import { isValidElement, createElement, type ReactNode, type ComponentType } from 'react'

interface DialogSectionHeaderProps {
  icon?: ReactNode
  title: string
}

function renderIcon(icon: unknown): ReactNode {
  if (!icon) return null
  if (isValidElement(icon)) return icon
  return createElement(icon as ComponentType<{ size?: number }>, { size: 16 })
}

export default function DialogSectionHeader({ icon, title }: DialogSectionHeaderProps) {
  return (
    <div
      className="px-2.5 py-2 border-b flex items-center gap-2 shrink-0"
      style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary-hover)' }}
    >
      {icon && <span className="shrink-0 text-white flex items-center">{renderIcon(icon)}</span>}
      <h3 className="text-sm font-bold uppercase tracking-wider text-white">{title}</h3>
    </div>
  )
}
