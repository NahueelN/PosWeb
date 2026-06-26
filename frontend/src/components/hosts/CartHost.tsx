import { type ReactNode, type RefObject } from 'react'
import { CartPanel, PaymentFooter, MontoInput, PageShell, CartItemList } from '../shared'
import type { CartItemRowProps } from '../shared/CartItemRow'
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
  /** Extract CartItemRow display props from each item */
  getItemProps: (item: T, index: number) => CartItemRowProps
  /** Unique key for each item */
  getItemKey?: (item: T, index: number) => string | number
  /** Extra content after items in CartPanel */
  cartExtra?: ReactNode
  /** Left panel content (search bar, product grid, etc.) */
  children: ReactNode
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
  getItemProps,
  getItemKey = (_item, idx) => idx,
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
        <CartItemList
          items={cart.items}
          getItemProps={getItemProps}
          getKey={getItemKey}
          emptyState={emptyState}
        />
        {cartExtra}
      </CartPanel>
    </div>
  )
}
