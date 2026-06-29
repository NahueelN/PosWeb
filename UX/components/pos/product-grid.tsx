"use client"

import { useState, useMemo, useRef, useCallback, useEffect } from "react"
import { Search, PackageSearch, X } from "lucide-react"
import { PRODUCTS, type Product } from "./product-data"
import { ProductCard } from "./product-card"
import type { CartItem } from "./cart-panel"
import { cn } from "@/lib/utils"

type Props = {
  onAddProduct: (product: Product) => void
  cartItems: CartItem[]
  /** Ref forwarded from parent so the page can focus the search on mount */
  searchRef?: React.RefObject<HTMLInputElement>
  /** Called when the user presses ? to open the help modal */
  onHelpOpen?: () => void
}

export function ProductGrid({ onAddProduct, cartItems, searchRef: externalRef, onHelpOpen }: Props) {
  const [query, setQuery] = useState("")
  const internalRef = useRef<HTMLInputElement>(null)
  const searchRef = externalRef ?? internalRef
  const gridRef = useRef<HTMLDivElement>(null)

  // Build qty map for badge rendering
  const cartQtyMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const item of cartItems) map[item.product.id] = item.qty
    return map
  }, [cartItems])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return PRODUCTS
    return PRODUCTS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q)
    )
  }, [query])

  const clearQuery = useCallback(() => {
    setQuery("")
    searchRef.current?.focus()
  }, [searchRef])

  // Global keyboard shortcuts: "/" focuses search; "?" opens help modal
  // F3 was removed — it conflicts with browser Find (Ctrl+F alias in Chrome/Edge/Firefox)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      const isInput = tag === "INPUT" || tag === "TEXTAREA"

      // "/" — focus search (only when not already in an input)
      if (e.key === "/" && !isInput) {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
        return
      }

      // "?" (Shift+/) — open keyboard help modal
      // Safe in all browsers: no documented conflict with Chrome, Edge, or Firefox
      if (e.key === "?" && !isInput && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault()
        onHelpOpen?.()
        return
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [searchRef, onHelpOpen])

  // Arrow Down on search moves focus to first card
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        const firstCard = gridRef.current?.querySelector<HTMLButtonElement>("button[aria-label]")
        firstCard?.focus()
      }
      if (e.key === "Escape") {
        if (query) {
          clearQuery()
        } else {
          searchRef.current?.blur()
        }
      }
    },
    [query, clearQuery, searchRef]
  )

  // Arrow key navigation inside the grid
  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const cards = Array.from(
        gridRef.current?.querySelectorAll<HTMLButtonElement>("button[aria-label]") ?? []
      )
      const idx = cards.indexOf(document.activeElement as HTMLButtonElement)
      if (idx === -1) return

      if (e.key === "ArrowUp") {
        e.preventDefault()
        if (idx === 0) {
          searchRef.current?.focus()
        } else {
          // Estimate columns from computed grid
          const columns = Math.round(gridRef.current!.offsetWidth / (cards[0]?.offsetWidth + 12))
          cards[Math.max(0, idx - columns)]?.focus()
        }
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        const columns = Math.round(gridRef.current!.offsetWidth / (cards[0]?.offsetWidth + 12))
        cards[Math.min(cards.length - 1, idx + columns)]?.focus()
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        cards[Math.max(0, idx - 1)]?.focus()
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        cards[Math.min(cards.length - 1, idx + 1)]?.focus()
      }
      if (e.key === "Home") {
        e.preventDefault()
        cards[0]?.focus()
      }
      if (e.key === "End") {
        e.preventDefault()
        cards[cards.length - 1]?.focus()
      }
      if (e.key === "Escape") {
        searchRef.current?.focus()
      }
    },
    [searchRef]
  )

  return (
    <section className="flex flex-col flex-1 min-h-0" aria-label="Catálogo de productos">

      {/* ── Header ── */}
      <div className="flex items-baseline justify-between px-5 pt-[18px] pb-[14px]">
        <div className="flex items-baseline gap-2.5">
          <h2 className="text-[20px] font-bold text-foreground tracking-tight leading-none">
            Ventas
          </h2>
          <span className="text-[12.5px] text-muted-foreground/70 font-normal">
            Seleccioná productos para confirmar la operación
          </span>
        </div>
        {/* Item count — right-aligned */}
        <span className="text-[11.5px] font-medium text-muted-foreground/50 tabular-nums flex-shrink-0 ml-4">
          {filtered.length}{filtered.length !== PRODUCTS.length ? ` / ${PRODUCTS.length}` : ""} productos
        </span>
      </div>

      {/* ── Search ── */}
      <div className="px-5 pb-3.5">
        <div className="relative">
          <Search
            size={15}
            strokeWidth={2}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/45 pointer-events-none"
          />
          <input
            ref={searchRef as React.RefObject<HTMLInputElement>}
            type="search"
            inputMode="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Buscá por nombre o código de barras…"
            aria-label="Buscar producto (/)"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className={cn(
              "h-10 w-full rounded-xl border bg-card",
              "pl-10 pr-9 text-[13.5px] text-foreground",
              "placeholder:text-muted-foreground/45",
              "shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]",
              "transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/60",
              "border-border"
            )}
          />
          {/* Clear button */}
          {query ? (
            <button
              onClick={clearQuery}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              tabIndex={-1}
              aria-label="Limpiar búsqueda"
            >
              <X size={11} strokeWidth={2.5} />
            </button>
          ) : (
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground/40 bg-muted/60 border border-border/60 select-none pointer-events-none">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* ── Product grid ── */}
      <div
        ref={gridRef}
        className="flex-1 overflow-y-auto px-5 pb-5"
        onKeyDown={handleGridKeyDown}
      >
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3 animate-fade-in">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/80">
              <PackageSearch size={22} className="text-muted-foreground/30" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-[13.5px] font-semibold text-foreground">Sin resultados</p>
              <p className="text-[12px] text-muted-foreground/70 mt-1 leading-relaxed">
                Ningún producto coincide con{" "}
                <span className="font-semibold text-foreground/70">&ldquo;{query}&rdquo;</span>
              </p>
            </div>
            <button
              onClick={clearQuery}
              className="mt-1 text-[12px] font-semibold text-primary hover:underline underline-offset-2 transition-colors"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          <div
            className="grid gap-2.5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(172px, 1fr))" }}
            role="list"
            aria-label="Productos disponibles"
          >
            {filtered.map((product) => (
              <div key={product.id} role="listitem" className="animate-fade-in">
                <ProductCard
                  product={product}
                  onAdd={onAddProduct}
                  cartQty={cartQtyMap[product.id] ?? 0}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
