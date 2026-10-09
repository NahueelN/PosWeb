// Dashboard Tabs
// Barra de pestañas del dashboard (máx. 5). Cada pestaña tiene título
// propio y su propio layout. Permite seleccionar, crear, renombrar y eliminar.

import { useState } from 'react'
import { Plus, X, Pencil } from 'lucide-react'
import type { DashboardTab } from './grid/types'

interface Props {
  tabs: DashboardTab[]
  activeId: string
  maxTabs?: number
  onSelect: (id: string) => void
  onAdd: () => void
  onRename: (id: string, title: string) => void
  onRemove: (tab: DashboardTab) => void
}

export default function DashboardTabs({
  tabs,
  activeId,
  maxTabs = 5,
  onSelect,
  onAdd,
  onRename,
  onRemove,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  function startEdit(tab: DashboardTab) {
    // La edición siempre ocurre en la pestaña activa.
    if (tab.id !== activeId) onSelect(tab.id)
    setEditingId(tab.id)
    setDraft(tab.title)
  }

  function commitEdit() {
    if (editingId && draft.trim()) {
      onRename(editingId, draft.trim())
    }
    setEditingId(null)
  }

  function selectTab(id: string) {
    setEditingId(null)
    onSelect(id)
  }

  return (
    <div className="flex items-stretch gap-1 px-3 pt-2 bg-slate-100 border-b border-slate-200 overflow-x-auto shrink-0">
      {tabs.map((tab) => {
        const activa = tab.id === activeId
        return (
          <div
            key={tab.id}
            className={`group relative flex items-center gap-1.5 min-w-0 max-w-[180px] px-3 h-9 rounded-t-xl text-xs font-medium transition-colors cursor-pointer ${
              activa
                ? 'bg-white text-gray-900 shadow-[0_-1px_6px_oklch(0_0_0_/_0.05)]'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-200/60'
            }`}
            onClick={() => selectTab(tab.id)}
            title={tab.title}
          >
            {activa && editingId !== tab.id && (
              <span className="absolute inset-x-2 top-0 h-[2px] rounded-full bg-indigo-500" />
            )}
            {editingId === tab.id ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.stopPropagation(); commitEdit() }
                  if (e.key === 'Escape') { e.stopPropagation(); setEditingId(null) }
                }}
                onBlur={commitEdit}
                onClick={(e) => e.stopPropagation()}
                className="min-w-0 flex-1 bg-transparent outline-none border-b border-indigo-400 text-xs font-medium text-gray-900"
                maxLength={24}
              />
            ) : (
              <span className="truncate">{tab.title}</span>
            )}

            {editingId !== tab.id && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); startEdit(tab) }}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-indigo-600 transition-opacity shrink-0"
                  aria-label={`Renombrar pestaña ${tab.title}`}
                  title="Renombrar"
                >
                  <Pencil size={11} strokeWidth={2.2} />
                </button>
                {tabs.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEditingId(null); onRemove(tab) }}
                    className="opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-red-500 transition-opacity shrink-0"
                    aria-label={`Eliminar pestaña ${tab.title}`}
                    title="Eliminar"
                  >
                    <X size={12} strokeWidth={2.2} />
                  </button>
                )}
              </>
            )}
          </div>
        )
      })}

      {tabs.length < maxTabs && (
        <button
          type="button"
          onClick={() => { setEditingId(null); onAdd() }}
          className="flex items-center gap-1 h-9 px-3 rounded-t-xl text-xs font-medium text-gray-500 hover:text-indigo-600 hover:bg-gray-200/60 transition-colors shrink-0"
          title="Nueva pestaña"
        >
          <Plus size={12} strokeWidth={2.2} />
          Nueva
        </button>
      )}
    </div>
  )
}