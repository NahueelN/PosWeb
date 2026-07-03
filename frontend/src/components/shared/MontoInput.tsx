import { useState, useCallback, type RefObject, type KeyboardEvent, type FocusEvent } from 'react'

function formatDisplay(raw: string): string {
  if (!raw) return ''
  const n = parseFloat(raw)
  if (isNaN(n)) return raw
  if (n === 0) return '0,00'
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseRaw(formatted: string): string {
  // "1.234,50" → "1234.50"
  return formatted.replace(/\./g, '').replace(',', '.')
}

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
}

/**
 * Shared amount input used by Ventas (Recibió) and Compras (Monto).
 * Displays formatted numbers (1.234,50) while storing raw values.
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
  const [focused, setFocused] = useState(false)

  const displayValue = focused ? value : formatDisplay(value)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = parseRaw(e.target.value)
    onChange(raw)
  }, [onChange])

  const handleFocus = useCallback((e: FocusEvent<HTMLInputElement>) => {
    setFocused(true)
    onFocus?.(e)
  }, [onFocus])

  const handleBlur = useCallback(() => {
    setFocused(false)
  }, [])

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
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={onKeyDown}
            className="h-10 w-full rounded-xl border border-gray-200 bg-white pl-8 pr-4 text-right text-[15px] font-bold text-gray-900 placeholder:text-gray-300 placeholder:text-[13px] placeholder:font-normal shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] transition-all duration-150 tabular-nums focus:outline-none focus:ring-2 focus:ring-[oklch(0.52_0.255_278_/_0.30)] focus:border-[oklch(0.52_0.255_278_/_0.60)]"
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
    </div>
  )
}
