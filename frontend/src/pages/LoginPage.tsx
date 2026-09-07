import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { api } from '../api/client'
import { obtenerCredenciales, guardarCredenciales } from '../lib/credenciales'
import type { SucursalDto } from '../types'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuth()

  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [recordarme, setRecordarme] = useState(true)
  const [sucursales, setSucursales] = useState<SucursalDto[]>([])
  const [sucursalId, setSucursalId] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const { notifyError, notifySuccess } = useNotification()
  const [loadingSucursales, setLoadingSucursales] = useState(true)
  const [showRegister, setShowRegister] = useState(false)
  const [regUsuario, setRegUsuario] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regMail, setRegMail] = useState('')
  const [regEmpresa, setRegEmpresa] = useState('')
  const [registerLoading, setRegisterLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
      return
    }

    const load = async () => {
      try {
        const s = await api.sucursales.listar()
        setSucursales(s)
        const saved = localStorage.getItem('sucursalActiva')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            const match = s.find(suc => suc.id === parsed.id)
            if (match) setSucursalId(match.id)
          } catch {
            /* ignore */
          }
        }
        if (s.length > 0 && sucursalId === 0) {
          setSucursalId(s[0].id)
        }
      } catch {
        notifyError('Error al cargar sucursales')
      } finally {
        setLoadingSucursales(false)
      }
    }
    load()
  }, [])

  // Prefill credenciales guardadas (keychain del SO en Tauri)
  useEffect(() => {
    if (isAuthenticated) return
    obtenerCredenciales()
      .then(c => {
        if (!c) return
        setUsuario(c.usuario)
        if (c.password) {
          setPassword(c.password)
          setRecordarme(true)
        }
      })
      .catch(() => {})
  }, [isAuthenticated])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await login({ usuario, password, sucursalId })
      if (recordarme) {
        await guardarCredenciales(usuario, password)
      } else {
        await guardarCredenciales(usuario, null)
      }
      navigate('/', { replace: true })
      try {
        const nombre = sucursales.find((s: SucursalDto) => s.id === sucursalId)?.nombre ?? 'Central'
        localStorage.setItem('sucursalActiva', JSON.stringify({ id: sucursalId, nombre }))
      } catch {}
    } catch (err: any) {
      const msg = err.message || 'Error al iniciar sesión'
      try {
        const parts = msg.split(': ')
        const jsonPart = parts[parts.length - 1]
        const parsed = JSON.parse(jsonPart)
        notifyError(parsed.error || msg)
      } catch {
        notifyError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    setRegisterLoading(true)

    try {
      await api.auth.register({
        usuario: regUsuario,
        password: regPassword,
        mail: regMail,
        rol: 'Admin',
        empresaNombre: regEmpresa.trim() || undefined,
      })
      notifySuccess('Administrador registrado correctamente. Ya podés iniciar sesión.')
      setRegUsuario('')
      setRegPassword('')
      setRegMail('')
      setRegEmpresa('')
      setShowRegister(false)
    } catch (err: any) {
      const msg = err.message || 'Error al registrar usuario'
      try {
        const parts = msg.split(': ')
        const jsonPart = parts[parts.length - 1]
        const parsed = JSON.parse(jsonPart)
        notifyError(parsed.error || msg)
      } catch {
        notifyError(msg)
      }
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">KI</span>
          </div>
          <h1 className="text-2xl font-bold text-white">KIO</h1>
          <p className="text-slate-400 text-sm mt-1">Iniciar sesión</p>
        </div>

        {!showRegister && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-xl space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
              <input
                type="text"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nombre de usuario"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="••••••••"
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={recordarme}
                onChange={e => setRecordarme(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Recordarme
            </label>

            {sucursales.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sucursal</label>
              <select
                value={sucursalId}
                onChange={e => setSucursalId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loadingSucursales}
                required
              >
                {loadingSucursales ? (
                  <option value={0}>Cargando...</option>
                ) : (
                  sucursales.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))
                )}
              </select>
            </div>
            )}

            <button
              type="submit"
              disabled={loading || loadingSucursales}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowRegister(true)
              }}
              className="w-full border border-slate-300 text-slate-700 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Registrarse
            </button>
          </form>
        )}

        {showRegister && (
          <form onSubmit={handleRegisterSubmit} className="bg-white rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Crear administrador</h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
              <input
                type="text"
                value={regUsuario}
                onChange={e => setRegUsuario(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mail</label>
              <input
                type="email"
                value={regMail}
                onChange={e => setRegMail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Empresa</label>
              <input
                type="text"
                value={regEmpresa}
                onChange={e => setRegEmpresa(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nombre de empresa (opcional)"
              />
            </div>

            <button
              type="submit"
              disabled={registerLoading}
              className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {registerLoading ? 'Registrando...' : 'Crear administrador'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowRegister(false)
              }}
              className="w-full border border-slate-300 text-slate-700 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar registro
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
