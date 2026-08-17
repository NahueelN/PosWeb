import { type RefObject, type KeyboardEvent, type FocusEvent } from 'react'

interface MontoInputProps {
  /** Label above the input (e.g., "Recibió", "Monto") */
  label?: string
  /** Raw value (e.g. "1234.50") — used for calculations */
  value: string
  /** Called with raw value on change */
  onChange: (value: string) => void
  inputRef?: RefObject<HTMLInputElement | null>
  onFocus?: (e: FocusEvent<HTMLInputElement>) => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  /** Label for the optional action button. Omit to hide the button. */
  buttonLabel?: string
  onButtonClick?: () => void
  placeholder?: string
  /** Highlight the input in red (warning state, e.g. partial payment) */
  warning?: boolean
  /** Hint text shown right below the input */
  hint?: string
}

/**
 * Shared amount input used by Ventas (Recibió) and Compras (Monto).
 * Numeric-only input ($ prefixed) with an optional side button (e.g., "Sin pago", "No pagar").
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
  warning = false,
  hint,
}: MontoInputProps) {
  return (
    <div>
      {label && (
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
      )}
      <div className="flex gap-2 mt-1">
        <div className="flex-1 relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-gray-400/60 pointer-events-none select-none">$</span>
          <input
            ref={inputRef as RefObject<HTMLInputElement>}
            type="number"
            step="0.01"
            min={0}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            onKeyDown={onKeyDown}
            className={`h-10 w-full rounded-xl border bg-white pl-8 pr-4 text-right text-[15px] font-bold placeholder:text-gray-300 placeholder:text-[13px] placeholder:font-normal shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] transition-all duration-150 tabular-nums focus:outline-none focus:ring-2 ${warning ? 'border-red-300 text-red-600 focus:ring-red-300 focus:border-red-400' : 'border-gray-200 text-gray-900 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)]'}`}
            placeholder={placeholder}
          />
        </div>
        {buttonLabel && onButtonClick && (
          <button
            onClick={onButtonClick}
            className="px-3 py-2 text-xs font-medium bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-colors"
          >
            {buttonLabel}
          </button>
        )}
      </div>
      {hint && (
        <p className="mt-1 text-[10px] text-gray-400 leading-tight">{hint}</p>
      )}
    </div>
  )
}
