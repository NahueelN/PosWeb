import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { HELP_KEYS } from '../help/content'
import { api } from '../api/client'
import { useNotification } from '../context/NotificationContext'
import { PageShell } from '../components/shared'
import Button from '../components/ui/Button'
import { formatTime } from '../formats'
import type { DashboardResponse, Widget, WidgetType } from '../analytics/types'
import type { LayoutInstance, GridSize, DashboardTab } from '../analytics/grid/types'
import { columnsForWidth, GRID_COLS, GRID_ROWS } from '../analytics/grid/types'
import { GridEngine, createLocalStorageTabsRepository, DEFAULT_LAYOUT, resolveLayout } from '../analytics/grid'
import type { DashboardTabsRepository } from '../analytics/grid'
import { MAX_TABS } from '../analytics/grid'
import DashboardGridRGL from '../analytics/DashboardGridRGL'
import DashboardTabs from '../analytics/DashboardTabs'
import WidgetPicker from '../analytics/WidgetPicker'
import WidgetEditor from '../analytics/WidgetEditor'
import ConfirmDialog from '../components/ui/ConfirmDialog'
import type { SucursalDto } from '../types'
import { RefreshCw, Plus, RotateCcw } from 'lucide-react'

function useGridColumns(): number {
  const [cols, setCols] = useState(() => columnsForWidth(window.innerWidth))

  useEffect(() => {
    const onResize = () => setCols(columnsForWidth(window.innerWidth))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return cols
}

const repo: DashboardTabsRepository = createLocalStorageTabsRepository()

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

function normalizeLayout(layout: LayoutInstance[]): LayoutInstance[] {
  const positioned = ensurePositions(layout, GRID_COLS)
  if (hasOverlapsOrOutOfBounds(positioned, GRID_COLS, GRID_ROWS)) {
    const cells = GridEngine.computeLayout(positioned, GRID_COLS, GRID_ROWS)
    return cells.map((c) => ({ ...c.instance, x: c.x, y: c.y }))
  }
  return positioned
}

function buildInitialTabs(): DashboardTab[] {
  const loaded = repo.load()
  if (loaded.length === 0) {
    return [{ id: 'tab-inicio', title: 'Inicio', layout: normalizeLayout(DEFAULT_LAYOUT) }]
  }
  return loaded.map((t) => ({ ...t, layout: normalizeLayout(t.layout) }))
}

function hasOverlapsOrOutOfBounds(layout: LayoutInstance[], cols: number, rows: number): boolean {
  for (let i = 0; i < layout.length; i++) {
    const a = layout[i]
    if (a.x! < 1 || a.y! < 1) return true
    if (a.x! + a.w > cols + 1) return true
    if (a.y! + a.h > rows + 1) return true
    for (let j = i + 1; j < layout.length; j++) {
      const b = layout[j]
      if (a.x! < b.x! + b.w && a.x! + a.w > b.x! && a.y! < b.y! + b.h && a.y! + a.h > b.y!) return true
    }
  }
  return false
}

/* ─── Programmatic placement helpers (RGL has no "find free slot" or "validate resize" API) ── */

function overlaps(a: LayoutInstance, b: LayoutInstance): boolean {
  return a.x! < b.x! + b.w && a.x! + a.w > b.x! && a.y! < b.y! + b.h && a.y! + a.h > b.y!
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
  const { notifyError, current: currentNotification } = useNotification()
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [sucursalId, setSucursalId] = useState<number | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [tabs, setTabs] = useState<DashboardTab[]>(buildInitialTabs)
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id ?? 'tab-inicio')
  const [layout, setLayout] = useState<LayoutInstance[]>(() => tabs[0]?.layout ?? [])
  const prevLayoutRef = useRef<LayoutInstance[]>([])
  useEffect(() => { prevLayoutRef.current = layout }, [layout])
  const [layoutGeneration, setLayoutGeneration] = useState(0)
  const pendingRevertRef = useRef<LayoutInstance[] | null>(null)
  const prevNotifRef = useRef(currentNotification)
  useEffect(() => {
    if (prevNotifRef.current && !currentNotification && pendingRevertRef.current) {
      setLayout(pendingRevertRef.current.map(i => ({ ...i })))
      setLayoutGeneration(g => g + 1)
      pendingRevertRef.current = null
    }
    prevNotifRef.current = currentNotification
  }, [currentNotification])
  const [showPicker, setShowPicker] = useState(false)
  const [editingInstance, setEditingInstance] = useState<LayoutInstance | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmRemoveTab, setConfirmRemoveTab] = useState<DashboardTab | null>(null)
  const [pendingAdd, setPendingAdd] = useState<{
    definitionId: string
    widgetType: WidgetType
    size: GridSize
    config: Record<string, any>
    pestañas: string[]
  } | null>(null)
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

  // On reduced columns (small window) the 12-col layout overflows.
  // Reflow it into a clean top-down arrangement that grows rows.
  const fitted = useMemo(
    () => (gridCols < GRID_COLS ? GridEngine.fitLayout(layout, gridCols, 6) : null),
    [layout, gridCols],
  )
  const renderLayout = fitted ? fitted.instances : positionedLayout
  const gridRows = fitted ? fitted.rows : GRID_ROWS

  const positionedRef = useRef(positionedLayout)
  positionedRef.current = positionedLayout

  useEffect(() => {
    console.log('[Page] layout state changed:', layout.map(i => `${i.id}(${i.x},${i.y} ${i.w}x${i.h})`).join(' '))
  }, [layout])

  const cargar = useCallback(async (forcedLayout?: LayoutInstance[]) => {
    if (!sucursalId) return
    setLoading(true)
    try {
      const layoutToSend = forcedLayout ?? positionedRef.current
      const res = await api.dashboard.build(sucursalId, layoutToSend)
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

  // Sincronizar la pestaña activa con el layout actual
  useEffect(() => {
    setTabs(prev => prev.map(t => (t.id === activeTabId ? { ...t, layout } : t)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout])

  // Persistir las pestañas completas (incluye títulos)
  useEffect(() => {
    repo.save(tabs)
  }, [tabs])

  const widgets: Widget[] = useMemo(() => dashboard?.widgets ?? [], [dashboard])
  const definitions = useMemo(() => dashboard?.definitions ?? [], [dashboard])
  const existingWidgets = useMemo(() => {
    const map: Record<string, { w: number; h: number }> = {}
    for (const inst of layout) {
      if (!map[inst.definitionId]) {
        map[inst.definitionId] = { w: inst.w, h: inst.h }
      }
    }
    return map
  }, [layout])

  // Widgets que ya existen en otras pestañas (definitionId -> títulos).
  const widgetsEnOtrasPestanias = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const t of tabs) {
      if (t.id === activeTabId) continue
      for (const inst of t.layout) {
        const lista = map.get(inst.definitionId) ?? []
        if (!lista.includes(t.title)) lista.push(t.title)
        map.set(inst.definitionId, lista)
      }
    }
    return map
  }, [tabs, activeTabId])

  /* ── CRUD ── */

  function handleAddWidget(definitionId: string, widgetType: WidgetType, size: GridSize, config: Record<string, any>) {
    // Si el widget ya existe en otra pestaña, avisamos antes de agregarlo.
    const pestañas = widgetsEnOtrasPestanias.get(definitionId) ?? []
    if (pestañas.length > 0) {
      setPendingAdd({ definitionId, widgetType, size, config, pestañas })
      return
    }
    doAddWidget(definitionId, widgetType, size, config)
  }

  function doAddWidget(definitionId: string, widgetType: WidgetType, size: GridSize, config: Record<string, any>) {
    const slot = findFreeSlot(layout, size.w, size.h, GRID_COLS)
    if (!slot) {
      notifyError('No hay espacio disponible en el dashboard')
      return
    }

    const inst: LayoutInstance = {
      id: `w-${activeTabId}-${Date.now()}`,
      definitionId,
      widgetType,
      w: size.w,
      h: size.h,
      x: slot.x,
      y: slot.y,
      config,
    }
    const updatedLayout = [...layout, inst]
    const positioned = updatedLayout.map(i => ({ ...i, x: i.x!, y: i.y! }))
    setLayout(updatedLayout)
    cargar(positioned)
  }

  function handleRemoveWidget(instanceId: string) {
    setLayout((prev) => prev.filter((i) => i.id !== instanceId))
  }

  function handleEditWidget(instanceId: string) {
    const inst = layout.find((i) => i.id === instanceId)
    if (inst) setEditingInstance(inst)
  }

  function handleReset() {
    setConfirmReset(true)
  }

  function aplicarReset() {
    const resetLayout = ensurePositions(DEFAULT_LAYOUT, GRID_COLS)
    setLayout(resetLayout)
    setTabs(prev => prev.map(t => (t.id === activeTabId ? { ...t, layout: resetLayout } : t)))
    setLayoutGeneration(g => g + 1)
    cargar(resetLayout.map((i) => ({ ...i, x: i.x!, y: i.y! })))
    setConfirmReset(false)
  }

  /* ── Pestañas ── */

  function handleSelectTab(id: string) {
    if (id === activeTabId) return
    const tab = tabs.find((t) => t.id === id)
    if (!tab) return
    setActiveTabId(id)
    setLayout(tab.layout)
    cargar(tab.layout.map((i) => ({ ...i, x: i.x!, y: i.y! })))
  }

  function handleAddTab() {
    if (tabs.length >= MAX_TABS) return
    const id = `tab-${Date.now()}`
    setTabs(prev => [...prev, { id, title: `Pestaña ${prev.length + 1}`, layout: [] }])
    setActiveTabId(id)
    setLayout([])
    cargar([])
  }

  function handleRenameTab(id: string, title: string) {
    setTabs(prev => prev.map(t => (t.id === id ? { ...t, title } : t)))
  }

  function handleRemoveTab(id: string) {
    if (tabs.length <= 1) return
    const idx = tabs.findIndex((t) => t.id === id)
    const next = tabs.filter((t) => t.id !== id)
    setTabs(next)
    if (id === activeTabId) {
      const fallback = next[Math.max(0, idx - 1)] ?? next[0]
      setActiveTabId(fallback.id)
      setLayout(fallback.layout)
      cargar(fallback.layout.map((i) => ({ ...i, x: i.x!, y: i.y! })))
    }
  }

  function handleRequestRemoveTab(tab: DashboardTab) {
    setConfirmRemoveTab(tab)
  }

  function handleUpdateWidget(instanceId: string, size: GridSize, config: Record<string, any>) {
    setLayout((prev) => {
      const inst = prev.find((i) => i.id === instanceId)
      if (!inst) return prev
      if (inst.x == null || inst.y == null) return prev
      if (!canPlaceItem(prev, instanceId, inst.x, inst.y, size.w, size.h, GRID_COLS, GRID_ROWS)) {
        notifyError('El nuevo tamaño no cabe en el dashboard')
        return prev
      }
      const next = prev.map((i) =>
        i.id === instanceId ? { ...i, w: size.w, h: size.h, config } : i,
      )
      cargar(next.map((i) => ({ ...i, x: i.x!, y: i.y! })))
      return next
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
      pendingRevertRef.current = prevLayoutRef.current
    }
  }

  /* ── Rendering ── */

  if (!dashboard) {
    return (
      <PageShell title="Inicio" subtitle="Resumen de la actividad del negocio" loading={loading} loadingMessage="Cargando dashboard…"
        error={!loading ? 'No se pudieron cargar los datos del dashboard' : null} onErrorClose={() => cargar()} helpKey={HELP_KEYS.inicio}>
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
        helpKey={HELP_KEYS.inicio}
        actions={
          <div className="flex items-center gap-2">
            {lastUpdate && <span className="text-[11px] text-gray-400">Actualizado {formatTime(lastUpdate.toISOString())}</span>}
            <Button variant="ghost" size="sm" icon={<Plus size={12} />} onClick={() => setShowPicker(true)}>Agregar Widget</Button>
            <Button variant="ghost" size="sm" icon={<RefreshCw size={12} className={loading ? 'animate-spin' : ''} />} onClick={() => cargar()} disabled={loading}>Actualizar</Button>
            <Button variant="ghost" size="sm" icon={<RotateCcw size={12} />} onClick={handleReset}>Restablecer</Button>
          </div>
        }
      >
        <div className="flex-1 min-h-0 flex flex-col bg-slate-100">
          <DashboardTabs
            tabs={tabs}
            activeId={activeTabId}
            maxTabs={MAX_TABS}
            onSelect={handleSelectTab}
            onAdd={handleAddTab}
            onRename={handleRenameTab}
            onRemove={handleRequestRemoveTab}
          />
          <div className="flex-1 min-h-0 overflow-y-auto">
            <DashboardGridRGL
              key={layoutGeneration}
              layout={renderLayout}
              widgets={widgets}
              definitions={definitions}
              gridCols={gridCols}
              rows={gridRows}
              onRemove={handleRemoveWidget}
              onEdit={handleEditWidget}
              onLayoutChange={handleRGLLayoutChange}
            />
          </div>
        </div>
      </PageShell>

      {layout.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center mb-4 shadow-sm">
            <Plus size={22} className="text-indigo-400" strokeWidth={1.5} />
          </div>
          <p className="text-base font-semibold text-gray-900 tracking-tight">Tu dashboard está vacío</p>
          <p className="text-sm text-gray-400 mt-1.5 max-w-sm">Agregá widgets para ver la información de tu negocio en un solo lugar</p>
          <Button variant="primary" size="sm" className="mt-5" icon={<Plus size={13} />} onClick={() => setShowPicker(true)}>
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
          existingDefinitionIds={Object.keys(existingWidgets)}
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

      <ConfirmDialog
        open={confirmReset}
        title="Restablecer dashboard"
        description="¿Restablecer la pestaña activa al diseño predeterminado? Se descartará el layout actual de esa pestaña."
        confirmLabel="Restablecer"
        onCancel={() => setConfirmReset(false)}
        onConfirm={aplicarReset}
      />

      <ConfirmDialog
        open={confirmRemoveTab != null}
        title="Eliminar pestaña"
        description={confirmRemoveTab
          ? `¿Eliminar la pestaña «${confirmRemoveTab.title}» y todos sus widgets? Esta acción no se puede deshacer.`
          : ''}
        confirmLabel="Eliminar"
        confirmVariant="destructive"
        onCancel={() => setConfirmRemoveTab(null)}
        onConfirm={() => {
          if (confirmRemoveTab) handleRemoveTab(confirmRemoveTab.id)
          setConfirmRemoveTab(null)
        }}
      />

      <ConfirmDialog
        open={pendingAdd != null}
        title="Widget en otra pestaña"
        description={pendingAdd
          ? `Este widget ya está agregado en ${pendingAdd.pestañas.map(p => `«${p}»`).join(' y ')}. ¿Querés agregarlo igual en esta pestaña?`
          : ''}
        confirmLabel="Agregar igual"
        cancelLabel="Cancelar"
        onCancel={() => setPendingAdd(null)}
        onConfirm={() => {
          if (pendingAdd) {
            doAddWidget(pendingAdd.definitionId, pendingAdd.widgetType, pendingAdd.size, pendingAdd.config)
          }
          setPendingAdd(null)
        }}
      />
    </div>
  )
}
