import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import type { UsuarioListadoDto } from '../types'

export default function AltaUsuarioPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [mail, setMail] = useState('')
  const [rol, setRol] = useState<'UsuarioComun' | 'Admin'>('UsuarioComun')
  const [empresaRepresenta, setEmpresaRepresenta] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const { notifyError, notifySuccess } = useNotification()
  const [usuarios, setUsuarios] = useState<UsuarioListadoDto[]>([])

  useEffect(() => {
    if (user?.rol === 'UsuarioComun') {
      navigate('/ventas', { replace: true })
      return
    }

    void loadUsuarios()
  }, [user, navigate])

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
        empresaRepresenta: rol === 'Admin' ? empresaRepresenta : null,
      })
      notifySuccess(`Usuario ${rol === 'Admin' ? 'admin' : 'común'} creado correctamente.`)
      setUsuario('')
      setPassword('')
      setMail('')
      setRol('UsuarioComun')
      setEmpresaRepresenta('')
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

  return (
    <div className="space-y-6">
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Alta de usuario</h1>
          <p className="mt-1 text-sm text-slate-500">
            Crea usuarios comunes o administradores y guarda a quién responden.
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

          {rol === 'Admin' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Empresa representa</label>
              <input
                type="text"
                value={empresaRepresenta}
                onChange={e => setEmpresaRepresenta(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Opcional"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium text-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creando...' : 'Crear usuario'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/ventas')}
              className="flex-1 border border-slate-300 text-slate-700 py-2.5 rounded-lg font-medium text-sm hover:bg-slate-50 transition-colors"
            >
              Volver
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Usuarios registrados</h2>
            <p className="text-sm text-slate-500">Listado actualizado desde la base de datos.</p>
          </div>
          <button
            type="button"
            onClick={loadUsuarios}
            disabled={loadingList}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
          >
            {loadingList ? 'Actualizando...' : 'Refrescar'}
          </button>
        </div>

        {loadingList ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            Cargando usuarios...
          </div>
        ) : usuarios.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
            No hay usuarios cargados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2 pr-4 font-medium">Usuario</th>
                  <th className="py-2 pr-4 font-medium">Mail</th>
                  <th className="py-2 pr-4 font-medium">Rol</th>
                  <th className="py-2 pr-4 font-medium">Responde a</th>
                  <th className="py-2 pr-4 font-medium">Empresa</th>
                  <th className="py-2 pr-4 font-medium">Estado</th>
                  <th className="py-2 pr-4 font-medium">PIN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuarios.map(usuarioItem => (
                  <tr key={usuarioItem.id}>
                    <td className="py-3 pr-4 font-medium text-slate-900">{usuarioItem.nombreUsuario}</td>
                    <td className="py-3 pr-4 text-slate-600">{usuarioItem.mail || '-'}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                        {usuarioItem.rol}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {usuarioItem.usuarioResponsableNombre || '-'}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {usuarioItem.empresaRepresenta || '-'}
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
                      {usuarioItem.pinConfigurado ? 'Configurado' : 'No configurado'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
