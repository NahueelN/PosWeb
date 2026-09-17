import { type ReactNode } from 'react'

export type PrefixedCodeInputSize = 'sm' | 'lg'

export interface PrefixedCodeInputProps {
  /** Prefijo fijo mostrado dentro del input (ej: PROD, COMB) */
  prefix: string
  /** Valor completo, incluyendo el prefijo */
  value: string
  /** Recibe el valor completo con el prefijo aplicado. Devuelve '' si se borra todo */
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** Altura del control. Default: 'sm' */
  size?: PrefixedCodeInputSize
  /** Identificador para la navegación por teclado del formulario padre */
  dataField?: string
  /** Contenido a la derecha dentro del input (ej: botón imprimir) */
  trailing?: ReactNode
  className?: string
}

const sizeStyles: Record<PrefixedCodeInputSize, { input: string; prefix: string; charWidth: number }> = {
  sm: { input: 'h-7 rounded-md text-sm', prefix: 'text-[10px]', charWidth: 6.25 },
  lg: { input: 'h-9 rounded-lg text-sm', prefix: 'text-[11px]', charWidth: 6.6 },
}

export default function PrefixedCodeInput({
  prefix,
  value,
  onChange,
  placeholder,
  disabled = false,
  size = 'sm',
  dataField,
  trailing,
  className = '',
}: PrefixedCodeInputProps) {
  const sufijo = value.startsWith(prefix) ? value.substring(prefix.length) : value
  const style = sizeStyles[size]

  return (
    <div className={`relative ${className}`}>
      <span className={`absolute left-1.5 top-1/2 -translate-y-1/2 font-mono text-gray-400 select-none ${style.prefix}`}>
        {prefix}
      </span>
      <input
        type="text"
        value={sufijo}
        disabled={disabled}
        data-field={dataField}
        onChange={event => {
          const val = event.target.value.trim()
          onChange(val ? prefix + val : '')
        }}
        placeholder={placeholder}
        style={{ paddingLeft: `${6 + prefix.length * style.charWidth}px` }}
        className={`w-full pr-7 border border-gray-300 font-mono outline-none transition-all duration-150 focus:ring-2 focus:ring-[var(--color-primary-ring)] focus:border-[var(--color-primary)] hover:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400 ${style.input}`}
      />
      {trailing && (
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
          {trailing}
        </span>
      )}
    </div>
  )
}
