import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import MargenesTab from '../components/MargenesTab'
import StockTab from '../components/StockTab'
import type { UsuarioListadoDto, LicenciaEstado } from '../types'

export default function ConfiguracionPage() {
  const { user } = useAuth()
  const { notifyError, notifySuccess } = useNotification()
  const [tab, setTab] = useState<'perfil' | 'margenes' | 'stock'>('perfil')
  const [perfil, setPerfil] = useState<UsuarioListadoDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [licencia, setLicencia] = useState<LicenciaEstado | null>(null)
  const [buscandoLicencia, setBuscandoLicencia] = useState(false)
  const [licenciaNoEncontrada, setLicenciaNoEncontrada] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.auth.me()
      .then(setPerfil)
      .catch(() => notifyError('Error al cargar perfil'))
      .finally(() => setLoading(false))
    api.licencia.estado()
      .then(setLicencia)
      .catch(() => {})
  }, [])

  const handleBuscarLicencia = async () => {
    const email = perfil?.mail
    if (!email) {
      notifyError('No tenés un mail configurado en tu cuenta')
      return
    }
    setBuscandoLicencia(true)
    setLicenciaNoEncontrada(false)
    try {
      await api.licencia.activarPorEmail({ email })
      notifySuccess('Licencia activada')
      const estado = await api.licencia.estado()
      setLicencia(estado)
    } catch (err: any) {
      const msg = err.message || 'No se pudo activar la licencia'
      notifyError(msg)
      if (msg.includes('No se encontró')) {
        setLicenciaNoEncontrada(true)
      }
    } finally {
      setBuscandoLicencia(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestioná tu cuenta y parámetros del sistema.
        </p>
      </div>

      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setTab('perfil')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'perfil'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Perfil
        </button>
        <button
          onClick={() => setTab('margenes')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'margenes'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Márgenes
        </button>
        <button
          onClick={() => setTab('stock')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'stock'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Stock
        </button>
      </div>

      {tab === 'perfil' ? (
        <div className="bg-white rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <span className="text-lg font-bold text-indigo-600">{(user?.nombre || '?')[0].toUpperCase()}</span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{user?.nombre || 'Usuario'}</h2>
              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {user?.rol || '-'}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
              Cargando perfil...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">ID</label>
                <p className="text-sm font-mono text-slate-700 mt-0.5">{perfil?.id ?? user?.id ?? '-'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Usuario</label>
                <p className="text-sm text-slate-700 mt-0.5">{perfil?.nombreUsuario ?? user?.nombre ?? '-'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Mail</label>
                <p className="text-sm text-slate-700 mt-0.5">{perfil?.mail || '-'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Rol</label>
                <p className="text-sm text-slate-700 mt-0.5">{perfil?.rol ?? user?.rol ?? '-'}</p>
              </div>
              {perfil?.usuarioResponsableNombre && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Responde a</label>
                  <p className="text-sm text-slate-700 mt-0.5">{perfil.usuarioResponsableNombre}</p>
                </div>
              )}
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">PIN</label>
                <p className="text-sm text-slate-700 mt-0.5">
                  {perfil ? (perfil.pinConfigurado ? 'Configurado' : 'No configurado') : '-'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Estado</label>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${
                  perfil?.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {perfil?.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : tab === 'margenes' ? (
        <MargenesTab notifyError={notifyError} />
      ) : (
        <StockTab notifyError={notifyError} />
      )}

      {tab === 'perfil' && (
        <div className="bg-white rounded-xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Licencia</h2>
            <button
              onClick={handleBuscarLicencia}
              disabled={buscandoLicencia}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {buscandoLicencia ? 'Buscando...' : 'Buscar licencia'}
            </button>
          </div>

          {licenciaNoEncontrada && (
            <p className="text-xs text-slate-500 mb-3">
              No encontramos una licencia para <strong>{perfil?.mail}</strong>.{' '}
              <a
                href="https://posweb-licensing.chiacchio-eze01.workers.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 hover:underline font-medium"
              >
                Ver planes y contratar
              </a>
            </p>
          )}

          {!licencia ? (
            <p className="text-sm text-slate-500">Sin licencia configurada.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs font-medium text-slate-400 uppercase">Plan</label>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{licencia.plan || '-'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs font-medium text-slate-400 uppercase">Estado</label>
                <p className="text-sm text-slate-700 mt-0.5">
                  {licencia.estado === 'trial' ? 'Prueba gratuita' : licencia.estado || '-'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs font-medium text-slate-400 uppercase">Vencimiento</label>
                <p className="text-sm text-slate-700 mt-0.5">
                  {licencia.nextBilling
                    ? new Date(licencia.nextBilling).toLocaleDateString('es-AR')
                    : '-'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs font-medium text-slate-400 uppercase">Cuentas (total)</label>
                <p className="text-sm text-slate-700 mt-0.5">
                  {licencia.maxUsuarios >= 2000000000 ? 'Ilimitados' : licencia.maxUsuarios}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
