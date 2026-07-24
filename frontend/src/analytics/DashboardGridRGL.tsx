import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import ReactGridLayout from 'react-grid-layout/legacy'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import './grid/dashboard-grid.css'
import type { Layout as RGLLayout, ItemCallback } from 'react-grid-layout/legacy'
import type { LayoutInstance } from './grid/types'
import { GRID_ROWS } from './grid/types'
import WidgetRenderer from './WidgetRenderer'
import type { Widget, WidgetDefinition } from './types'
import { Trash2, Maximize2, GripVertical } from 'lucide-react'

interface Props {
  layout: LayoutInstance[]
  widgets: Widget[]
  definitions: WidgetDefinition[]
  gridCols: number
  onRemove?: (instanceId: string) => void
  onEdit?: (instanceId: string) => void
  onLayoutChange?: (layout: LayoutInstance[]) => void
}

export default function DashboardGridRGL({
  layout, widgets, definitions, gridCols,
  onRemove, onEdit, onLayoutChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(0)
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
        const rect = containerRef.current!.getBoundingClientRect()
        setContainerHeight(rect.height)
        setContainerWidth(rect.width)
      }
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [])

  const MARGIN_Y = 8
  const rowHeight = useMemo(
    () => (containerHeight > 0
      ? Math.floor((containerHeight - (GRID_ROWS - 1) * MARGIN_Y) / GRID_ROWS)
      : 80),
    [containerHeight],
  )

  const defMap = useMemo(() => {
    const m = new Map<string, WidgetDefinition>()
    for (const d of definitions) m.set(d.id, d)
    return m
  }, [definitions])

  const rglLayout: RGLLayout[] = useMemo(() => {
    const result = layout.map((inst) => {
      const def = defMap.get(inst.definitionId)
      const supportedW = def?.supportedSizes?.map(s => s.w) ?? []
      const supportedH = def?.supportedSizes?.map(s => s.h) ?? []
      return {
        i: inst.id,
        x: inst.x - 1,
        y: inst.y - 1,
        w: inst.w,
        h: inst.h,
        minW: supportedW.length > 0 ? Math.min(...supportedW) : undefined,
        minH: supportedH.length > 0 ? Math.min(...supportedH) : undefined,
      }
    })
    console.log('[RGL] rglLayout computed', result.map(r => `${r.i}(${r.x},${r.y} ${r.w}x${r.h} min=${r.minW}x${r.minH})`).join(' '))
    return result
  }, [layout, defMap])

  const handleDragStop: ItemCallback = useCallback((_newLayout, _oldItem, _newItem, _placeholder, e) => {
    console.log('[RGL] onDragStop:', _newLayout.map(i => `${i.i}(${i.x},${i.y} ${i.w}x${i.h})`).join(' '))
    const newInstances = _newLayout.map((item) => {
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
    onLayoutChangeRef.current?.(newInstances)
  }, [layout])

  const handleResizeStop: ItemCallback = useCallback((_newLayout, _oldItem, _newItem, _placeholder, e) => {
    console.log('[RGL] onResizeStop:', _newLayout.map(i => `${i.i}(${i.x},${i.y} ${i.w}x${i.h})`).join(' '))
    const newInstances = _newLayout.map((item) => {
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
    onLayoutChangeRef.current?.(newInstances)
  }, [layout])

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
    <div ref={containerRef} className="relative w-full h-full min-h-0 overflow-hidden">
      <ReactGridLayout
        autoSize={false}
        style={{ height: '100%' }}
        layout={rglLayout}
        width={containerWidth}
        cols={gridCols}
        rowHeight={rowHeight}
        maxRows={GRID_ROWS}
        margin={[8, 8]}
        containerPadding={[0, 0]}
        compactType={null}
        preventCollision={false}
        allowOverlap={false}
        isBounded
        useCSSTransforms
        draggableHandle=".widget-drag-handle"
        onDragStop={handleDragStop}
        onResizeStop={handleResizeStop}
      >
        {layout.map((inst) => {
          const widget = widgetMap.get(inst.id)
          return (
            <div key={inst.id} className="group relative rounded-xl min-h-0 min-w-0">
              {/* Drag handle — always visible so widgets feel draggable */}
              {onRemove && (
                <div className="widget-drag-handle absolute top-2 left-2 z-20 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 transition-opacity">
                  <div className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-black/5 transition-colors">
                    <GripVertical size={11} className="text-gray-400" />
                  </div>
                </div>
              )}

              {onEdit && (
                <button
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
                className="h-full min-h-0 min-w-0 bg-white rounded-xl border border-gray-300 shadow-card overflow-hidden"
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
            </div>
          )
        })}
      </ReactGridLayout>
    </div>
  )
}
