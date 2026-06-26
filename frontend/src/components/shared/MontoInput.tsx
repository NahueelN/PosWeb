import { type RefObject, type KeyboardEvent, type FocusEvent } from 'react'

interface MontoInputProps {
  /** Label above the input (e.g., "Recibió", "Monto") */
  label?: string
  value: string
  onChange: (value: string) => void
  inputRef?: RefObject<HTMLInputElement | null>
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  /** Label for the optional action button. Omit to hide the button. */
  buttonLabel?: string
  onButtonClick?: () => void
  placeholder?: string
}

/**
 * Shared amount input used by Ventas (Recibió) and Compras (Monto).
 * Renders a $ prefixed input with an optional side button (e.g., "Sin pago", "No pagar").
 */
export default function MontoInput({
  label,
  value,
  onChange,
  inputRef,
  onFocus,
  onKeyDown,
  buttonLabel,
  onButtonClick,
  placeholder = '0.00',
}: MontoInputProps) {
  return (
    <div>
      {label && (
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      )}
      <div className="flex gap-2 mt-1">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-mono">$</span>
          <input
            ref={inputRef as RefObject<HTMLInputElement>}
            type="number"
            step="0.01"
            min="0"
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-right font-mono focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            placeholder={placeholder}
          />
        </div>
        {buttonLabel && onButtonClick && (
          <button
            onClick={onButtonClick}
            className="px-3 py-2 text-xs font-medium bg-white border border-gray-300 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
          >
            {buttonLabel}
          </button>
        )}
      </div>
    </div>
  )
}
