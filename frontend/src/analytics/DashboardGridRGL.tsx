import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import ReactGridLayout from 'react-grid-layout/legacy'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
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
            <div key={inst.id} className="group relative rounded-xl min-h-0 min-w-0 overflow-hidden">
              {onRemove && (
                <div className="widget-drag-handle absolute top-1.5 left-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                  <div className="bg-white/90 border border-gray-200 rounded-md p-0.5 shadow-sm">
                    <GripVertical size={12} className="text-gray-400" />
                  </div>
                </div>
              )}

              {onEdit && (
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(inst.id) }}
                  className="absolute top-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="bg-white/90 border border-gray-200 rounded-md p-0.5 shadow-sm hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                    <Maximize2 size={11} className="text-gray-400 hover:text-indigo-500" />
                  </div>
                </button>
              )}

              {onRemove && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(inst.id) }}
                  className="absolute top-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ right: onEdit ? '28px' : undefined }}
                >
                  <div className="bg-white/90 border border-gray-200 rounded-md p-0.5 shadow-sm hover:bg-red-50 hover:border-red-200 transition-colors">
                    <Trash2 size={11} className="text-gray-400 hover:text-red-500" />
                  </div>
                </button>
              )}

              <div className="h-full min-h-0 min-w-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {widget ? (
                  <WidgetRenderer widget={widget} />
                ) : (
                  <div className="flex items-center justify-center text-gray-300 h-full">
                    <span className="text-xs">Cargando…</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </ReactGridLayout>
    </div>
  )
}
