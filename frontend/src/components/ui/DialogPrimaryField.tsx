import type { ReactNode } from 'react'

interface DialogPrimaryFieldProps {
  label: string
  children: ReactNode
  'data-field'?: string
}

export default function DialogPrimaryField({ label, children, 'data-field': dataField }: DialogPrimaryFieldProps) {
  return (
    <div>
      <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <div data-field={dataField} className="[&>input]:h-10 [&>input]:text-base [&>input]:px-3 [&>input]:rounded-lg">
        {children}
      </div>
    </div>
  )
}
