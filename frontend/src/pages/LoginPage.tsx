import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { api } from '../api/client'
import type { SucursalDto } from '../types'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, pinLogin, isAuthenticated } = useAuth()

  const [tab, setTab] = useState<'password' | 'pin'>('password')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState('')
  const [sucursales, setSucursales] = useState<SucursalDto[]>([])
  const [sucursalId, setSucursalId] = useState<number>(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loadingSucursales, setLoadingSucursales] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/ventas', { replace: true })
      return
    }
    api.sucursales.listar()
      .then(s => {
        setSucursales(s)
        const saved = localStorage.getItem('sucursalActiva')
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            const match = s.find(suc => suc.id === parsed.id)
            if (match) setSucursalId(match.id)
          } catch { /* ignore */ }
        }
        if (s.length > 0 && sucursalId === 0) {
          setSucursalId(s[0].id)
        }
      })
      .catch(() => setError('Error al cargar sucursales'))
      .finally(() => setLoadingSucursales(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (tab === 'password') {
        await login({ usuario, password, sucursalId })
      } else {
        await pinLogin({ usuario, pin, sucursalId })
      }
      navigate('/ventas', { replace: true })
    } catch (err: any) {
      // Extract error message from thrown string
      const msg = err.message || 'Error al iniciar sesión'
      // Try to extract just the JSON error
      try {
        const parts = msg.split(': ')
        const jsonPart = parts[parts.length - 1]
        const parsed = JSON.parse(jsonPart)
        setError(parsed.error || msg)
      } catch {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">PW</span>
          </div>
          <h1 className="text-2xl font-bold text-white">PosWeb</h1>
          <p className="text-slate-400 text-sm mt-1">Iniciar sesión</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-xl space-y-4">
          {/* Tab selector */}
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab('password')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'password' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Contraseña
            </button>
            <button
              type="button"
              onClick={() => setTab('pin')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${tab === 'pin' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              PIN
            </button>
          </div>

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

          {tab === 'password' ? (
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
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">PIN</label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="4 dígitos"
                required
                maxLength={4}
                inputMode="numeric"
              />
            </div>
          )}

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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || loadingSucursales}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
