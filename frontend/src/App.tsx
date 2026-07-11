import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import DialogContainer from './components/ui/DialogContainer'
import AuthGuard from './components/AuthGuard'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import ProductosPage from './pages/ProductosPage'
import VentasPage from './pages/VentasPage'
import HistorialVentasPage from './pages/HistorialVentasPage'
import ClientesPage from './pages/ClientesPage'
import CajaPage from './pages/CajaPage'
import AltaUsuarioPage from './pages/AltaUsuarioPage'
import CompraPage from './pages/CompraPage'
import GastosPage from './pages/GastosPage'
import ProveedoresPage from './pages/ProveedoresPage'
import DeudaPage from './pages/DeudaPage'
import PedidosPage from './pages/PedidosPage'
import EstadisticasPage from './pages/EstadisticasPage'
import CombosPage from './pages/CombosPage'
import ConfiguracionPage from './pages/ConfiguracionPage'
import { esperarBackend } from './api/client'
import { onUpdaterChange, runUpdateCheck, type UpdaterState, type UpdaterStatus } from './updater'
import { initVersionCheck, getCurrentVersion } from './versionCheck'

function UpdaterBanner({ status, version, errorMsg }: UpdaterState) {
  if (status === 'idle' || status === 'no-update') return null

  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
      <div className={`rounded-full px-4 py-1.5 text-xs font-semibold shadow-lg flex items-center gap-2 ${
        status === 'error' ? 'bg-red-500/90 text-white' :
        status === 'checking' ? 'bg-slate-700/90 text-white' :
        'bg-indigo-600/90 text-white'
      }`}>
        {status === 'error' && <span className="text-base">⚠</span>}
        {(status === 'checking' || status === 'downloading' || status === 'installing') && (
          <span className="inline-block h-3 w-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        )}
        <span>
          {status === 'checking' && 'Buscando actualizaciones…'}
          {status === 'downloading' && `Descargando v${version}…`}
          {status === 'installing' && `Instalando v${version}…`}
          {status === 'error' && (errorMsg ?? 'Error al actualizar')}
        </span>
      </div>
    </div>
  )
}

function LoadingScreen({ updaterStatus }: { updaterStatus: UpdaterStatus }) {
  return (
    <div className="grid h-screen place-items-center bg-slate-900">
      <div className="text-center text-white">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-lg font-medium">Iniciando PosWeb…</p>
        <p className="mt-1 text-sm text-gray-400">
          {updaterStatus === 'checking' || updaterStatus === 'downloading' || updaterStatus === 'installing'
            ? 'Actualizando…'
            : 'Conectando con el servidor'}
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updater, setUpdater] = useState<UpdaterState>({ status: 'idle' })

  useEffect(() => onUpdaterChange(setUpdater), [])

  useEffect(() => {
    initVersionCheck()
    esperarBackend()
      .then(() => {
        console.log('[Startup] Backend connection successful - initializing app')
        setReady(true)
        runUpdateCheck(getCurrentVersion())
      })
      .catch(e => {
        console.error('[Startup] Backend connection failed:', e.message)
        setError(e.message)
      })
  }, [])

  if (error) {
    return (
      <div className="grid h-screen place-items-center bg-slate-900">
        <div className="rounded-xl bg-white/10 p-8 text-center text-white">
          <p className="mb-2 text-lg font-medium">Error de conexión</p>
          <p className="mb-4 text-sm text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium hover:bg-indigo-500"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!ready) return <LoadingScreen updaterStatus={updater.status} />

  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <DialogContainer />
          <UpdaterBanner {...updater} />
          <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AuthGuard />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/ventas" replace />} />
            <Route path="/productos" element={<ProductosPage />} />
            <Route path="/ventas" element={<VentasPage />} />
            <Route path="/historial" element={<HistorialVentasPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/caja" element={<CajaPage />} />
            <Route path="/compras" element={<CompraPage />} />
            <Route path="/gastos" element={<GastosPage />} />
            <Route path="/proveedores" element={<ProveedoresPage />} />
              <Route path="/deudas" element={<DeudaPage />} />
              <Route path="/pedidos" element={<PedidosPage />} />
              <Route path="/combos" element={<CombosPage />} />
              <Route path="/estadisticas" element={<EstadisticasPage />} />
              <Route path="/usuarios/alta" element={<AltaUsuarioPage />} />
              <Route path="/configuracion" element={<ConfiguracionPage />} />
            </Route>
          </Route>
        </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  )
}
