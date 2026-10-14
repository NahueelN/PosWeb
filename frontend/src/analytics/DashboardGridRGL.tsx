import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import ReactGridLayout from 'react-grid-layout/legacy'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './grid/dashboard-grid.css'
import type { EventCallback, LayoutItem } from 'react-grid-layout'
import type { LayoutInstance } from './grid/types'
import { ROW_HEIGHT_PX } from './grid/types'
import WidgetRenderer from './WidgetRenderer'
import WidgetInlineControls from './WidgetInlineControls'
import type { Widget, WidgetDefinition, WidgetDefinitionParam } from './types'
import { Trash2, Maximize2, GripVertical } from 'lucide-react'

interface Props {
  layout: LayoutInstance[]
  widgets: Widget[]
  definitions: WidgetDefinition[]
  gridCols: number
  rows: number
  onRemove?: (instanceId: string) => void
  onEdit?: (instanceId: string) => void
  onLayoutChange?: (layout: LayoutInstance[]) => void
  onConfigChange?: (instanceId: string, patch: Record<string, any>) => void
  updatingId?: string | null
  reorganizing?: boolean
}

function compactBidirectional(items: LayoutInstance[], cols: number, maxRows: number): LayoutInstance[] {
  const grid = Array.from({ length: maxRows }, () => new Array(cols).fill(false))

  const sorted = [...items].sort((a, b) => (b.w * b.h) - (a.w * a.h))

  const compacted: LayoutInstance[] = []

  for (const item of sorted) {
    let placed = false
    for (let y = 0; y <= maxRows - item.h && !placed; y++) {
      for (let x = 0; x <= cols - item.w && !placed; x++) {
        let fits = true
        for (let dy = 0; dy < item.h && fits; dy++) {
          for (let dx = 0; dx < item.w && fits; dx++) {
            if (grid[y + dy][x + dx]) fits = false
          }
        }
        if (fits) {
          compacted.push({ ...item, x: x + 1, y: y + 1 })
          for (let dy = 0; dy < item.h; dy++) {
            for (let dx = 0; dx < item.w; dx++) {
              grid[y + dy][x + dx] = true
            }
          }
          placed = true
        }
      }
    }
    if (!placed) {
      // No hay espacio dentro de maxRows: conservar la posición original
      // (ya era no-solapada) en lugar de generar superposiciones.
      compacted.push(item)
    }
  }

  return compacted
}

export default function DashboardGridRGL({
  layout, widgets, definitions, gridCols, rows,
  onRemove, onEdit, onLayoutChange, onConfigChange, updatingId, reorganizing = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const onLayoutChangeRef = useRef(onLayoutChange)
  onLayoutChangeRef.current = onLayoutChange

  const [exiting, setExiting] = useState<Set<string>>(new Set())
  const exitingRef = useRef(exiting)
  exitingRef.current = exiting
  const firstRender = useRef(true)
  useEffect(() => { firstRender.current = false }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function measure() {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.getBoundingClientRect().width)
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [])

  const MARGIN_Y = 8
  const rowHeight = ROW_HEIGHT_PX

  // Altura del contenedor según el contenido real del layout, crece para permitir scroll.
  // Se reservan filas extra al final para que el drag tenga espacio libre (sin "bloqueos").
  const EXTRA_DRAG_ROWS = 2
  const contentHeight = useMemo(() => {
    const maxRow = layout.reduce((m, i) => Math.max(m, (i.y ?? 1) + i.h - 1), 1)
    const capped = Math.max(1, Math.min(maxRow, rows))
    return (capped + EXTRA_DRAG_ROWS) * (rowHeight + MARGIN_Y) + MARGIN_Y
  }, [layout, rows])

  const defMap = useMemo(() => {
    const m = new Map<string, WidgetDefinition>()
    for (const d of definitions) m.set(d.id, d)
    return m
  }, [definitions])

  // Parámetros "inline" por fuente: configuran directamente desde la card.
  const inlineParamsByDef = useMemo(() => {
    const m = new Map<string, WidgetDefinitionParam[]>()
    for (const d of definitions) {
      const seen = new Set<string>()
      const params: WidgetDefinitionParam[] = []
      for (const t of d.compatibleTypes) {
        for (const p of t.params) {
          if (p.inline && !seen.has(p.key)) {
            seen.add(p.key)
            params.push(p)
          }
        }
      }
      m.set(d.id, params)
    }
    return m
  }, [definitions])

  const rglLayout: LayoutItem[] = useMemo(() => {
    const result = layout.map((inst) => {
      const def = defMap.get(inst.definitionId)
      const supportedW = def?.supportedSizes?.map(s => s.w) ?? []
      const supportedH = def?.supportedSizes?.map(s => s.h) ?? []
      return {
        i: inst.id,
        x: inst.x! - 1,
        y: inst.y! - 1,
        w: inst.w,
        h: inst.h,
        minW: supportedW.length > 0 ? Math.min(...supportedW, gridCols) : undefined,
        minH: supportedH.length > 0 ? Math.min(...supportedH) : undefined,
      }
    })
    console.log('[RGL] rglLayout computed', result.map(r => `${r.i}(${r.x},${r.y} ${r.w}x${r.h} min=${r.minW}x${r.minH})`).join(' '))
    return result
  }, [layout, defMap, gridCols])

  const handleDragStop: EventCallback = useCallback((_newLayout) => {
    const newLayout = _newLayout as LayoutItem[]
    console.log('[RGL] onDragStop:', newLayout.map(i => `${i.i}(${i.x},${i.y} ${i.w}x${i.h})`).join(' '))
    const newInstances = newLayout.map((item) => {
      const existing = layout.find((i) => i.id === item.i)
      return {
        id: item.i,
        definitionId: existing?.definitionId ?? '',
        widgetType: existing?.widgetType ?? '',
        w: item.w,
        h: item.h,
        config: existing?.config ?? {},
        x: item.x + 1,
        y: item.y + 1,
      }
    })
    const compacted = compactBidirectional(newInstances, gridCols, rows)
    onLayoutChangeRef.current?.(compacted)
  }, [layout, gridCols, rows])

  const handleResizeStop: EventCallback = useCallback((_newLayout) => {
    const newLayout = _newLayout as LayoutItem[]
    console.log('[RGL] onResizeStop:', newLayout.map(i => `${i.i}(${i.x},${i.y} ${i.w}x${i.h})`).join(' '))
    const newInstances = newLayout.map((item) => {
      const existing = layout.find((i) => i.id === item.i)
      return {
        id: item.i,
        definitionId: existing?.definitionId ?? '',
        widgetType: existing?.widgetType ?? '',
        w: item.w,
        h: item.h,
        config: existing?.config ?? {},
        x: item.x + 1,
        y: item.y + 1,
      }
    })
    const compacted = compactBidirectional(newInstances, gridCols, rows)
    onLayoutChangeRef.current?.(compacted)
  }, [layout, gridCols, rows])

  const handleRemoveLocal = useCallback((instanceId: string) => {
    if (exitingRef.current.has(instanceId)) return
    setExiting((prev) => new Set(prev).add(instanceId))
  }, [])

  const widgetMap = useMemo(() => {
    const m = new Map<string, Widget>()
    for (const w of widgets) m.set(w.id, w)
    return m
  }, [widgets])

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: contentHeight }}>
      <ReactGridLayout
        autoSize={false}
        style={{ height: '100%' }}
        layout={rglLayout}
        width={containerWidth}
        cols={gridCols}
        rowHeight={rowHeight}
        maxRows={rows}
        margin={[8, 8]}
        containerPadding={[0, 0]}
        compactType="vertical"
        preventCollision={false}
        allowOverlap={false}
        isDraggable={reorganizing}
        isResizable={reorganizing}
        useCSSTransforms
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
      >
        {layout.map((inst) => {
          const widget = widgetMap.get(inst.id)
          return (
            <div
              key={inst.id}
              className={`group relative rounded-xl min-h-0 min-w-0 ${reorganizing ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              {/* Afordance de arrastre: solo visible en modo reorganizar */}
              <div className={`pointer-events-none absolute top-2 left-2 z-20 transition-opacity ${reorganizing ? 'opacity-90' : 'hidden'}`}>
                <div className="w-5 h-5 flex items-center justify-center rounded-md bg-black/[0.03]">
                  <GripVertical size={11} className="text-gray-400" />
                </div>
              </div>

              {onEdit && (
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onEdit(inst.id) }}
                  className="absolute top-2 right-2 z-20 transition-opacity"
                >
                  <div className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-indigo-50 transition-colors">
                    <Maximize2 size={10} className="text-gray-300 hover:text-indigo-500" />
                  </div>
                </button>
              )}

              {onRemove && (
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); handleRemoveLocal(inst.id) }}
                  className="absolute top-2 right-2 z-20 transition-opacity"
                  style={{ right: onEdit ? '32px' : undefined }}
                >
                  <div className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-red-50 transition-colors">
                    <Trash2 size={10} className="text-gray-300 hover:text-red-400" />
                  </div>
                </button>
              )}

              <motion.div
                className={`h-full min-h-0 min-w-0 bg-white rounded-2xl border border-slate-200/70 shadow-card overflow-hidden ${
                updatingId === inst.id ? 'opacity-70 transition-opacity duration-200' : ''
              }`}
                initial={firstRender.current ? false : { opacity: 0, scale: 0.95, y: 8 }}
                animate={
                  exiting.has(inst.id)
                    ? { opacity: 0, scale: 0.95, y: -8 }
                    : { opacity: 1, scale: 1, y: 0 }
                }
                whileHover={{ y: -2, boxShadow: '0 4px 14px oklch(0 0 0 / 0.08), 0 1px 3px oklch(0 0 0 / 0.04)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.8 }}
                onAnimationComplete={() => {
                  if (exiting.has(inst.id)) {
                    setTimeout(() => {
                      setExiting((prev) => {
                        const n = new Set(prev)
                        n.delete(inst.id)
                        return n
                      })
                      onRemove?.(inst.id)
                    }, 50)
                  }
                }}
              >
                {widget ? (
                  <WidgetRenderer widget={widget} />
                ) : (
                  <div className="flex items-center justify-center text-gray-300 h-full">
                    <span className="text-xs text-gray-400 font-medium">Cargando…</span>
                  </div>
                )}
              </motion.div>

              {onConfigChange && (inlineParamsByDef.get(inst.definitionId)?.length ?? 0) > 0 && (
                <div
                  className="absolute top-3.5 right-28 z-30"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <WidgetInlineControls
                    params={inlineParamsByDef.get(inst.definitionId) ?? []}
                    config={inst.config ?? {}}
                    onConfigChange={(patch) => onConfigChange(inst.id, patch)}
                  />
                </div>
              )}

              {updatingId === inst.id && (
                <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
                  <div className="w-6 h-6 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin bg-white/50" />
                </div>
              )}
            </div>
          )
        })}
      </ReactGridLayout>
    </div>
  )
}
