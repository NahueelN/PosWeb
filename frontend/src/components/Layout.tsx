import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { SucursalDto } from '../types'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/ventas', label: 'Ventas', icon: '🛒' },
  { to: '/historial', label: 'Historial', icon: '📋' },
  { to: '/productos', label: 'Productos', icon: '📦' },
  { to: '/stock', label: 'Stock', icon: '📊' },
  { to: '/clientes', label: 'Clientes', icon: '👤' },
  { to: '/caja', label: 'Caja', icon: '💰' },
  { to: '/sucursales', label: 'Sucursales', icon: '🏪' },
]

function useSucursalActiva() {
  const [sucursal, setSucursal] = useState<SucursalDto | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('sucursalActiva')
    if (saved) {
      try { setSucursal(JSON.parse(saved)) } catch { /* ignore */ }
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

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sucursal, limpiar } = useSucursalActiva()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

      <nav className="flex-1 p-3 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-indigo-500/15 text-indigo-300 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`
            }
          >
            <span className="text-base">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">PosWeb v0.1</p>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Mobile sidebar (fixed, slides in) */}
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

      {/* Content */}
      <main className="flex-1 flex flex-col overflow-auto min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
              aria-label="Abrir menú"
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

        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          <Outlet context={{ sucursal }} />
        </div>
      </main>
    </div>
  )
}
