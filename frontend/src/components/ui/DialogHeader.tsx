import { X } from 'lucide-react'
import { isValidElement, createElement, type ReactNode, type ComponentType } from 'react'

type LucideIcon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

export interface DialogHeaderProps {
  /** Lucide icon component (e.g. Package) or a React element (e.g. <Package />) */
  icon?: LucideIcon | ReactNode
  /** Context title — e.g. "Nuevo producto", "Editar cliente" */
  title: string
  /** Optional highlight value — the entity name, rendered with more visual weight below the title */
  highlight?: string
  /** Close handler */
  onClose: () => void
}

function renderIcon(icon: unknown): ReactNode {
  if (!icon) return null
  // Already a rendered React element — render it as-is
  if (isValidElement(icon)) return icon
  // Component type (function, memo, forwardRef) — instantiate it
  return createElement(icon as ComponentType<{ size?: number; className?: string }>, { size: 18, className: 'shrink-0' })
}

export default function DialogHeader({ icon, title, highlight, onClose }: DialogHeaderProps) {
  const hasHighlight = !!highlight

  return (
    <div
      className="px-4 py-[10px] shrink-0 overflow-hidden border-b"
      style={{ backgroundColor: 'var(--color-primary)', borderColor: 'var(--color-primary-hover)' }}
    >
      {/* Top row: icon + title + X */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <span className="shrink-0 text-white flex items-center">{renderIcon(icon)}</span>
          )}
          <h2 className={`truncate ${hasHighlight ? 'text-sm font-semibold text-white/80' : 'text-base font-bold text-white'}`}>
            {title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-3 w-8 h-8 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-[var(--color-primary-hover)] transition-colors shrink-0"
          aria-label="Cerrar"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Highlight row — the protagonist */}
      {hasHighlight && (
        <p className="text-base font-bold text-white uppercase truncate mt-0.5" style={{ paddingLeft: icon ? 26 : 0 }}>
          {highlight}
        </p>
      )}
    </div>
  )
}
