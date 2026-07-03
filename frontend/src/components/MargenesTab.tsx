import { useState, useEffect } from 'react'
import { api } from '../api/client'
import type { CategoriaDto } from '../types'

export default function MargenesTab({ notifyError }: { notifyError: (msg: string) => void }) {
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
