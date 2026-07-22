import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import MargenesTab from '../components/MargenesTab'
import StockTab from '../components/StockTab'
import type { UsuarioListadoDto, LicenciaEstado } from '../types'

const PLAN_LABELS: Record<string, string> = {
  Basica: 'Básico',
  Media: 'Medio',
  Maxima: 'Máximo',
}

export default function ConfiguracionPage() {
  const { user } = useAuth()
  const { notifyError } = useNotification()
  const [tab, setTab] = useState<'perfil' | 'margenes' | 'stock' | 'licencia'>('perfil')
  const [perfil, setPerfil] = useState<UsuarioListadoDto | null>(null)
  const [licencia, setLicencia] = useState<LicenciaEstado | null>(null)
  const [licenciaLoading, setLicenciaLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.auth.me()
      .then(setPerfil)
      .catch(() => notifyError('Error al cargar perfil'))
      .finally(() => setLoading(false))
  }, [])

  const cargarLicencia = async () => {
    setLicenciaLoading(true)
    try {
      const res = await api.licencia.estado()
      setLicencia(res)
    } catch {
      setLicencia(null)
    } finally {
      setLicenciaLoading(false)
    }
  }

  useEffect(() => {
    if (tab === 'licencia') cargarLicencia()
  }, [tab])

  const forzarVerificacion = async () => {
    try {
      const res = await api.licencia.verificar()
      if (res.permitido) {
        await cargarLicencia()
      }
    } catch (e: any) {
      notifyError(e.message || 'Error al verificar licencia')
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
          onClick={() => setTab('licencia')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'licencia'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Licencia
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

      {tab === 'licencia' ? (
        <div className="bg-white rounded-xl p-6 shadow-xl space-y-4">
          {licenciaLoading ? (
            <div className="text-sm text-slate-500">Cargando estado de licencia...</div>
          ) : !licencia ? (
            <div className="text-sm text-slate-500">No hay información de licencia disponible</div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Plan</label>
                  <p className="text-sm text-slate-700 mt-0.5 font-semibold">
                    {PLAN_LABELS[licencia.plan] || licencia.plan}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Estado</label>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium mt-1 ${
                    licencia.activa ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {licencia.activa ? 'Activa' : licencia.estado}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Sucursales</label>
                  <p className="text-sm text-slate-700 mt-0.5">
                    {licencia.maxSucursales >= 2000000000 ? 'Ilimitadas' : licencia.maxSucursales}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Administradores</label>
                  <p className="text-sm text-slate-700 mt-0.5">
                    {licencia.maxAdmins >= 2000000000 ? 'Ilimitados' : licencia.maxAdmins}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Usuarios</label>
                  <p className="text-sm text-slate-700 mt-0.5">
                    {licencia.maxUsuarios >= 2000000000 ? 'Ilimitados' : licencia.maxUsuarios}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Verificado hasta</label>
                  <p className="text-sm text-slate-700 mt-0.5">
                    {licencia.verificadoHasta ? new Date(licencia.verificadoHasta).toLocaleString('es-AR') : '-'}
                  </p>
                </div>
                {licencia.graceHasta && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 col-span-2">
                    <label className="text-xs font-medium text-amber-600 uppercase tracking-wide">Período de gracia</label>
                    <p className="text-sm text-amber-700 mt-0.5">
                      Hasta {new Date(licencia.graceHasta).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={forzarVerificacion}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-500 transition-colors"
                >
                  Forzar verificación
                </button>
                {!licencia.cacheValido && (
                  <span className="flex items-center gap-1.5 text-xs text-amber-600">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Sin verificación reciente
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      ) : tab === 'perfil' ? (
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
    </div>
  )
}
