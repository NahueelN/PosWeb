import { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import { PageShell } from '../components/shared'
import Button from '../components/ui/Button'
import { formatTime } from '../formats'
import WidgetRenderer from '../analytics/WidgetRenderer'
import type { DashboardResponse, WidgetInstance, WidgetType } from '../analytics/types'
import type { SucursalDto } from '../types'
import WidgetPicker from '../analytics/WidgetPicker'
import {
  loadInstances, saveInstances, addInstance, removeInstance,
  reorderInstances, resetToDefaults,
} from '../analytics/widgetInstances'
import { RefreshCw, Plus, Trash2, GripVertical } from 'lucide-react'

/* ─── DashboardPage ─────────────────────────────────────────────── */

export default function DashboardPage() {
  const { notifyError } = useNotification()
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [sucursalId, setSucursalId] = useState<number | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [instances, setInstances] = useState<WidgetInstance[]>(() => loadInstances())
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('sucursalActiva')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SucursalDto
        setSucursalId(parsed.id)
      } catch { /* ignore */ }
    }
  }, [])

  const cargar = useCallback(async () => {
    if (!sucursalId) return
    setLoading(true)
    try {
      const res = await api.dashboard.build(sucursalId, instances)
      setDashboard(res)
      setLastUpdate(new Date())
    } catch (e: any) {
      notifyError(e.message)
    } finally {
      setLoading(false)
    }
  }, [sucursalId, instances, notifyError])

  useEffect(() => {
    if (!sucursalId) return
    cargar()
  }, [sucursalId, cargar])

  // Sort instances by order
  const sortedInstances = useMemo(
    () => [...instances].sort((a, b) => a.order - b.order),
    [instances]
  )

  // Instance IDs for the picker
  const instanceIds = useMemo(() => instances.map((i) => i.definitionId), [instances])

  /* ── Widget CRUD ── */

  function handleAddWidget(definitionId: string, widgetType: WidgetType, config: Record<string, any>, title?: string) {
    const next = addInstance(instances, definitionId, widgetType, config, title)
    setInstances(next)
  }

  function handleRemoveWidget(instanceId: string) {
    const next = removeInstance(instances, instanceId)
    setInstances(next)
    setDashboard((prev) => prev ? {
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== instanceId),
    } : null)
  }

  /* ── Drag & Drop ── */

  function handleGripDragStart(e: React.DragEvent, instanceId: string) {
    e.dataTransfer.setData('text/plain', instanceId)
    e.dataTransfer.effectAllowed = 'move'
    setDraggedId(instanceId)
  }

  function handleWidgetDragOver(e: React.DragEvent, instanceId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(instanceId)
  }

  function handleWidgetDrop(targetId: string) {
    if (!draggedId || draggedId === targetId) { cleanupDrag(); return }
    const next = reorderInstances(instances, draggedId, targetId)
    setInstances(next)
    cleanupDrag()
  }

  function cleanupDrag() {
    setDraggedId(null)
    setDragOverId(null)
  }

  /* ── Grip Handle ── */

  function GripHandle({ instanceId }: { instanceId: string }) {
    return (
      <div
        draggable
        onDragStart={(e) => handleGripDragStart(e, instanceId)}
        onDragEnd={cleanupDrag}
        className="absolute top-1.5 left-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <div className="bg-white/90 border border-gray-200 rounded-md p-0.5 shadow-sm hover:bg-gray-50">
          <GripVertical size={12} className="text-gray-400" />
        </div>
      </div>
    )
  }

  /* ── Remove Button ── */

  function RemoveButton({ instanceId }: { instanceId: string }) {
    return (
      <button
        onClick={() => handleRemoveWidget(instanceId)}
        className="absolute top-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <div className="bg-white/90 border border-gray-200 rounded-md p-0.5 shadow-sm hover:bg-red-50 hover:border-red-200 transition-colors">
          <Trash2 size={11} className="text-gray-400 hover:text-red-500" />
        </div>
      </button>
    )
  }

  if (!dashboard) {
    return (
      <PageShell title="Inicio" subtitle="Resumen de la actividad del negocio" loading={loading} loadingMessage="Cargando dashboard…"
        error={!loading ? 'No se pudieron cargar los datos del dashboard' : null} onErrorClose={cargar}>
        <div />
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Inicio"
      subtitle="Resumen de la actividad del negocio"
      loading={loading}
      loadingMessage="Actualizando…"
      actions={
        <div className="flex items-center gap-2">
          {lastUpdate && <span className="text-[11px] text-gray-400">Actualizado {formatTime(lastUpdate.toISOString())}</span>}
          <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => setShowPicker(true)}>Agregar Widget</Button>
          <Button variant="ghost" size="sm" icon={<RefreshCw size={12} className={loading ? 'animate-spin' : ''} />} onClick={cargar} disabled={loading}>Actualizar</Button>
        </div>
      }
    >
      {/* ── Widget grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2">
        {sortedInstances.map((instance) => {
          const widget = dashboard.widgets.find((w) => w.id === instance.id)
          return (
            <div
              key={instance.id}
              onDragOver={(e) => handleWidgetDragOver(e, instance.id)}
              onDrop={() => handleWidgetDrop(instance.id)}
              onDragLeave={cleanupDrag}
              className={`relative group transition-all duration-150 ${
                draggedId === instance.id ? 'opacity-30 scale-[0.98]' : ''
              } ${dragOverId === instance.id && draggedId && draggedId !== instance.id ? 'ring-2 ring-indigo-400 ring-offset-1 rounded-xl' : ''}`}
            >
              <GripHandle instanceId={instance.id} />
              <RemoveButton instanceId={instance.id} />
              {widget ? (
                <WidgetRenderer widget={widget} />
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-center text-gray-300 h-20">
                  <span className="text-xs">Cargando…</span>
                </div>
              )}
            </div>
          )
        })}

        {/* Add widget button */}
        <button
          onClick={() => setShowPicker(true)}
          className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all min-h-[80px]"
        >
          <Plus size={18} />
          <span className="text-[10px] font-semibold">Agregar Widget</span>
        </button>
      </div>

      {/* Empty state */}
      {sortedInstances.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Plus size={32} className="mb-3 text-gray-300" />
          <p className="text-sm font-medium">Tu dashboard está vacío</p>
          <p className="text-xs mt-1">Agregá widgets para ver la información de tu negocio</p>
          <Button variant="primary" size="sm" className="mt-4" icon={<Plus size={13} />} onClick={() => setShowPicker(true)}>
            Agregar Primer Widget
          </Button>
        </div>
      )}

      {/* Widget Picker */}
      {showPicker && (
        <WidgetPicker
          open={showPicker}
          onClose={() => setShowPicker(false)}
          definitions={dashboard.definitions}
          onAdd={handleAddWidget}
          existingInstanceIds={instanceIds}
        />
      )}
    </PageShell>
  )
}
