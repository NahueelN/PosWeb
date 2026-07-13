import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { SucursalDto } from '../types'
import { useAuth } from '../context/AuthContext'
import ProductLookupModal from './ProductLookupModal'
import { Menu, MapPin, ChevronDown, LogOut, UserPlus } from 'lucide-react'
import { getCurrentVersion } from '../versionCheck'

const menuGroups = [
  {
    label: 'Operaciones',
    links: [
      { to: '/ventas', label: 'Ventas', icon: '🛒' },
      { to: '/compras', label: 'Compras', icon: '📥' },
      { to: '/gastos', label: 'Gastos', icon: '💸' },
      { to: '/deudas', label: 'Deudas', icon: '📝' },
      { to: '/pedidos', label: 'Pedidos', icon: '📋' },
      { to: '/caja', label: 'Caja', icon: '💰' },
    ],
  },
  {
    label: 'Gestión',
    links: [
      { to: '/productos', label: 'Productos', icon: '📦' },
      { to: '/combos', label: 'Ofertas', icon: '🎁' },
      { to: '/historial', label: 'Historial', icon: '📋' },
      { to: '/estadisticas', label: 'Estadísticas', icon: '📈' },
    ],
  },
  {
    label: 'Contactos',
    links: [
      { to: '/clientes', label: 'Clientes', icon: '👤' },
      { to: '/proveedores', label: 'Proveedores', icon: '🏭' },
    ],
  },
]

const hiddenForUsuarioComun = new Set(['/stock', '/sucursales', '/estadisticas'])

function useSucursalActiva() {
  const [sucursal, setSucursal] = useState<SucursalDto | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('sucursalActiva')
    if (saved) {
      try {
        setSucursal(JSON.parse(saved))
      } catch {
        /* ignore */
      }
    }
  }, [])

  function cambiar(s: SucursalDto) {
    localStorage.setItem('sucursalActiva', JSON.stringify(s))
    setSucursal(s)
  }

  function limpiar() {
    localStorage.removeItem('sucursalActiva')
    setSucursal(null)
  }

  return { sucursal, cambiar, limpiar }
}

export { useSucursalActiva }

function MenuGroup({ label, links, defaultOpen, onLinkClick }: { label: string; links: { to: string; label: string; icon: string }[]; defaultOpen: boolean; onLinkClick: () => void }) {
  const [open, setOpen] = useState(defaultOpen)
  const location = useLocation()

  const hasActive = links.some(l => location.pathname === l.to || location.pathname.startsWith(l.to + '/'))

  if (links.length === 0) return null

  return (
    <div className="mb-0.5">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md transition-colors group ${
          hasActive ? 'text-white/50' : 'text-white/25 hover:text-white/45'
        }`}
      >
        <span className="text-[9.5px] font-bold tracking-[0.11em] uppercase">{label}</span>
        <ChevronDown
          size={10}
          strokeWidth={2.5}
          className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
      </button>
      {open && (
        <ul className="mt-px space-y-px">
          {links.map(l => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                onClick={onLinkClick}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[12.5px] font-medium transition-all duration-100 ${
                    isActive
                      ? 'bg-[oklch(0.52_0.255_278)] text-white shadow-[0_1px_4px_oklch(0.52_0.255_278_/_0.30)]'
                      : 'text-white/50 hover:bg-white/[0.06] hover:text-white/85'
                  }`
                }
              >
                <span className={`text-sm w-5 text-center shrink-0 ${location.pathname === l.to || location.pathname.startsWith(l.to + '/') ? '' : 'opacity-45'}`}>{l.icon}</span>
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sucursal, limpiar } = useSucursalActiva()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lookupOpen, setLookupOpen] = useState(false)
  const [appVersion, setAppVersion] = useState('')

  useEffect(() => {
    const v = getCurrentVersion()
    if (v) setAppVersion(`v${v}`)
  }, [])

  // F2 global: quick product lookup
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        setLookupOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const canCreateUsers = user?.rol === 'SuperAdmin' || user?.rol === 'Admin'

  function handleLogout() {
    logout()
    limpiar()
    navigate('/login', { replace: true })
  }

  function closeSidebar() {
    setSidebarOpen(false)
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/[0.08] shrink-0">
        <div
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[oklch(0.52_0.255_278)] text-white font-bold text-[12px] tracking-tight select-none"
          style={{ boxShadow: '0 1px 4px oklch(0.52 0.255 278 / 0.35)' }}
        >
          PW
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[13.5px] font-bold text-white tracking-tight">PosWeb</span>
          <span className="text-[9.5px] text-white/25 font-medium mt-[3px] tracking-wide uppercase">v0.1</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-px">
        {menuGroups.map(group => {
          const visibleLinks = user?.rol === 'UsuarioComun'
            ? group.links.filter(l => !hiddenForUsuarioComun.has(l.to))
            : group.links

          return (
            <MenuGroup
              key={group.label}
              label={group.label}
              links={visibleLinks}
              defaultOpen={false}
              onLinkClick={closeSidebar}
            />
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-white/[0.08] px-2 py-2.5 space-y-px shrink-0">
        {canCreateUsers && (
          <NavLink
            to="/usuarios/alta"
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[12px] font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-white/40 hover:bg-white/[0.06] hover:text-white/70'
              }`
            }
          >
            <UserPlus size={14} className="shrink-0" />
            Alta usuario
          </NavLink>
        )}
        {/* Configuración — oculto por ahora */}
        {false && (
        <NavLink
          to="/configuracion"
          onClick={closeSidebar}
          className={({ isActive }) =>
            `flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[12px] font-medium transition-colors ${
              isActive
                ? 'bg-[oklch(0.52_0.255_278_/_0.15)] text-white'
                : 'text-white/40 hover:bg-white/[0.06] hover:text-white/70'
            }`
          }
        >
          <span className="text-sm w-5 text-center shrink-0">⚙️</span>
          Configuración
        </NavLink>
        )}
      </div>
    </>
  )

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-[196px] bg-[oklch(0.15_0.016_262)] flex flex-col
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:z-auto lg:shrink-0
        `}
        style={{ borderRight: '1px solid oklch(0.255 0.016 262)' }}
      >
        {sidebarContent}
      </aside>

      <main className="flex-1 flex flex-col overflow-auto min-w-0 min-h-0">
        <header className="h-[48px] bg-white border-b border-gray-200 flex items-center justify-between px-5 gap-4 shrink-0"
          style={{ boxShadow: '0 1px 0 0 oklch(0.91 0.008 265)' }}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
              aria-label="Abrir menu"
            >
              <Menu size={16} />
            </button>

            <h1 className="text-[14.5px] font-bold text-gray-900 tracking-tight truncate">Punto de Venta</h1>
            {sucursal && (
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-[oklch(0.52_0.255_278)] bg-[oklch(0.52_0.255_278_/_0.06)] px-2.5 py-1 rounded-lg shrink-0">
                <MapPin size={12} strokeWidth={2.5} />
                {sucursal.nombre}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {sucursal && location.pathname !== '/sucursales' && (
              <button
                onClick={() => { limpiar(); window.location.reload() }}
                className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors font-medium"
              >
                Cambiar sucursal
              </button>
            )}

            {user && (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full bg-[oklch(0.52_0.255_278)] flex items-center justify-center text-white font-bold text-[10px] select-none shrink-0"
                    style={{ boxShadow: '0 1px 4px oklch(0.52 0.255 278 / 0.30)' }}
                  >
                    {user.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col leading-none">
                    <span className="font-bold text-[12px] text-gray-900">{user.nombre}</span>
                    <span className="text-[9.5px] font-semibold text-[oklch(0.52_0.255_278_/_0.75)] mt-[2px] uppercase tracking-wide">{user.rol}</span>
                  </div>
                </div>
                <span className="hidden sm:block h-3.5 w-px bg-gray-200" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 hover:text-red-500 transition-colors px-1.5 py-1 rounded-md hover:bg-red-50"
                >
                  <LogOut size={12} strokeWidth={2} />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto min-h-0 flex flex-col p-4 sm:p-5">
          <Outlet context={{ sucursal }} />
        </div>
      </main>

      <ProductLookupModal open={lookupOpen} onClose={() => setLookupOpen(false)} />

      {appVersion && (
        <span className="fixed bottom-2 right-3 text-[10px] text-gray-400/60 select-none pointer-events-none z-50">
          {appVersion}
        </span>
      )}
    </div>
  )
}
