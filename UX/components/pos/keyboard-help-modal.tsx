"use client"

import { useEffect, useRef } from "react"
import { X, Keyboard } from "lucide-react"
import { cn } from "@/lib/utils"

/* ─────────────────────────────────────────────────────────
   Keycap — visual key representation
   ───────────────────────────────────────────────────────── */
function Key({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center justify-center",
        "rounded-md border border-border bg-muted",
        "text-[10.5px] font-bold text-foreground/80 font-mono",
        "shadow-[0_2px_0_0_var(--border)]",
        "select-none leading-none",
        "h-[22px] px-2",
        wide && "min-w-[52px]"
      )}
    >
      {children}
    </kbd>
  )
}

function Plus() {
  return (
    <span className="text-[10px] font-bold text-muted-foreground/50 mx-0.5">+</span>
  )
}

/* ─────────────────────────────────────────────────────────
   ShortcutRow
   ───────────────────────────────────────────────────────── */
function ShortcutRow({
  keys,
  description,
}: {
  keys: React.ReactNode
  description: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-[7px] border-b border-border/50 last:border-0">
      <span className="text-[12.5px] text-muted-foreground leading-snug">{description}</span>
      <div className="flex items-center gap-0.5 flex-shrink-0">{keys}</div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   Section heading
   ───────────────────────────────────────────────────────── */
function Section({ title }: { title: string }) {
  return (
    <h3 className="mt-5 mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/55 first:mt-0">
      {title}
    </h3>
  )
}

/* ─────────────────────────────────────────────────────────
   KeyboardHelpModal
   ───────────────────────────────────────────────────────── */
type Props = {
  open: boolean
  onClose: () => void
}

export function KeyboardHelpModal({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  /* Trap focus and handle Escape */
  useEffect(() => {
    if (!open) return

    const dialog = dialogRef.current
    if (!dialog) return

    // Focus the close button when the modal opens
    requestAnimationFrame(() => closeButtonRef.current?.focus())

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      }

      // Basic focus trap
      if (e.key === "Tab") {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    // Prevent the global "?" handler from re-opening while modal is open
    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [open, onClose])

  if (!open) return null

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-[2px] animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      role="presentation"
    >
      {/* Dialog */}
      <dialog
        ref={dialogRef}
        open
        className={cn(
          "relative w-full max-w-[640px] max-h-[88vh]",
          "bg-card rounded-2xl border border-border",
          "shadow-[0_24px_48px_-8px_rgba(0,0,0,0.22),0_8px_16px_-4px_rgba(0,0,0,0.10)]",
          "flex flex-col",
          "animate-modal-in",
          "overflow-hidden m-0 p-0"
        )}
        aria-modal="true"
        aria-label="Atajos de teclado"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Keyboard size={15} className="text-primary" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-[14.5px] font-bold text-foreground tracking-tight leading-none">
                Atajos de teclado
              </h2>
              <p className="text-[11.5px] text-muted-foreground mt-0.5">
                Acelerá las ventas sin tocar el mouse
              </p>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Cerrar ayuda"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Two-column layout */}
          <div className="grid grid-cols-2 gap-x-8">

            {/* Left column */}
            <div>
              <Section title="Busqueda" />
              <ShortcutRow
                keys={<Key>/</Key>}
                description="Foco en el buscador"
              />
              <ShortcutRow
                keys={<Key>Esc</Key>}
                description="Limpiar busqueda / quitar foco"
              />
              <ShortcutRow
                keys={<><Key>↓</Key></>}
                description="Ir a la grilla de productos"
              />

              <Section title="Catalogo de productos" />
              <ShortcutRow
                keys={<><Key>←</Key><Key>→</Key><Key>↑</Key><Key>↓</Key></>}
                description="Navegar entre tarjetas"
              />
              <ShortcutRow
                keys={<Key wide>Enter</Key>}
                description="Agregar producto al carrito"
              />
              <ShortcutRow
                keys={<Key wide>Home</Key>}
                description="Ir al primer producto"
              />
              <ShortcutRow
                keys={<Key wide>End</Key>}
                description="Ir al ultimo producto"
              />
              <ShortcutRow
                keys={<Key>Esc</Key>}
                description="Volver al buscador"
              />

              <Section title="Generales" />
              <ShortcutRow
                keys={<Key>?</Key>}
                description="Abrir esta ayuda"
              />
              <ShortcutRow
                keys={<><Key>Tab</Key></>}
                description="Siguiente control"
              />
              <ShortcutRow
                keys={<><Key wide>Shift</Key><Plus /><Key>Tab</Key></>}
                description="Control anterior"
              />
            </div>

            {/* Right column */}
            <div>
              <Section title="Medios de pago" />
              <ShortcutRow
                keys={<><Key wide>Alt</Key><Plus /><Key>1</Key></>}
                description="Efectivo"
              />
              <ShortcutRow
                keys={<><Key wide>Alt</Key><Plus /><Key>2</Key></>}
                description="Transferencia"
              />
              <ShortcutRow
                keys={<><Key wide>Alt</Key><Plus /><Key>3</Key></>}
                description="Debito"
              />
              <ShortcutRow
                keys={<><Key wide>Alt</Key><Plus /><Key>4</Key></>}
                description="Credito"
              />
              <ShortcutRow
                keys={<><Key wide>Alt</Key><Plus /><Key>5</Key></>}
                description="QR"
              />
              <ShortcutRow
                keys={<><Key wide>Alt</Key><Plus /><Key>0</Key></>}
                description="Limpiar pago y monto"
              />

              <Section title="Carrito" />
              <ShortcutRow
                keys={<Key wide>Enter</Key>}
                description="Confirmar cantidad / avanzar"
              />
              <ShortcutRow
                keys={<Key>Esc</Key>}
                description="Limpiar monto / deshacer"
              />

              <Section title="Cobro" />
              <ShortcutRow
                keys={<Key>F4</Key>}
                description="Foco en verificacion"
              />
              <ShortcutRow
                keys={<><Key wide>Enter</Key></>}
                description="Marcar verificado + ir a confirmar"
              />
              <ShortcutRow
                keys={<><Key wide>Ctrl</Key><Plus /><Key wide>Enter</Key></>}
                description="Confirmar venta (desde cualquier lugar)"
              />
              <ShortcutRow
                keys={<Key>Esc</Key>}
                description="Desmarcar verificacion"
              />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border flex-shrink-0 bg-muted/40">
          <p className="text-[11px] text-muted-foreground/60">
            Los atajos <Key>Alt+1..5</Key> no interfieren con Chrome, Edge ni Firefox.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-[13px] font-semibold hover:opacity-90 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Entendido
          </button>
        </div>
      </dialog>
    </div>
  )
}
