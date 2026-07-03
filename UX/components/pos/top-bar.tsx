import { MapPin, ChevronDown, LogOut } from "lucide-react"

export function TopBar() {
  return (
    <header
      className="flex h-[48px] flex-shrink-0 items-center justify-between border-b border-border bg-card px-5 gap-4"
      style={{ boxShadow: "0 1px 0 0 var(--border)" }}
    >
      {/* ── Left: page title + branch ── */}
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-[14.5px] font-bold text-foreground tracking-tight whitespace-nowrap">
          Punto de Venta
        </h1>
        <span className="h-3.5 w-px bg-border flex-shrink-0" aria-hidden="true" />
        {/* Branch selector */}
        <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-semibold text-primary hover:bg-primary/8 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
          <MapPin size={11} strokeWidth={2.5} className="flex-shrink-0" />
          Sucursal Central
          <ChevronDown size={10} strokeWidth={2.5} className="opacity-50 ml-0.5" />
        </button>
      </div>

      {/* ── Right: user info + logout ── */}
      <div className="flex items-center gap-2 text-[12px] flex-shrink-0">
        {/* User avatar + name */}
        <div className="flex items-center gap-2">
          <div
            className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-[10px] select-none flex-shrink-0"
            style={{ boxShadow: "0 1px 4px oklch(0.52 0.255 278 / 0.30)" }}
            aria-hidden="true"
          >
            A
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="font-bold text-[12.5px] text-foreground">admin</span>
            <span className="text-[9.5px] font-semibold text-primary/80 mt-[2px] uppercase tracking-wide">
              SuperAdmin
            </span>
          </div>
        </div>

        <span className="h-3.5 w-px bg-border" aria-hidden="true" />

        {/* Logout */}
        <button
          className="flex items-center gap-1.5 text-muted-foreground/60 hover:text-destructive transition-colors font-medium px-1.5 py-1 rounded-md hover:bg-destructive/8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Salir de la sesión"
        >
          <LogOut size={12} strokeWidth={2} />
          <span className="hidden sm:inline text-[12px]">Salir</span>
        </button>
      </div>
    </header>
  )
}
