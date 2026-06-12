import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { SucursalDto } from '../types'
import { useAuth } from '../context/AuthContext'

const menuGroups = [
  {
    label: 'Operaciones',
    links: [
      { to: '/ventas', label: 'Ventas', icon: '🛒' },
      { to: '/historial', label: 'Historial', icon: '📋' },
      { to: '/compras', label: 'Compras', icon: '📥' },
      { to: '/gastos', label: 'Gastos', icon: '💸' },
      { to: '/deudas', label: 'Deudas', icon: '📝' },
      { to: '/caja', label: 'Caja', icon: '💰' },
    ],
  },
  {
    label: 'Gestión',
    links: [
      { to: '/stock', label: 'Stock', icon: '📊' },
      { to: '/productos', label: 'Productos', icon: '📦' },
      { to: '/sucursales', label: 'Sucursales', icon: '🏪' },
    ],
  },
  {
    label: 'Personas',
    links: [
      { to: '/clientes', label: 'Clientes', icon: '👤' },
      { to: '/proveedores', label: 'Proveedores', icon: '🏭' },
    ],
  },
]

const hiddenForUsuarioComun = new Set(['/stock', '/clientes', '/sucursales'])

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
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors ${
          hasActive ? 'text-indigo-300' : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        <span>{label}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
      </button>
      {open && (
        <div className="ml-2 mt-0.5 space-y-0.5">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={onLinkClick}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-500/15 text-indigo-300 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              <span className="text-sm w-5 text-center">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </div>
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
      <div className="h-16 flex items-center gap-3 px-5 border-b border-slate-700">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-sm font-bold">
          PW
        </div>
        <span className="text-white font-semibold text-sm tracking-wide">
          PosWeb
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-3 overflow-y-auto">
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

      <div className="p-3 border-t border-slate-700 space-y-2">
        {canCreateUsers && (
          <NavLink
            to="/usuarios/alta"
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            <span className="text-base">👥+</span>
            Alta usuario
          </NavLink>
        )}
        <p className="px-3 text-xs text-slate-500">PosWeb v0.1</p>
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
          fixed inset-y-0 left-0 z-40 w-56 bg-slate-900 flex flex-col
          transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:z-auto lg:shrink-0
        `}
      >
        {sidebarContent}
      </aside>

      <main className="flex-1 flex flex-col overflow-auto min-w-0 min-h-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
              aria-label="Abrir menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <h2 className="text-lg font-semibold text-gray-900 truncate">Punto de Venta</h2>
            {sucursal && (
              <span className="hidden sm:flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-medium shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                {sucursal.nombre}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {sucursal && location.pathname !== '/sucursales' && (
              <button
                onClick={() => { limpiar(); window.location.reload() }}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Cambiar sucursal
              </button>
            )}

            {user && (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-xs text-gray-500">
                  <span className="font-medium text-gray-700">{user.nombre}</span>
                  <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 rounded text-xs">{user.rol}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  Salir
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 overflow-auto min-h-0 flex flex-col">
          <Outlet context={{ sucursal }} />
        </div>
      </main>
    </div>
  )
}
