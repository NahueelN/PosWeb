import { type ReactNode, type RefObject } from 'react'
import Button from '../ui/Button'

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
  /** Ref for verify checkbox — keyboard focus target after monto */
  verifyRef?: RefObject<HTMLInputElement | null>
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
  verifyRef,
  confirmOverride,
}: PaymentFooterProps) {
  return (
    <div className="shrink-0 border-t border-gray-200 flex flex-col">
      {/* Total strip */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: 'oklch(0.15 0.016 262)' }}
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 leading-none">
          Total
        </span>
        <span className="text-[28px] font-bold text-white tabular-nums leading-none tracking-tight">
          ${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      <div className="px-4 pt-3 pb-3.5 flex flex-col gap-2.5">

        {/* Payment card */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-2.5">
          {children}
        </div>

        {/* Extra slot */}
        {extra}

        {/* Verify checkbox */}
        {showVerify && onVerifiedChange && (
          <label
            className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-[12px] font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all duration-150 cursor-pointer"
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                const next = !verified
                onVerifiedChange(next)
                if (next) setTimeout(() => (confirmRef as RefObject<HTMLButtonElement | null>)?.current?.focus(), 0)
              }
            }}
          >
            <input
              ref={verifyRef}
              type="checkbox"
              checked={verified}
              onChange={e => onVerifiedChange(e.target.checked)}
              className="h-3.5 w-3.5 text-[oklch(0.595_0.172_152)] border-gray-300 rounded focus:ring-[oklch(0.595_0.172_152)]"
            />
            {verifyLabel}
          </label>
        )}

        {/* Confirm button (or override) */}
        {confirmOverride ?? (
          <Button
            ref={confirmRef as React.RefObject<HTMLButtonElement>}
            variant="confirm"
            size="lg"
            fullWidth
            onClick={onConfirm}
            disabled={confirmDisabled}
          >
            {confirmLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
