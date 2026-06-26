import { type ReactNode, type RefObject } from 'react'
import { CartPanel, PaymentFooter, MontoInput, PageShell } from '../shared'
import type { UseCartReturn } from '../../hooks/useCart'
import type { CartItemBase } from '../../cart/cart-logic'

// ── Types ──────────────────────────────────────────────────────────

export interface CartHostProps<T extends CartItemBase> {
  /** useCart return value — provides items, total, actions */
  cart: UseCartReturn<T>
  /** Cart panel title (e.g. "Productos (3)") */
  title: string
  /** Confirm button label */
  confirmLabel: string
  /** Confirm handler */
  onConfirm: () => void | Promise<void>
  /** Disable confirm button */
  confirmDisabled?: boolean
  /** Ref for confirm button (keyboard nav) */
  confirmRef?: RefObject<HTMLButtonElement | null>
  /** Ref for cart scroll container */
  cartRef?: RefObject<HTMLDivElement | null>
  /** PageShell config — if provided, wraps left panel */
  pageShell?: {
    title: string
    subtitle?: string
    caja?: {
      loading?: boolean
      activa?: boolean | null
      closedMessage?: string
    }
  }
  /** Payment controls (medios de pago, fuente selector, etc.) */
  paymentSlot?: ReactNode
  /** Extra content in CartPanel header */
  headerExtra?: ReactNode
  /** Empty state for cart */
  emptyState?: ReactNode
  /** Show verification checkbox */
  showVerify?: boolean
  /** Verification state */
  verified?: boolean
  /** Verification change handler */
  onVerifiedChange?: (checked: boolean) => void
  /** Verification label */
  verifyLabel?: string
  /** MontoInput props */
  montoValue?: string
  onMontoChange?: (value: string) => void
  montoInputRef?: RefObject<HTMLInputElement | null>
  montoButtonLabel?: string
  onMontoButtonClick?: () => void
  /** Override confirm button (e.g. "Sin caja abierta") */
  confirmOverride?: ReactNode
  /** Custom item renderer */
  itemRenderer?: (item: T, index: number) => ReactNode
  /** Extra content after items in CartPanel */
  cartExtra?: ReactNode
  /** Left panel content (search bar, product grid, etc.) */
  children: ReactNode
}

// ── Default item renderer ──────────────────────────────────────────

function defaultItemRenderer<T extends CartItemBase>(item: T, index: number): ReactNode {
  return (
    <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 text-sm">
      <span className="text-gray-800 font-medium truncate mr-2">
        Item {index + 1}
      </span>
      <span className="text-gray-500 shrink-0">x{item.cantidad}</span>
    </div>
  )
}

// ── Component ──────────────────────────────────────────────────────

export default function CartHost<T extends CartItemBase>({
  cart,
  title,
  confirmLabel,
  onConfirm,
  confirmDisabled = false,
  confirmRef,
  cartRef,
  pageShell,
  paymentSlot,
  headerExtra,
  emptyState,
  showVerify = false,
  verified = false,
  onVerifiedChange,
  verifyLabel,
  montoValue,
  onMontoChange,
  montoInputRef,
  montoButtonLabel,
  onMontoButtonClick,
  confirmOverride,
  itemRenderer,
  cartExtra,
  children,
}: CartHostProps<T>) {
  const leftContent = pageShell ? (
    <PageShell title={pageShell.title} subtitle={pageShell.subtitle} caja={pageShell.caja}>
      {children}
    </PageShell>
  ) : (
    children
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex flex-col pb-16 lg:mr-[33.333vw] min-h-0 overflow-hidden">
        {leftContent}
      </div>

      <CartPanel
        title={title}
        cartRef={cartRef as RefObject<HTMLDivElement | null> | undefined}
        headerExtra={headerExtra}
        footer={
          <PaymentFooter
            total={cart.total}
            confirmLabel={confirmLabel}
            onConfirm={onConfirm}
            confirmDisabled={confirmDisabled}
            confirmRef={confirmRef as RefObject<HTMLButtonElement | null> | undefined}
            confirmOverride={confirmOverride}
            showVerify={showVerify}
            verified={verified}
            onVerifiedChange={onVerifiedChange}
            verifyLabel={verifyLabel}
          >
            {onMontoChange && (
              <MontoInput
                value={montoValue ?? ''}
                onChange={onMontoChange}
                inputRef={montoInputRef as RefObject<HTMLInputElement | null> | undefined}
                buttonLabel={montoButtonLabel}
                onButtonClick={onMontoButtonClick}
              />
            )}
            {paymentSlot}
          </PaymentFooter>
        }
      >
        {cart.items.length === 0 ? (
          emptyState ?? (
            <div className="text-center py-10 text-gray-400 text-sm">
              Agregá productos para armar la operación
            </div>
          )
        ) : (
          <div className="space-y-2">
            {cart.items.map((item, idx) =>
              itemRenderer ? itemRenderer(item, idx) : defaultItemRenderer(item, idx)
            )}
          </div>
        )}
        {cartExtra}
      </CartPanel>
    </div>
  )
}
