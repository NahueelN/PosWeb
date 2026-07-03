"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Sidebar } from "@/components/pos/sidebar"
import { TopBar } from "@/components/pos/top-bar"
import { ProductGrid } from "@/components/pos/product-grid"
import { CartPanel, type CartItem } from "@/components/pos/cart-panel"
import type { Product } from "@/components/pos/product-data"

export default function VentasPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [helpOpen, setHelpOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  /* Focus the search bar on mount — foco inicial al iniciar una venta */
  useEffect(() => {
    requestAnimationFrame(() => searchRef.current?.focus())
  }, [])

  const handleAddProduct = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...prev, { product, qty: 1 }]
    })
  }, [])

  const handleUpdateQty = useCallback((productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, qty: i.qty + delta } : i
        )
        .filter((i) => i.qty > 0)
    )
  }, [])

  const handleRemove = useCallback((productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product.id !== productId))
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <TopBar />

        {/* Content body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Product browser */}
          <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
            <ProductGrid
                onAddProduct={handleAddProduct}
                cartItems={cartItems}
                searchRef={searchRef}
                onHelpOpen={() => setHelpOpen(true)}
              />
          </main>

          {/* Cart + payment panel */}
          <CartPanel
            items={cartItems}
            onUpdateQty={handleUpdateQty}
            onRemove={handleRemove}
            searchRef={searchRef}
            helpOpen={helpOpen}
            onHelpOpen={() => setHelpOpen(true)}
            onHelpClose={() => setHelpOpen(false)}
          />
        </div>
      </div>
    </div>
  )
}
