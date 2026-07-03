import { type ReactNode, type RefObject, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
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
  onMontoKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  /** Search input ref — used by global Escape handler to return focus */
  searchInputRef?: RefObject<HTMLInputElement | null>
  /** Monto button label — defaults to "Sin pago" */
  montoButtonLabel?: string
  /** Ref for the verify checkbox — keyboard focus target after monto Enter */
  verifyRef?: RefObject<HTMLInputElement | null>
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
  montoButtonLabel = 'Sin pago',
  onMontoButtonClick,
  onMontoKeyDown,
  searchInputRef,
  verifyRef,
  confirmOverride,
  getItemProps,
  getItemKey = (_item, idx) => idx,
  cartExtra,
  topContent,
  children,
}: CartHostProps<T>) {
  // Escape global — vuelve al buscador desde cualquier lado
  useEffect(() => {
    if (!searchInputRef) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (document.querySelector('[role="dialog"]')) return
      // No interferir con el input de cantidad del carrito (tiene su propio Escape)
      const active = document.activeElement as HTMLElement | null
      if (active?.hasAttribute('data-cart-qty')) return
      e.preventDefault()
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [searchInputRef])

  // Default handlers for monto input
  const nextAfterMonto = () => {
    const el = verifyRef?.current ?? (confirmRef as RefObject<HTMLButtonElement | null>)?.current
    el?.focus()
  }

  const handleMontoKeyDown = onMontoKeyDown ?? ((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setTimeout(nextAfterMonto, 0)
    }
  })

  const handleMontoButtonClick = () => {
    onMontoButtonClick?.()
    setTimeout(nextAfterMonto, 0)
  }

  const displayTitle = title ?? (cart.items.length > 0 ? `Productos (${cart.items.length})` : 'Productos')
  const leftContent = pageShell ? (
    <PageShell title={pageShell.title} subtitle={pageShell.subtitle} caja={pageShell.caja}>
      {topContent && <div className="pb-2">{topContent}</div>}
      {children}
    </PageShell>
  ) : (
    children
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex flex-col pb-14 lg:mr-[33.333vw] min-h-0 overflow-hidden">
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
                <Trash2 size={16} />
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
            verifyRef={verifyRef as RefObject<HTMLInputElement | null> | undefined}
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
                onButtonClick={handleMontoButtonClick}
                onKeyDown={handleMontoKeyDown}
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
