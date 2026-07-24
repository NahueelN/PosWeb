import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import { PageShell } from '../components/shared'
import Button from '../components/ui/Button'
import { formatTime } from '../formats'
import type { DashboardResponse, Widget, WidgetType } from '../analytics/types'
import type { LayoutInstance, GridSize } from '../analytics/grid/types'
import { columnsForWidth, GRID_COLS, GRID_ROWS } from '../analytics/grid/types'
import {
  GridEngine,
  createLocalStorageRepository,
  DEFAULT_LAYOUT,
  resolveLayout,
} from '../analytics/grid'
import type { DashboardRepository } from '../analytics/grid'
import DashboardGridRGL from '../analytics/DashboardGridRGL'
import WidgetPicker from '../analytics/WidgetPicker'
import WidgetEditor from '../analytics/WidgetEditor'
import type { SucursalDto } from '../types'
import { RefreshCw, Plus } from 'lucide-react'

function useGridColumns(): number {
  const [cols, setCols] = useState(() => columnsForWidth(window.innerWidth))

  useEffect(() => {
    const onResize = () => setCols(columnsForWidth(window.innerWidth))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return cols
}

const repo: DashboardRepository = createLocalStorageRepository()

/* ─── Load-time helpers (RGL doesn't validate/correct initial layouts) ── */

function ensurePositions(instances: LayoutInstance[], cols: number): LayoutInstance[] {
  const needsPositioning = instances.some((i) => i.x == null || i.y == null)
  if (!needsPositioning) return instances

  const cells = GridEngine.computeLayout(instances, cols, GRID_ROWS)
  const posMap = new Map(cells.map((c) => [c.instance.id, { x: c.x, y: c.y }]))

  return instances.map((inst) => {
    if (inst.x != null && inst.y != null) return inst
    const pos = posMap.get(inst.id)
    return pos ? { ...inst, x: pos.x, y: pos.y } : { ...inst, x: 1, y: 1 }
  })
}

function hasOverlapsOrOutOfBounds(layout: LayoutInstance[], cols: number, rows: number): boolean {
  for (let i = 0; i < layout.length; i++) {
    const a = layout[i]
    if (a.x < 1 || a.y < 1) return true
    if (a.x + a.w > cols + 1) return true
    if (a.y + a.h > rows + 1) return true
    for (let j = i + 1; j < layout.length; j++) {
      const b = layout[j]
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) return true
    }
  }
  return false
}

/* ─── Programmatic placement helpers (RGL has no "find free slot" or "validate resize" API) ── */

function overlaps(a: LayoutInstance, b: LayoutInstance): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function canPlaceItem(
  layout: LayoutInstance[],
  id: string,
  x: number, y: number,
  w: number, h: number,
  cols: number, rows: number,
): boolean {
  if (x < 1 || y < 1) return false
  if (x + w > cols + 1) return false
  if (y + h > rows + 1) return false
  for (const a of layout) {
    if (a.id === id) continue
    if (overlaps({ ...a }, { id, x, y, w, h } as LayoutInstance)) return false
  }
  return true
}

function findFreeSlot(
  layout: LayoutInstance[],
  w: number, h: number,
  cols: number,
): { x: number; y: number } | null {
  for (let x = 1; x <= cols - w + 1; x++) {
    for (let y = 1; y <= GRID_ROWS - h + 1; y++) {
      let overlapping = false
      for (const a of layout) {
        if (a.x! < x + w && a.x! + a.w > x && a.y! < y + h && a.y! + a.h > y) {
          overlapping = true
          break
        }
      }
      if (!overlapping) return { x, y }
    }
  }
  return null
}

/* ─── DashboardPage ───────────────────────────────────────────── */

export default function DashboardPage() {
  const { notifyError } = useNotification()
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [sucursalId, setSucursalId] = useState<number | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [layout, setLayout] = useState<LayoutInstance[]>(() => {
    const saved = repo.load()
    const base = saved.length > 0 ? saved : DEFAULT_LAYOUT
    const positioned = ensurePositions(base, GRID_COLS)
    if (hasOverlapsOrOutOfBounds(positioned, GRID_COLS, GRID_ROWS)) {
      const cells = GridEngine.computeLayout(positioned, GRID_COLS, GRID_ROWS)
      const fixed = cells.map(c => ({ ...c.instance, x: c.x, y: c.y }))
      repo.save(fixed)
      return fixed
    }
    return positioned
  })
  const [showPicker, setShowPicker] = useState(false)
  const [editingInstance, setEditingInstance] = useState<LayoutInstance | null>(null)
  const gridCols = useGridColumns()

  useEffect(() => {
    const saved = localStorage.getItem('sucursalActiva')
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as SucursalDto
        setSucursalId(parsed.id)
      } catch { /* ignore */ }
    }
  }, [])

  const positionedLayout = useMemo(
    () => layout.map((i) => ({ ...i, x: i.x!, y: i.y! })),
    [layout],
  )

  const positionedRef = useRef(positionedLayout)
  positionedRef.current = positionedLayout

  useEffect(() => {
    console.log('[Page] layout state changed:', layout.map(i => `${i.id}(${i.x},${i.y} ${i.w}x${i.h})`).join(' '))
  }, [layout])

  const cargar = useCallback(async () => {
    if (!sucursalId) return
    setLoading(true)
    try {
      const res = await api.dashboard.build(sucursalId, positionedRef.current)
      setDashboard(res)
      setLastUpdate(new Date())
    } catch (e: any) {
      notifyError(e.message)
    } finally {
      setLoading(false)
    }
  }, [sucursalId, notifyError])

  const didInit = useRef(false)
  useEffect(() => {
    if (!sucursalId) return
    if (didInit.current) return
    didInit.current = true
    cargar()
  }, [sucursalId, cargar])

  useEffect(() => {
    repo.save(layout)
  }, [layout])

  const widgets: Widget[] = useMemo(() => dashboard?.widgets ?? [], [dashboard])
  const definitions = useMemo(() => dashboard?.definitions ?? [], [dashboard])
  const existingDefIds = useMemo(() => layout.map((i) => i.definitionId), [layout])

  /* ── CRUD ── */

  function handleAddWidget(definitionId: string, widgetType: WidgetType, size: GridSize, config: Record<string, any>) {
    const slot = findFreeSlot(layout, size.w, size.h, GRID_COLS)
    if (!slot) {
      notifyError('No hay espacio disponible en el dashboard')
      return
    }

    const inst: LayoutInstance = {
      id: `w-${Date.now()}`,
      definitionId,
      widgetType,
      w: size.w,
      h: size.h,
      x: slot.x,
      y: slot.y,
      config,
    }
    setLayout((prev) => [...prev, inst])
  }

  function handleRemoveWidget(instanceId: string) {
    setLayout((prev) => prev.filter((i) => i.id !== instanceId))
  }

  function handleEditWidget(instanceId: string) {
    const inst = layout.find((i) => i.id === instanceId)
    if (inst) setEditingInstance(inst)
  }

  function handleUpdateWidget(instanceId: string, size: GridSize, config: Record<string, any>) {
    setLayout((prev) => {
      const inst = prev.find((i) => i.id === instanceId)
      if (!inst) return prev
      if (!canPlaceItem(prev, instanceId, inst.x, inst.y, size.w, size.h, GRID_COLS, GRID_ROWS)) {
        notifyError('El nuevo tamaño no cabe en el dashboard')
        return prev
      }
      return prev.map((i) =>
        i.id === instanceId ? { ...i, w: size.w, h: size.h, config } : i,
      )
    })
  }

  /* ── RGL layout change — RGL handles push-down, we fix edge cases ── */

  function handleRGLLayoutChange(newLayout: LayoutInstance[]) {
    console.log('[Page] layout change:', newLayout.map(i => `${i.id}(${i.x},${i.y} ${i.w}x${i.h})`).join(' '))
    const resolved = resolveLayout(newLayout, GRID_COLS, GRID_ROWS)
    if (resolved) {
      setLayout(resolved)
    } else {
      notifyError('No hay espacio disponible para colocar el widget aquí')
      setLayout(layout)
    }
  }

  /* ── Rendering ── */

  if (!dashboard) {
    return (
      <PageShell title="Inicio" subtitle="Resumen de la actividad del negocio" loading={loading} loadingMessage="Cargando dashboard…"
        error={!loading ? 'No se pudieron cargar los datos del dashboard' : null} onErrorClose={cargar}>
        <div />
      </PageShell>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
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
        <div className="flex-1 min-h-0 overflow-hidden">
          <DashboardGridRGL
            layout={layout}
            widgets={widgets}
            definitions={definitions}
            gridCols={gridCols}
            onRemove={handleRemoveWidget}
            onEdit={handleEditWidget}
            onLayoutChange={handleRGLLayoutChange}
          />
        </div>
      </PageShell>

      {layout.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Plus size={32} className="mb-3 text-gray-300" />
          <p className="text-sm font-medium">Tu dashboard está vacío</p>
          <p className="text-xs mt-1">Agregá widgets para ver la información de tu negocio</p>
          <Button variant="primary" size="sm" className="mt-4" icon={<Plus size={13} />} onClick={() => setShowPicker(true)}>
            Agregar Primer Widget
          </Button>
        </div>
      )}

      {showPicker && (
        <WidgetPicker
          open={showPicker}
          onClose={() => setShowPicker(false)}
          definitions={definitions}
          onAdd={handleAddWidget}
          existingDefinitionIds={existingDefIds}
        />
      )}

      {editingInstance && (
        <WidgetEditor
          open={!!editingInstance}
          onClose={() => setEditingInstance(null)}
          instance={editingInstance}
          definition={definitions.find((d) => d.id === editingInstance.definitionId)}
          widgetType={editingInstance.widgetType as WidgetType}
          onUpdate={handleUpdateWidget}
        />
      )}
    </div>
  )
}
