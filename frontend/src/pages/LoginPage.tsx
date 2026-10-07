import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import { api } from '../api/client'
import { obtenerCredenciales, guardarCredenciales } from '../lib/credenciales'
import PasswordInput from '../components/ui/PasswordInput'
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
  const [regPassword2, setRegPassword2] = useState('')
  const [regMail, setRegMail] = useState('')
  const [regEmpresa, setRegEmpresa] = useState('')
  const [regTipoNegocio, setRegTipoNegocio] = useState<'Tienda' | 'Restaurante'>('Tienda')
  const [registerLoading, setRegisterLoading] = useState(false)
  const [showRecovery, setShowRecovery] = useState(false)
  const [recEmail, setRecEmail] = useState('')
  const [recCodigo, setRecCodigo] = useState('')
  const [recNuevaPassword, setRecNuevaPassword] = useState('')
  const [recNuevaPassword2, setRecNuevaPassword2] = useState('')
  const [recPaso, setRecPaso] = useState<'email' | 'codigo'>('email')
  const [recLoading, setRecLoading] = useState(false)
  const [showConfirmacion, setShowConfirmacion] = useState(false)
  const [confEmail, setConfEmail] = useState('')
  const [confCodigo, setConfCodigo] = useState('')
  const [confLoading, setConfLoading] = useState(false)
  const [reenviandoCodigo, setReenviandoCodigo] = useState(false)

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
      let errorText = msg
      try {
        const parts = msg.split(': ')
        const jsonPart = parts[parts.length - 1]
        const parsed = JSON.parse(jsonPart)
        errorText = parsed.error || msg
      } catch {
        errorText = msg
      }
      // Si el email no está confirmado, se muestra la pantalla de confirmación
      // (el código ya se envió al registrarse; se puede reenviar).
      if (errorText.includes('Confirmá tu email')) {
        setShowConfirmacion(true)
        setConfCodigo('')
        setConfEmail('')
      } else {
        notifyError(errorText)
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (regPassword !== regPassword2) {
      notifyError('Las contraseñas no coinciden')
      return
    }
    setRegisterLoading(true)

    try {
      const res = await api.auth.register({
        usuario: regUsuario,
        password: regPassword,
        mail: regMail,
        rol: 'Admin',
        empresaNombre: regEmpresa.trim() || undefined,
        tipoNegocio: regTipoNegocio,
      })
      setRegUsuario('')
      setRegPassword('')
      setRegPassword2('')
      setRegMail('')
      setRegEmpresa('')
      setRegTipoNegocio('Tienda')
      setShowRegister(false)

      if (res.emailConfirmado === false) {
        // El email necesita confirmación: se pasa a la pantalla de código.
        setShowConfirmacion(true)
        setConfEmail(res.mail)
        setConfCodigo('')
        notifySuccess('Te enviamos un código de confirmación a tu email.')
      } else if (res.licenciaEstado === 'trial') {
        notifySuccess('Prueba gratuita de 7 días activada. Ya podés iniciar sesión.')
      } else {
        notifySuccess('Licencia activada correctamente. Ya podés iniciar sesión.')
      }
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

  async function handleSolicitarCodigo(e: React.FormEvent) {
    e.preventDefault()
    if (!recEmail.includes('@') || !recEmail.includes('.')) {
      notifyError('Ingresá un email válido')
      return
    }
    setRecLoading(true)
    try {
      await api.auth.forgotPassword({ email: recEmail.trim() })
      setRecPaso('codigo')
      notifySuccess('Si el email está registrado, recibirás un código de recuperación.')
    } catch (err: any) {
      const msg = err.message || 'Error al solicitar el código'
      notifyError(msg)
    } finally {
      setRecLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (recCodigo.trim().length !== 6) {
      notifyError('Ingresá el código de 6 dígitos')
      return
    }
    if (recNuevaPassword.length < 6) {
      notifyError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (recNuevaPassword !== recNuevaPassword2) {
      notifyError('Las contraseñas no coinciden')
      return
    }
    setRecLoading(true)
    try {
      await api.auth.resetPassword({
        email: recEmail.trim(),
        codigo: recCodigo.trim(),
        nuevaPassword: recNuevaPassword,
      })
      notifySuccess('Contraseña actualizada. Ya podés iniciar sesión.')
      setRecEmail('')
      setRecCodigo('')
      setRecNuevaPassword('')
      setRecNuevaPassword2('')
      setRecPaso('email')
      setShowRecovery(false)
    } catch (err: any) {
      const msg = err.message || 'No se pudo restablecer la contraseña'
      notifyError(msg)
    } finally {
      setRecLoading(false)
    }
  }

  async function handleConfirmarCuenta(e: React.FormEvent) {
    e.preventDefault()
    if (!confEmail.includes('@') || !confEmail.includes('.')) {
      notifyError('Ingresá un email válido')
      return
    }
    if (confCodigo.trim().length !== 6) {
      notifyError('Ingresá el código de 6 dígitos')
      return
    }
    setConfLoading(true)
    try {
      await api.auth.confirmarCuenta({ email: confEmail.trim(), codigo: confCodigo.trim() })
      notifySuccess('Email confirmado. Ya podés iniciar sesión.')
      setConfEmail('')
      setConfCodigo('')
      setShowConfirmacion(false)
    } catch (err: any) {
      const msg = err.message || 'No se pudo confirmar el email'
      notifyError(msg)
    } finally {
      setConfLoading(false)
    }
  }

  async function handleReenviarCodigo() {
    if (!confEmail.includes('@') || !confEmail.includes('.')) {
      notifyError('Ingresá tu email para reenviar el código')
      return
    }
    setReenviandoCodigo(true)
    try {
      await api.auth.reenviarCodigo({ email: confEmail.trim() })
      notifySuccess('Código reenviado. Revisá tu email.')
    } catch (err: any) {
      const msg = err.message || 'No se pudo reenviar el código'
      notifyError(msg)
    } finally {
      setReenviandoCodigo(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500 flex items-center justify-center mb-4">
            <span className="text-white text-2xl font-bold">KI</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Vendeto</h1>
          <p className="text-slate-400 text-sm mt-1">Iniciar sesión</p>
        </div>

        {!showRegister && !showRecovery && !showConfirmacion && (
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
              <PasswordInput
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

            <div className="text-center">
              <button
                type="button"
                onClick={() => { setShowRecovery(true); setRecPaso('email'); setRecCodigo(''); setRecNuevaPassword(''); setRecNuevaPassword2('') }}
                className="text-xs text-slate-500 hover:text-indigo-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        )}

        {showRegister && (
          <form onSubmit={handleRegisterSubmit} className="bg-white rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Crear administrador</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                <PasswordInput
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Repetir contraseña</label>
                <PasswordInput
                  value={regPassword2}
                  onChange={e => setRegPassword2(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Empresa</label>
                <input
                  type="text"
                  value={regEmpresa}
                  onChange={e => setRegEmpresa(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de negocio</label>
                <select
                  value={regTipoNegocio}
                  onChange={e => setRegTipoNegocio(e.target.value as 'Tienda' | 'Restaurante')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="Tienda">Tienda</option>
                  <option value="Restaurante">Restaurante (con mesas)</option>
                </select>
              </div>
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

        {showRecovery && (
          <form onSubmit={recPaso === 'email' ? handleSolicitarCodigo : handleResetPassword} className="bg-white rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Recuperar contraseña</h2>

            {recPaso === 'email' ? (
              <>
                <p className="text-sm text-slate-500">
                  Ingresá el email con el que te registraste. Te enviaremos un código de 6 dígitos para restablecer tu contraseña.
                </p>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={recEmail}
                    onChange={e => setRecEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="tu@email.com"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={recLoading}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {recLoading ? 'Enviando...' : 'Enviar código'}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-500">
                  Revisá tu email e ingresá el código de 6 dígitos junto con tu nueva contraseña.
                </p>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
                  <input
                    type="text"
                    value={recCodigo}
                    onChange={e => setRecCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center tracking-[0.5em] font-mono text-lg"
                    placeholder="••••••"
                    required
                    autoFocus
                    inputMode="numeric"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nueva contraseña</label>
                  <PasswordInput
                    value={recNuevaPassword}
                    onChange={e => setRecNuevaPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Repetir contraseña</label>
                  <PasswordInput
                    value={recNuevaPassword2}
                    onChange={e => setRecNuevaPassword2(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={recLoading}
                  className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                >
                  {recLoading ? 'Restableciendo...' : 'Restablecer contraseña'}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => { setShowRecovery(false); setRecPaso('email'); setRecCodigo(''); setRecNuevaPassword(''); setRecNuevaPassword2('') }}
              className="w-full border border-slate-300 text-slate-700 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}

        {showConfirmacion && (
          <form onSubmit={handleConfirmarCuenta} className="bg-white rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Confirmá tu email</h2>

            <p className="text-sm text-slate-500">
              Ingresá el email con el que te registraste y el código de 6 dígitos que te enviamos.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={confEmail}
                onChange={e => setConfEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="tu@email.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Código</label>
              <input
                type="text"
                value={confCodigo}
                onChange={e => setConfCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center tracking-[0.5em] font-mono text-lg"
                placeholder="••••••"
                required
                inputMode="numeric"
              />
            </div>

            <button
              type="submit"
              disabled={confLoading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {confLoading ? 'Confirmando...' : 'Confirmar email'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleReenviarCodigo}
                disabled={reenviandoCodigo}
                className="text-xs text-indigo-500 hover:underline disabled:opacity-50"
              >
                {reenviandoCodigo ? 'Reenviando...' : 'Reenviar código'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setShowConfirmacion(false); setConfEmail(''); setConfCodigo('') }}
              className="w-full border border-slate-300 text-slate-700 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
