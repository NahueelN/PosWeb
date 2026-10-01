import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import ConfirmDialog from './ui/ConfirmDialog'
import type { UsuarioListadoDto, LicenciaEstado } from '../types'

export default function AltaUsuarioTab() {
  const { user } = useAuth()
  const { notifyError, notifySuccess } = useNotification()

  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [mail, setMail] = useState('')
  const [rol, setRol] = useState<'UsuarioComun' | 'Admin'>('UsuarioComun')
  const [loading, setLoading] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [licencia, setLicencia] = useState<LicenciaEstado | null>(null)
  const [_formError, _setFormError] = useState('')
  const [_listError, setListError] = useState('')
  const [_success, setSuccess] = useState('')
  const [desactivandoId, setDesactivandoId] = useState<number | null>(null)
  const [cambiandoSuscripcionId, setCambiandoSuscripcionId] = useState<number | null>(null)
  const [confirmBaja, setConfirmBaja] = useState<{ id: number; nombre: string } | null>(null)
  const [confirmSuscripcion, setConfirmSuscripcion] = useState<{ id: number; nombre: string; activa: boolean } | null>(null)
  const [confirmRol, setConfirmRol] = useState<{ id: number; nombre: string; rol: 'Admin' | 'UsuarioComun' } | null>(null)
  const [cambiandoRolId, setCambiandoRolId] = useState<number | null>(null)
  const [menuAcciones, setMenuAcciones] = useState<{ id: number; top: number; left: number } | null>(null)
  const [ocultarDadosDeBaja, setOcultarDadosDeBaja] = useState(true)
  const [usuarios, setUsuarios] = useState<UsuarioListadoDto[]>([])

  useEffect(() => {
    void loadUsuarios()
    api.licencia.estado().then(setLicencia).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadUsuarios() {
    setLoadingList(true)
    try {
      const result = await api.usuarios.listar()
      setUsuarios(result)
    } catch (err: any) {
      const msg = err.message || 'Error al cargar usuarios'
      notifyError(msg)
    } finally {
      setLoadingList(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await api.auth.register({
        usuario,
        password,
        mail,
        rol,
      })
      notifySuccess(`Usuario ${rol === 'Admin' ? 'admin' : 'común'} creado correctamente.`)
      setUsuario('')
      setPassword('')
      setMail('')
      setRol('UsuarioComun')
      await loadUsuarios()
    } catch (err: any) {
      const msg = err.message || 'Error al crear usuario'
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

  async function handleDesactivarUsuario(usuarioId: number, nombreUsuario: string) {
    setListError('')
    setSuccess('')
    setDesactivandoId(usuarioId)

    try {
      await api.usuarios.desactivar(usuarioId)
      setSuccess(`Usuario ${nombreUsuario} dado de baja correctamente.`)
      await loadUsuarios()
    } catch (err: any) {
      const msg = err.message || 'Error al dar de baja al usuario'
      try {
        const parts = msg.split(': ')
        const jsonPart = parts[parts.length - 1]
        const parsed = JSON.parse(jsonPart)
        setListError(parsed.error || msg)
      } catch {
        setListError(msg)
      }
    } finally {
      setDesactivandoId(null)
      setConfirmBaja(null)
    }
  }

  async function handleCambiarSuscripcion(usuarioId: number, nombreUsuario: string, activa: boolean) {
    setListError('')
    setSuccess('')
    setCambiandoSuscripcionId(usuarioId)

    try {
      await api.usuarios.cambiarSuscripcion(usuarioId, activa)
      setSuccess(`Suscripción de ${nombreUsuario} ${activa ? 'reactivada' : 'suspendida'} correctamente.`)
      await loadUsuarios()
    } catch (err: any) {
      const msg = err.message || 'Error al cambiar la suscripción'
      try {
        const parts = msg.split(': ')
        const jsonPart = parts[parts.length - 1]
        const parsed = JSON.parse(jsonPart)
        setListError(parsed.error || msg)
      } catch {
        setListError(msg)
      }
    } finally {
      setCambiandoSuscripcionId(null)
      setConfirmSuscripcion(null)
    }
  }

  async function handleCambiarRol(usuarioId: number, nombreUsuario: string, rol: 'Admin' | 'UsuarioComun') {
    setListError('')
    setSuccess('')
    setCambiandoRolId(usuarioId)

    try {
      await api.usuarios.cambiarRol(usuarioId, rol)
      setSuccess(`Rol de ${nombreUsuario} cambiado a ${rol === 'Admin' ? 'admin' : 'usuario común'} correctamente.`)
      await loadUsuarios()
    } catch (err: any) {
      const msg = err.message || 'Error al cambiar el rol'
      try {
        const parts = msg.split(': ')
        const jsonPart = parts[parts.length - 1]
        const parsed = JSON.parse(jsonPart)
        setListError(parsed.error || msg)
      } catch {
        setListError(msg)
      }
    } finally {
      setCambiandoRolId(null)
      setConfirmRol(null)
    }
  }

  if (user?.rol === 'UsuarioComun') return null

  function onAccion(usuarioItem: UsuarioListadoDto, accion: string) {
    if (!accion) return
    setMenuAcciones(null)
    switch (accion) {
      case 'baja':
        setConfirmBaja({ id: usuarioItem.id, nombre: usuarioItem.nombreUsuario })
        break
      case 'hacer-admin':
        setConfirmRol({ id: usuarioItem.id, nombre: usuarioItem.nombreUsuario, rol: 'Admin' })
        break
      case 'hacer-usuario':
        setConfirmRol({ id: usuarioItem.id, nombre: usuarioItem.nombreUsuario, rol: 'UsuarioComun' })
        break
      case 'suspender':
      case 'reactivar':
        setConfirmSuscripcion({ id: usuarioItem.id, nombre: usuarioItem.nombreUsuario, activa: accion === 'reactivar' })
        break
    }
  }

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Alta de usuario</h1>
          <p className="mt-1 text-sm text-slate-500">
            Crea usuarios comunes o administradores y guarda su supervisor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-slate-900">Nuevo usuario</h2>
            <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              Rol seleccionado: {rol === 'Admin' ? 'Admin' : 'UsuarioComun'}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
            <input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mail</label>
            <input
              type="email"
              value={mail}
              onChange={e => setMail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
            <select
              value={rol}
              onChange={e => setRol(e.target.value as 'UsuarioComun' | 'Admin')}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="UsuarioComun">Usuario común</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creando...' : 'Crear usuario'}
          </button>
        </form>

        {licencia && (
          <div className="bg-white rounded-xl p-6 shadow-xl mt-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Licencia</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs font-medium text-slate-400 uppercase">Plan</label>
                <p className="text-sm font-semibold text-slate-700 mt-0.5">{licencia.plan}</p>
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
                <label className="text-xs font-medium text-slate-400 uppercase">Sucursales</label>
                <p className="text-sm text-slate-700 mt-0.5">
                  {licencia.maxSucursales >= 2000000000 ? 'Ilimitadas' : licencia.maxSucursales}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs font-medium text-slate-400 uppercase">Cuentas (total)</label>
                <p className="text-sm text-slate-700 mt-0.5">
                  {licencia.maxUsuarios >= 2000000000 ? 'Ilimitados' : licencia.maxUsuarios}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs font-medium text-slate-400 uppercase">Productos</label>
                <p className="text-sm text-slate-700 mt-0.5">
                  {licencia.maxProductos >= 2000000000 ? 'Ilimitados' : licencia.maxProductos}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Usuarios registrados</h2>
            <p className="text-sm text-slate-500">Listado actualizado desde la base de datos.</p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={ocultarDadosDeBaja}
                onChange={e => setOcultarDadosDeBaja(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Ocultar dados de baja
            </label>
            <button
            type="button"
            onClick={loadUsuarios}
            disabled={loadingList}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
          >
            {loadingList ? 'Actualizando...' : 'Refrescar'}
          </button>
          </div>
        </div>

        {loadingList ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Cargando usuarios...
          </div>
        ) : usuarios.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No hay usuarios cargados.
          </div>
        ) : (() => {
          const usuariosVisibles = (ocultarDadosDeBaja ? usuarios.filter(u => u.activo) : usuarios).filter(u => u.nombreUsuario !== 'admin')
          return (
          <div className="overflow-x-auto">
            {usuariosVisibles.length === 0 && (
              <p className="text-sm text-slate-400 py-4">No hay usuarios que mostrar con el filtro actual.</p>
            )}
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4 font-medium">Usuario</th>
                  <th className="py-2 pr-4 font-medium">Mail</th>
                  <th className="py-2 pr-4 font-medium">Rol</th>
                  <th className="py-2 pr-4 font-medium">Supervisor</th>
                  <th className="py-2 pr-4 font-medium">Estado</th>
                  <th className="py-2 pr-4 font-medium">Nivel</th>
                  <th className="py-2 pr-4 font-medium">Costo</th>
                  <th className="py-2 pr-4 font-medium">Suscripción</th>
                  <th className="py-2 pr-4 font-medium">Acceso</th>
                  <th className="py-2 pr-4 font-medium">PIN</th>
                  <th className="py-2 pr-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-300">
                {usuariosVisibles.map(usuarioItem => (
                  <tr key={usuarioItem.id}>
                    <td className="py-3 pr-4 font-medium text-slate-900">{usuarioItem.nombreUsuario}</td>
                    <td className="py-3 pr-4 text-slate-600">{usuarioItem.mail || '-'}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          {usuarioItem.rol}
                        </span>
                        {usuarioItem.esTitular && (
                          <span
                            className="inline-flex rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700"
                            title="Titular de la suscripción/licencia de este install"
                          >
                            Titular
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {usuarioItem.usuarioResponsableNombre || '-'}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          usuarioItem.activo
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {usuarioItem.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {usuarioItem.suscripcionNivel || '-'}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {usuarioItem.costoMensual != null ? `$${usuarioItem.costoMensual.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          usuarioItem.suscripcionActiva
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {usuarioItem.suscripcionActiva ? 'Activa' : 'Suspendida'}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          usuarioItem.accesoHabilitado
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {usuarioItem.accesoHabilitado ? 'Habilitado' : 'Bloqueado'}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {usuarioItem.pinConfigurado ? 'Configurado' : 'No configurado'}
                    </td>
                    <td className="py-3 pr-4">
                      {(() => {
                        const acciones: { value: string; label: string }[] = []
                        if (usuarioItem.activo) {
                          if (usuarioItem.rol === 'UsuarioComun') {
                            acciones.push({ value: 'hacer-admin', label: 'Hacer admin' })
                            acciones.push({ value: 'baja', label: 'Dar de baja' })
                          } else if (usuarioItem.rol === 'Admin') {
                            acciones.push({
                              value: usuarioItem.suscripcionActiva ? 'suspender' : 'reactivar',
                              label: usuarioItem.suscripcionActiva ? 'Suspender suscripción' : 'Reactivar suscripción',
                            })
                            if (!usuarioItem.esTitular && user?.id !== usuarioItem.id) {
                              acciones.push({ value: 'hacer-usuario', label: 'Hacer usuario' })
                            }
                          }
                        }
                        if (acciones.length === 0) {
                          return <span className="text-xs text-slate-400">—</span>
                        }
                        const abierto = menuAcciones?.id === usuarioItem.id
                        const ocupado =
                          desactivandoId === usuarioItem.id ||
                          cambiandoRolId === usuarioItem.id ||
                          cambiandoSuscripcionId === usuarioItem.id
                        return (
                          <>
                            <button
                              type="button"
                              onClick={e => {
                                if (abierto) { setMenuAcciones(null); return }
                                const rect = e.currentTarget.getBoundingClientRect()
                                setMenuAcciones({ id: usuarioItem.id, top: rect.bottom + 4, left: rect.right })
                              }}
                              disabled={ocupado}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                            >
                              Acciones
                              <ChevronDown size={12} className={`transition-transform ${abierto ? 'rotate-180' : ''}`} />
                            </button>
                            {abierto && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setMenuAcciones(null)} />
                                <div
                                  className="fixed z-50 mt-0.5 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
                                  style={{ top: menuAcciones!.top, left: menuAcciones!.left, transform: 'translateX(-100%)' }}
                                >
                                  {acciones.map(a => (
                                    <button
                                      key={a.value}
                                      type="button"
                                      onClick={() => onAccion(usuarioItem, a.value)}
                                      className="block w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                                    >
                                      {a.label}
                                    </button>
                                  ))}
                                </div>
                              </>
                            )}
                          </>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )
        })()}
      </div>

      <ConfirmDialog
        open={confirmBaja != null}
        title="Dar de baja"
        description={confirmBaja ? `¿Dar de baja a ${confirmBaja.nombre}?` : ''}
        confirmLabel="Dar de baja"
        confirmVariant="destructive"
        onCancel={() => setConfirmBaja(null)}
        onConfirm={() => { if (confirmBaja) void handleDesactivarUsuario(confirmBaja.id, confirmBaja.nombre) }}
      />

      <ConfirmDialog
        open={confirmSuscripcion != null}
        title="Suscripción"
        description={confirmSuscripcion
          ? `¿${confirmSuscripcion.activa ? 'reactivar' : 'suspender'} la suscripción de ${confirmSuscripcion.nombre} y sus dependientes?`
          : ''}
        confirmLabel={confirmSuscripcion?.activa ? 'Reactivar' : 'Suspender'}
        confirmVariant={confirmSuscripcion?.activa ? 'confirm' : 'destructive'}
        onCancel={() => setConfirmSuscripcion(null)}
        onConfirm={() => { if (confirmSuscripcion) void handleCambiarSuscripcion(confirmSuscripcion.id, confirmSuscripcion.nombre, confirmSuscripcion.activa) }}
      />

      <ConfirmDialog
        open={confirmRol != null}
        title="Cambiar rol"
        description={confirmRol
          ? `¿${confirmRol.rol === 'Admin' ? 'hacer administrador a' : 'convertir en usuario común a'} ${confirmRol.nombre}?`
          : ''}
        confirmLabel={confirmRol?.rol === 'Admin' ? 'Hacer Admin' : 'Hacer usuario'}
        confirmVariant="confirm"
        onCancel={() => setConfirmRol(null)}
        onConfirm={() => { if (confirmRol) void handleCambiarRol(confirmRol.id, confirmRol.nombre, confirmRol.rol) }}
      />
    </div>
  )
}