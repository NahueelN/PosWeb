"use client"

import { useCallback, useRef } from "react"
import { type Product, formatPrice } from "./product-data"
import { cn } from "@/lib/utils"
import { Sparkles, Plus } from "lucide-react"

type Props = {
  product: Product
  onAdd: (product: Product) => void
  cartQty?: number
}

export function ProductCard({ product, onAdd, cartQty = 0 }: Props) {
  const inCart = cartQty > 0
  const badgeRef = useRef<HTMLSpanElement>(null)

  const handleAdd = useCallback(() => {
    onAdd(product)
    // Trigger bump animation on badge
    if (badgeRef.current) {
      badgeRef.current.classList.remove("animate-bump")
      // Force reflow so the animation retriggers on rapid clicks
      void badgeRef.current.offsetWidth
      badgeRef.current.classList.add("animate-bump")
    }
  }, [onAdd, product])

  return (
    <button
      type="button"
      onClick={handleAdd}
      className={cn(
        // Base
        "group relative flex flex-col text-left w-full",
        "bg-card rounded-xl border",
        // Transitions — fast, subtle
        "transition-all duration-150",
        // Hover lift
        "hover:-translate-y-0.5",
        "hover:shadow-[0_6px_20px_-4px_rgba(0,0,0,0.11),0_2px_6px_-2px_rgba(0,0,0,0.06)]",
        // Focus ring
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Active press
        "active:scale-[0.972] active:shadow-[0_1px_3px_0_rgba(0,0,0,0.07)] active:translate-y-0 active:duration-75",
        // Cart state — coloured border + ambient glow
        inCart
          ? "border-primary/60 shadow-[0_0_0_1px_oklch(0.52_0.255_278_/_0.15),0_1px_3px_0_rgba(0,0,0,0.07)]"
          : "border-border shadow-[var(--shadow-card)] hover:border-primary/30"
      )}
      aria-label={`Agregar ${product.name} — $${formatPrice(product.price)}`}
    >
      {/* ── Cart qty badge ── */}
      {inCart && (
        <span
          ref={badgeRef}
          className="animate-bump absolute -top-2 -right-2 z-10 flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5 tabular-nums shadow-md shadow-primary/30 ring-2 ring-card"
        >
          {cartQty}
        </span>
      )}

      {/* ── COMBO badge ── */}
      {product.isCombo && (
        <span className="absolute top-2.5 right-2.5 z-10 flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-[3px] text-[9px] font-bold uppercase tracking-widest text-primary leading-none border border-primary/15">
          <Sparkles size={7} strokeWidth={3} />
          Combo
        </span>
      )}

      {/* ── Content ── */}
      <div className="flex flex-1 flex-col gap-0 p-3.5 pb-3">
        {/* Name — dominant, readable in <1 sec */}
        <p className={cn(
          "text-[13px] font-semibold text-foreground leading-snug line-clamp-2",
          "min-h-[2.6em]",
          product.isCombo && "pr-12"
        )}>
          {product.name}
        </p>

        {/* Barcode — tertiary, unobtrusive */}
        <p className="mt-1.5 font-mono text-[9.5px] text-muted-foreground/50 tracking-[0.08em] truncate">
          {product.barcode}
        </p>
      </div>

      {/* ── Footer: price + add indicator ── */}
      <div className={cn(
        "flex items-center justify-between px-3.5 py-2.5 mt-auto rounded-b-xl border-t transition-colors duration-150",
        inCart
          ? "border-primary/15 bg-primary/[0.04]"
          : "border-border/60 bg-muted/30 group-hover:bg-muted/60"
      )}>
        {/* Price — largest, highest contrast, primary color */}
        <p className="text-[15px] font-bold text-primary leading-none tabular-nums">
          ${formatPrice(product.price)}
        </p>

        {/* Add button */}
        <span
          className={cn(
            "flex h-[26px] w-[26px] items-center justify-center rounded-lg transition-all duration-150",
            inCart
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
              : "bg-border text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-sm group-hover:shadow-primary/25"
          )}
          aria-hidden="true"
        >
          <Plus size={12} strokeWidth={2.75} />
        </span>
      </div>
    </button>
  )
}
