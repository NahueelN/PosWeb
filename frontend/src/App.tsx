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
import { esperarBackend } from './api/client'

function LoadingScreen() {
  return (
    <div className="grid h-screen place-items-center bg-slate-900">
      <div className="text-center text-white">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-lg font-medium">Iniciando PosWeb…</p>
        <p className="mt-1 text-sm text-gray-400">Conectando con el servidor</p>
      </div>
    </div>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    esperarBackend()
      .then(() => {
        console.log('[Startup] Backend connection successful - initializing app')
        setReady(true)
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

  if (!ready) return <LoadingScreen />

  return (
    <BrowserRouter>
      <NotificationProvider>
        <AuthProvider>
          <DialogContainer />
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
            </Route>
          </Route>
        </Routes>
        </AuthProvider>
      </NotificationProvider>
    </BrowserRouter>
  )
}
