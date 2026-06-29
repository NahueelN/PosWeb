"use client"

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useId,
} from "react"
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Banknote,
  ArrowLeftRight,
  CreditCard,
  Smartphone,
  QrCode,
  CheckCircle2,
  Circle,
  Keyboard,
} from "lucide-react"
import { type Product, formatPrice } from "./product-data"
import { KeyboardHelpModal } from "./keyboard-help-modal"
import { cn } from "@/lib/utils"

/* ─────────────────────────────────────────────────────────
   Types
   ───────────────────────────────────────────────────────── */
export type CartItem = {
  product: Product
  qty: number
}

type PaymentMethod = "efectivo" | "transferencia" | "debito" | "credito" | "qr"

/* ─────────────────────────────────────────────────────────
   Payment method definitions — shortcuts updated to Alt+1..5
   (F5/F6/F7 conflicted with browser reload / address bar / caret browsing)
   ───────────────────────────────────────────────────────── */
const PAYMENT_METHODS: {
  id: PaymentMethod
  label: string
  shortLabel: string
  icon: React.ReactNode
  shortcut: string
  altKey: string   // display label for the shortcut hint
}[] = [
  {
    id: "efectivo",
    label: "Efectivo",
    shortLabel: "Efectivo",
    icon: <Banknote size={16} strokeWidth={1.75} />,
    shortcut: "Alt+1",
    altKey: "1",
  },
  {
    id: "transferencia",
    label: "Transferencia",
    shortLabel: "Transfer.",
    icon: <ArrowLeftRight size={16} strokeWidth={1.75} />,
    shortcut: "Alt+2",
    altKey: "2",
  },
  {
    id: "debito",
    label: "Debito",
    shortLabel: "Debito",
    icon: <CreditCard size={16} strokeWidth={1.75} />,
    shortcut: "Alt+3",
    altKey: "3",
  },
  {
    id: "credito",
    label: "Credito",
    shortLabel: "Credito",
    icon: <Smartphone size={16} strokeWidth={1.75} />,
    shortcut: "Alt+4",
    altKey: "4",
  },
  {
    id: "qr",
    label: "QR",
    shortLabel: "QR",
    icon: <QrCode size={16} strokeWidth={1.75} />,
    shortcut: "Alt+5",
    altKey: "5",
  },
]

/* ─────────────────────────────────────────────────────────
   CartRow — single item in the cart list
   ───────────────────────────────────────────────────────── */
function CartRow({
  item,
  onUpdateQty,
  onRemove,
  isLast,
}: {
  item: CartItem
  onUpdateQty: (id: string, delta: number) => void
  onRemove: (id: string) => void
  isLast: boolean
}) {
  const qtyRef = useRef<HTMLSpanElement>(null)

  const handleQtyChange = useCallback(
    (delta: number) => {
      onUpdateQty(item.product.id, delta)
      if (qtyRef.current) {
        qtyRef.current.classList.remove("animate-qty-pop")
        void qtyRef.current.offsetWidth
        qtyRef.current.classList.add("animate-qty-pop")
      }
    },
    [onUpdateQty, item.product.id]
  )

  return (
    <li
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors",
        "hover:bg-muted/30",
        !isLast && "border-b border-border/50"
      )}
    >
      {/* Qty controls — always visible */}
      <div className="flex-shrink-0 flex flex-col items-center gap-1">
        <button
          onClick={() => handleQtyChange(1)}
          className="flex h-[22px] w-[22px] items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-90 transition-all duration-100"
          aria-label={`Aumentar cantidad de ${item.product.name}`}
        >
          <Plus size={9} strokeWidth={3} />
        </button>

        <span
          ref={qtyRef}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary text-[12px] font-bold tabular-nums leading-none select-none"
        >
          {item.qty}
        </span>

        <button
          onClick={() => handleQtyChange(-1)}
          className="flex h-[22px] w-[22px] items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary active:scale-90 transition-all duration-100"
          aria-label={`Reducir cantidad de ${item.product.name}`}
        >
          <Minus size={9} strokeWidth={3} />
        </button>
      </div>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] font-semibold text-foreground leading-snug line-clamp-1">
          {item.product.name}
        </p>
        <p className="text-[11px] text-muted-foreground/65 tabular-nums mt-0.5">
          ${formatPrice(item.product.price)}
          {item.qty > 1 && (
            <span className="ml-1 text-muted-foreground/40">x {item.qty}</span>
          )}
        </p>
      </div>

      {/* Line total + delete */}
      <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
        <p className="text-[13px] font-bold text-foreground tabular-nums leading-none">
          ${formatPrice(item.product.price * item.qty)}
        </p>
        <button
          onClick={() => onRemove(item.product.id)}
          className="flex h-[22px] w-[22px] items-center justify-center rounded-md text-muted-foreground/35 hover:text-destructive hover:bg-destructive/8 active:scale-90 transition-all duration-100"
          aria-label={`Quitar ${item.product.name} del carrito`}
        >
          <Trash2 size={10} strokeWidth={2} />
        </button>
      </div>
    </li>
  )
}

/* ─────────────────────────────────────────────────────────
   CartPanel
   ───────────────────────────────────────────────────────── */
type Props = {
  items: CartItem[]
  onUpdateQty: (productId: string, delta: number) => void
  onRemove: (productId: string) => void
  /** Ref to the search input so global shortcuts can return focus there */
  searchRef?: React.RefObject<HTMLInputElement>
  /** Whether the help modal is open — controlled by parent to allow ? from anywhere */
  helpOpen?: boolean
  onHelpOpen?: () => void
  onHelpClose?: () => void
}

export function CartPanel({
  items,
  onUpdateQty,
  onRemove,
  searchRef,
  helpOpen = false,
  onHelpOpen,
  onHelpClose,
}: Props) {
  const [amountPaid, setAmountPaid] = useState("")
  const [payment, setPayment] = useState<PaymentMethod | null>(null)
  const [verified, setVerified] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLButtonElement>(null)
  const verifyRef = useRef<HTMLButtonElement>(null)
  const helpButtonRef = useRef<HTMLButtonElement>(null)
  const checkboxId = useId()

  const total = items.reduce((sum, i) => sum + i.product.price * i.qty, 0)
  const paid = parseFloat(amountPaid.replace(",", ".")) || 0
  const change = paid - total
  const totalUnits = items.reduce((s, i) => s + i.qty, 0)
  const canConfirm = items.length > 0 && verified

  /* Auto-focus amount when payment method is selected */
  useEffect(() => {
    if (payment) {
      requestAnimationFrame(() => amountRef.current?.focus())
    }
  }, [payment])

  /* Reset verification when cart contents change */
  useEffect(() => {
    setVerified(false)
  }, [items.length])

  const resetPaymentPanel = useCallback(() => {
    setAmountPaid("")
    setPayment(null)
    setVerified(false)
    requestAnimationFrame(() => amountRef.current?.focus())
  }, [])

  const selectPayment = useCallback((id: PaymentMethod) => {
    setPayment((prev) => {
      const next = prev === id ? null : id
      if (next) requestAnimationFrame(() => amountRef.current?.focus())
      return next
    })
  }, [])

  /* ── Global keyboard shortcuts ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block all shortcuts when help modal is open
      if (helpOpen) return

      // Alt+1..5: select payment method (replaces F5–F9 which conflict with browser)
      // Alt+0: reset panel (replaces F2)
      if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
        const altKeyMap: Record<string, PaymentMethod> = {
          "1": "efectivo",
          "2": "transferencia",
          "3": "debito",
          "4": "credito",
          "5": "qr",
        }
        if (altKeyMap[e.key]) {
          e.preventDefault()
          selectPayment(altKeyMap[e.key])
          return
        }
        if (e.key === "0") {
          e.preventDefault()
          resetPaymentPanel()
          return
        }
      }

      // Ctrl+Enter: confirm sale from anywhere
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        if (canConfirm) confirmRef.current?.click()
        return
      }

      // F4: focus verify button
      if (e.key === "F4") {
        e.preventDefault()
        verifyRef.current?.focus()
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [canConfirm, helpOpen, selectPayment, resetPaymentPanel])

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return
    setAmountPaid("")
    setPayment(null)
    setVerified(false)
    requestAnimationFrame(() => searchRef?.current?.focus())
  }, [canConfirm, searchRef])

  const handleAmountKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault()
        verifyRef.current?.focus()
      }
      if (e.key === "Escape") {
        setPayment(null)
        setAmountPaid("")
      }
    },
    []
  )

  return (
    <>
      <aside
        className="flex w-[316px] flex-shrink-0 flex-col border-l border-border"
        style={{ background: "var(--pos-panel)" }}
        aria-label="Carrito y panel de pago"
      >

        {/* ── Cart header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={14} strokeWidth={2} className="text-muted-foreground/60" />
            <h2 className="text-[13px] font-bold text-foreground tracking-tight">Carrito</h2>
          </div>
          {totalUnits > 0 && (
            <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground tabular-nums">
              {totalUnits}
            </span>
          )}
        </div>

        {/* ── Cart items (scrollable) ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2.5 py-12 text-center px-6 animate-fade-in">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/80">
                <ShoppingCart size={20} className="text-muted-foreground/25" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[12.5px] font-semibold text-muted-foreground">Carrito vacio</p>
                <p className="text-[11.5px] text-muted-foreground/50 mt-1 leading-relaxed">
                  Escaneá o seleccioná<br />un producto
                </p>
              </div>
            </div>
          ) : (
            <ul role="list" aria-label="Productos en el carrito">
              {items.map((item, idx) => (
                <CartRow
                  key={item.product.id}
                  item={item}
                  onUpdateQty={onUpdateQty}
                  onRemove={onRemove}
                  isLast={idx === items.length - 1}
                />
              ))}
            </ul>
          )}
        </div>

        {/* ── Payment section ── */}
        <div className="flex-shrink-0 border-t border-border flex flex-col">

          {/* Total strip */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ background: "var(--pos-total-bg)" }}
          >
            {/* Left: label + help button */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/40 leading-none">
                  Total
                </span>
                {/* Help button — discoverable but unobtrusive */}
                <button
                  ref={helpButtonRef}
                  type="button"
                  onClick={() => onHelpOpen?.()}
                  className="flex h-[18px] w-[18px] items-center justify-center rounded-md text-white/25 hover:text-white/60 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
                  aria-label="Atajos de teclado (?)"
                  title="Atajos de teclado — ?"
                >
                  <Keyboard size={10} strokeWidth={2} />
                </button>
              </div>
              {totalUnits > 0 && (
                <span className="text-[10.5px] text-white/35 tabular-nums">
                  {totalUnits} {totalUnits === 1 ? "unidad" : "unidades"}
                </span>
              )}
            </div>
            <span className="text-[28px] font-bold text-white tabular-nums leading-none tracking-tight">
              ${formatPrice(total)}
            </span>
          </div>

          <div className="px-4 pt-3 pb-3.5 flex flex-col gap-2.5">

            {/* Amount input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold text-muted-foreground/60 pointer-events-none select-none">
                $
              </span>
              <input
                ref={amountRef}
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                onKeyDown={handleAmountKeyDown}
                placeholder="Monto recibido"
                min={0}
                step={0.01}
                className={cn(
                  "h-10 w-full rounded-xl border bg-card",
                  "pl-8 pr-4 text-right text-[15px] font-bold text-foreground",
                  "placeholder:text-muted-foreground/35 placeholder:text-[13px] placeholder:font-normal",
                  "shadow-[0_1px_3px_0_rgba(0,0,0,0.05)]",
                  "transition-all duration-150 tabular-nums",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/60",
                  "border-border"
                )}
                aria-label="Monto recibido"
              />
            </div>

            {/* Change / deficit row */}
            {paid > 0 && total > 0 && (
              <div
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2 animate-fade-in",
                  change >= 0
                    ? "bg-[oklch(0.595_0.172_152_/_0.10)] text-[oklch(0.38_0.16_152)]"
                    : "bg-destructive/8 text-destructive"
                )}
              >
                <span className="text-[11.5px] font-semibold">
                  {change >= 0 ? "Vuelto" : "Falta"}
                </span>
                <span className="text-[14px] font-bold tabular-nums">
                  ${formatPrice(Math.abs(change))}
                </span>
              </div>
            )}

            {/* Payment methods */}
            <div
              className="grid grid-cols-5 gap-1.5"
              role="group"
              aria-label="Medio de pago"
            >
              {PAYMENT_METHODS.map((pm) => {
                const isActive = pm.id === payment
                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => selectPayment(pm.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-[5px]",
                      "rounded-xl border py-2.5 px-1 transition-all duration-150 select-none",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      isActive
                        ? [
                            "border-primary bg-primary text-primary-foreground",
                            "shadow-[0_2px_8px_-2px_oklch(0.52_0.255_278_/_0.40)]",
                          ].join(" ")
                        : [
                            "border-border bg-card text-muted-foreground",
                            "hover:border-primary/35 hover:bg-primary/5 hover:text-primary",
                          ].join(" ")
                    )}
                    aria-pressed={isActive}
                    aria-label={`${pm.label} (${pm.shortcut})`}
                    title={`${pm.label} — ${pm.shortcut}`}
                  >
                    {pm.icon}
                    <span className="text-[9px] font-bold uppercase tracking-wide leading-none">
                      {pm.shortLabel}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Debt hint */}
            {payment && (
              <p className="text-[10px] text-muted-foreground/50 text-center leading-relaxed animate-fade-in">
                Pagos inferiores al total generan deuda.{" "}
                <span className="font-medium text-muted-foreground/65">Revisala en Deudas.</span>
              </p>
            )}

            {/* Verify toggle */}
            <button
              ref={verifyRef}
              id={checkboxId}
              type="button"
              onClick={() => setVerified((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  const next = !verified
                  setVerified(next)
                  if (next) requestAnimationFrame(() => confirmRef.current?.focus())
                }
                if (e.key === "Escape") {
                  setVerified(false)
                  setPayment(null)
                  setAmountPaid("")
                  requestAnimationFrame(() => amountRef.current?.focus())
                }
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-[12px] font-medium transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                verified
                  ? "border-[oklch(0.595_0.172_152)] bg-[oklch(0.595_0.172_152_/_0.08)] text-[oklch(0.35_0.16_152)]"
                  : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
              )}
              role="checkbox"
              aria-checked={verified}
              aria-label="Verifique productos y medios de pago (F4)"
            >
              {verified ? (
                <CheckCircle2
                  size={15}
                  className="text-[oklch(0.595_0.172_152)] flex-shrink-0"
                  strokeWidth={2}
                />
              ) : (
                <Circle
                  size={15}
                  className="flex-shrink-0 text-muted-foreground/30"
                  strokeWidth={2}
                />
              )}
              <span className="flex-1">Verifique productos y medios de pago</span>
              <kbd className="text-[9px] font-bold text-muted-foreground/30 bg-muted rounded px-1 py-0.5 border border-border/60 font-mono select-none">
                F4
              </kbd>
            </button>

            {/* ── Confirm CTA ── */}
            <button
              ref={confirmRef}
              type="button"
              disabled={!canConfirm}
              onClick={handleConfirm}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleConfirm()
                }
                if (e.key === "Escape") {
                  setVerified(false)
                  verifyRef.current?.focus()
                }
              }}
              className={cn(
                "w-full rounded-xl py-3.5 text-[14px] font-bold tracking-wide transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                canConfirm
                  ? [
                      "bg-[oklch(0.595_0.172_152)] text-white",
                      "hover:bg-[oklch(0.52_0.182_152)]",
                      "active:scale-[0.985] active:brightness-95",
                      "shadow-[0_2px_14px_0_oklch(0.595_0.172_152_/_0.38)]",
                      "focus-visible:ring-[oklch(0.595_0.172_152)]",
                    ].join(" ")
                  : [
                      "bg-muted text-muted-foreground/50 cursor-not-allowed",
                      "focus-visible:ring-muted",
                    ].join(" ")
              )}
              title={
                !canConfirm && items.length > 0
                  ? "Marque la verificacion para continuar (F4)"
                  : !canConfirm
                  ? "Agregue productos para confirmar"
                  : "Confirmar venta (Ctrl+Enter)"
              }
              aria-disabled={!canConfirm}
            >
              <span>
                {canConfirm
                  ? "Confirmar venta"
                  : items.length === 0
                  ? "Sin productos"
                  : "Verifique para confirmar"}
              </span>
              {canConfirm && (
                <kbd className="ml-2 text-[9px] font-bold text-white/50 bg-white/10 rounded px-1.5 py-0.5 border border-white/15 font-mono select-none align-middle">
                  Ctrl+Enter
                </kbd>
              )}
            </button>

          </div>
        </div>
      </aside>

      {/* Help modal — rendered outside the aside so it can cover the whole screen */}
      <KeyboardHelpModal
        open={helpOpen}
        onClose={() => {
          onHelpClose?.()
          // Return focus to the help button after closing
          requestAnimationFrame(() => helpButtonRef.current?.focus())
        }}
      />
    </>
  )
}
