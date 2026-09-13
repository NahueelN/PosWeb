import { type ReactNode, useId } from 'react'

type CheckboxLabelPosition = 'left' | 'right'

export interface CheckboxProps {
  /** Estado controlado del check */
  checked: boolean
  /** Callback con el nuevo estado al alternar (por click o teclado) */
  onChange: (checked: boolean) => void
  /** Texto del label. Al hacer click sobre él también alterna el check */
  label?: ReactNode
  /** Texto secundario debajo del label. No alterna el check */
  description?: ReactNode
  /** Posición del label respecto del check. Default: 'right' */
  labelPosition?: CheckboxLabelPosition
  /** Deshabilita el control completo */
  disabled?: boolean
  /** Clases adicionales para el contenedor */
  className?: string
}

const boxStyles = [
  'h-4 w-4 shrink-0 rounded border-gray-300 text-[var(--color-primary)]',
  'focus:ring-[var(--color-primary-ring)] transition-shadow',
].join(' ')

export default function Checkbox({
  checked,
  onChange,
  label,
  description,
  labelPosition = 'right',
  disabled = false,
  className = '',
}: CheckboxProps) {
  const id = useId()

  return (
    <div className={`min-w-0 ${className}`}>
      <label
        htmlFor={id}
        className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer select-none'}`}
      >
        {labelPosition === 'left' && label && (
          <span className="text-sm font-medium text-gray-800">{label}</span>
        )}
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={event => onChange(event.target.checked)}
          className={boxStyles}
        />
        {labelPosition === 'right' && label && (
          <span className="text-sm font-medium text-gray-800">{label}</span>
        )}
      </label>
      {description && (
        <p className="mt-0.5 text-xs text-gray-500">{description}</p>
      )}
    </div>
  )
}
