import { type ReactNode, type RefObject } from 'react'

interface PaymentFooterProps {
  /** Total amount to display */
  total: number
  /** Content inside the payment card (medios de pago, recibio, fuente selector, etc.) */
  children: ReactNode
  /** Optional element between the payment card and the verify checkbox (e.g., cliente seleccionado) */
  extra?: ReactNode
  /** Show verify checkbox */
  showVerify?: boolean
  verified?: boolean
  onVerifiedChange?: (checked: boolean) => void
  verifyLabel?: string
  /** Confirm button */
  confirmLabel: string
  onConfirm: () => void
  confirmDisabled?: boolean
  confirmRef?: RefObject<HTMLButtonElement | null>
  /** Replace confirm button entirely (e.g., "Sin caja abierta" message) */
  confirmOverride?: ReactNode
}

/**
 * Shared payment footer used by Ventas and Compras.
 * Renders: Total → Payment card (children) → extra → verify → confirm.
 *
 * Override slots:
 * - `children`: everything inside the bg-gray-50 card (medios/fuente/recibio/debt)
 * - `extra`: placed between the card and the verify checkbox
 * - `confirmOverride`: replaces the confirm button (e.g., "Sin caja abierta" state)
 */
export default function PaymentFooter({
  total,
  children,
  extra,
  showVerify = false,
  verified = false,
  onVerifiedChange,
  verifyLabel = 'Verifiqué productos y medios de pago',
  confirmLabel,
  onConfirm,
  confirmDisabled = false,
  confirmRef,
  confirmOverride,
}: PaymentFooterProps) {
  return (
    <div className="shrink-0 space-y-3 border-t border-gray-200 pt-3">
      {/* Total */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">Total</span>
        <span className="text-lg font-bold text-indigo-700">${total.toFixed(2)}</span>
      </div>

      {/* Payment card */}
      <div className="bg-gray-50 rounded-xl p-3 space-y-2.5">
        {children}
      </div>

      {/* Extra slot (e.g., cliente seleccionado) */}
      {extra}

      {/* Verify checkbox */}
      {showVerify && onVerifiedChange && (
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={verified}
            onChange={e => onVerifiedChange(e.target.checked)}
            className="h-3.5 w-3.5 text-indigo-600 border-gray-300 rounded"
          />
          {verifyLabel}
        </label>
      )}

      {/* Confirm button (or override) */}
      {confirmOverride ?? (
        <button
          ref={confirmRef as React.RefObject<HTMLButtonElement>}
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled}
          className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {confirmLabel}
        </button>
      )}
    </div>
  )
}
