import { type ReactNode, type RefObject } from 'react'
import { CartPanel, PaymentFooter, MontoInput, PageShell, CartItemList } from '../shared'
import type { CartItemRowProps } from '../shared/CartItemRow'
import type { UseCartReturn } from '../../hooks/useCart'
import type { CartItemBase } from '../../cart/cart-logic'

// ── Types ──────────────────────────────────────────────────────────

export interface CartHostProps<T extends CartItemBase> {
  /** useCart return value — provides items, total, actions */
  cart: UseCartReturn<T>
  /** Cart panel title. Defaults to "Productos" / "Productos (N)". */
  title?: string
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
  /** Content above the product grid (search bar, proveedor selector) */
  topContent?: ReactNode
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
  topContent,
  children,
}: CartHostProps<T>) {
  const displayTitle = title ?? (cart.items.length > 0 ? `Productos (${cart.items.length})` : 'Productos')
  const leftContent = pageShell ? (
    <PageShell title={pageShell.title} subtitle={pageShell.subtitle} caja={pageShell.caja}>
      {topContent}
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
        title={displayTitle}
        cartRef={cartRef as RefObject<HTMLDivElement | null> | undefined}
        headerExtra={
          <div className="flex items-center gap-2">
            {headerExtra}
            {cart.items.length > 0 && (
              <button onClick={() => cart.clearCart()} className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors" title="Vaciar carrito">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                </svg>
              </button>
            )}
          </div>
        }
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
