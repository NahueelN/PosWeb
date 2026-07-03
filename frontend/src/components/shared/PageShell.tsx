import { type ReactNode } from 'react'
import { AlertTriangle, CircleAlert } from 'lucide-react'

interface CajaStatus {
  /** True while checking if caja is open */
  loading: boolean
  /** null = still checking, true = open, false = closed */
  activa: boolean | null
  /** Custom message when caja is closed */
  closedMessage?: string
  /** Message while checking caja status */
  checkingMessage?: string
}

interface PageShellProps {
  /** Page title — required, always same position and style */
  title: string
  /** Optional subtitle below the title */
  subtitle?: string
  /** Optional actions on the right side of the header (e.g., "+ Nuevo" button) */
  actions?: ReactNode
  /**
   * Optional tabs rendered between header and content.
   * Always in the same position, same spacing.
   * Pass your own buttons/links — the shell just positions them.
   */
  tabs?: ReactNode
  /**
   * Optional caja status. When provided:
   * - loading → blue "Verificando caja..." banner
   * - activa === false → amber "No hay caja abierta" banner
   * Omit the prop entirely if the page doesn't require caja.
   */
  caja?: CajaStatus
  /** Show a centered loading spinner instead of children */
  loading?: boolean
  /** Custom loading message */
  loadingMessage?: string
  /** Show an error banner at the top */
  error?: string | null
  /** Main page content */
  children: ReactNode
}

/**
 * Mandatory page shell for all PosWeb pages.
 *
 * Rules enforced:
 * - Title always at the same position, same typography
 * - Subtitle always same style
 * - Actions always top-right
 * - Tabs always between header and content
 * - Loading state always centered spinner
 * - Error state always red banner
 *
 * Usage:
 * ```tsx
 * <PageShell title="Clientes" subtitle="42 clientes" actions={<Button>+ Nuevo</Button>}>
 *   <Table ... />
 * </PageShell>
 * ```
 */
export default function PageShell({
  title,
  subtitle,
  actions,
  tabs,
  caja,
  loading = false,
  loadingMessage = 'Cargando...',
  error,
  children,
}: PageShellProps) {
  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-[20px] font-bold text-gray-900 tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-[12.5px] text-gray-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {/* ── Caja status ── */}
      {caja && caja.loading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0" />
          <span>{caja.checkingMessage || 'Verificando caja...'}</span>
        </div>
      )}
      {caja && !caja.loading && caja.activa === false && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-sm mb-4 flex items-center gap-2">
          <AlertTriangle size={20} strokeWidth={2} className="shrink-0" />
          <div className="flex-1">
            <span className="font-medium">No hay caja abierta</span>
            <p className="text-xs mt-0.5">{caja.closedMessage || 'Andá a la sección Caja para abrir una.'}</p>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      {tabs && (
        <div className="mb-6">{tabs}</div>
      )}

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6 flex items-center gap-2">
          <CircleAlert size={20} strokeWidth={2} className="shrink-0" />
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-500 text-sm">{loadingMessage}</span>
        </div>
      ) : (
        children
      )}
    </div>
  )
}
