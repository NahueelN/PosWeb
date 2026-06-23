import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useNotification } from '../context/NotificationContext'
import type { UsuarioListadoDto, CategoriaDto } from '../types'

export default function ConfiguracionPage() {
  const { user } = useAuth()
  const { notifyError } = useNotification()
  const [tab, setTab] = useState<'perfil' | 'margenes'>('perfil')
  const [perfil, setPerfil] = useState<UsuarioListadoDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.auth.me()
      .then(setPerfil)
      .catch(() => notifyError('Error al cargar perfil'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
        <p className="mt-1 text-sm text-slate-500">
          Gestioná tu cuenta y parámetros del sistema.
        </p>
      </div>

      {/* Tabs */}
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
      ) : (
        <MargenesTab notifyError={notifyError} />
      )}
    </div>
  )
}

function MargenesTab({ notifyError }: { notifyError: (msg: string) => void }) {
  const [categorias, setCategorias] = useState<CategoriaDto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    api.categorias.listar()
      .then(setCategorias)
      .catch(() => notifyError('Error al cargar categorías'))
      .finally(() => setLoading(false))
  }, [])

  function startEdit(cat: CategoriaDto) {
    setEditingId(cat.id)
    setEditValue(cat.margenGanancia?.toString() ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValue('')
  }

  async function saveMargen(id: number) {
    const trimmed = editValue.trim()
    const margen = trimmed === '' ? null : parseFloat(trimmed)
    if (trimmed !== '' && (isNaN(margen!) || margen! < 0 || margen! > 999.99)) {
      notifyError('El margen debe ser un número entre 0 y 999.99')
      return
    }

    setSaving(id)
    try {
      const updated = await api.categorias.actualizarMargen(id, margen)
      setCategorias(prev => prev.map(c => c.id === id ? updated : c))
      setEditingId(null)
      setEditValue('')
    } catch (err: any) {
      notifyError(err.message || 'Error al guardar margen')
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-xl text-center text-sm text-slate-500">
        Cargando categorías...
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Márgenes por categoría</h2>
          <p className="text-sm text-slate-500">Asigná un % de ganancia sugerido para cada categoría de producto.</p>
        </div>
      </div>

      {categorias.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No hay categorías cargadas.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th className="pb-2 pr-4">Categoría</th>
                <th className="pb-2 pr-4 w-40">% Margen</th>
                <th className="pb-2 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categorias.map(cat => (
                <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 pr-4 text-slate-700">{cat.descripcion}</td>
                  <td className="py-2.5 pr-4">
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="999.99"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveMargen(cat.id)
                            if (e.key === 'Escape') cancelEdit()
                          }}
                          className="w-20 px-2 py-1 border border-indigo-300 rounded text-sm text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                          autoFocus
                        />
                        <span className="text-slate-400 text-xs">%</span>
                      </div>
                    ) : (
                      <span className={cat.margenGanancia != null ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                        {cat.margenGanancia != null ? `${cat.margenGanancia}%` : '—'}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    {editingId === cat.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => saveMargen(cat.id)}
                          disabled={saving === cat.id}
                          className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                        >
                          {saving === cat.id ? '...' : 'Guardar'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-xs text-slate-400 hover:text-slate-600"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(cat)}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                      >
                        {cat.margenGanancia != null ? 'Editar' : 'Asignar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
