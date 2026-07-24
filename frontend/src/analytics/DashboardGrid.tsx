// Dashboard Grid — Fixed-capacity layout renderer.
// Renders widgets on a CSS Grid using auto-computed positions.
// During drag: floating clone follows cursor, widgets slide via FLIP.

import { useMemo, useEffect, useState, useRef } from 'react'
import type { LayoutInstance } from './grid/types'
import { GRID_ROWS } from './grid/types'
import { GridEngine } from './grid'
import { useGridAnimation } from './grid'
import WidgetRenderer from './WidgetRenderer'
import type { Widget } from './types'
import { Trash2, Maximize2, GripVertical } from 'lucide-react'

interface Props {
  layout: LayoutInstance[]
  widgets: Widget[]
  definitions: Array<{ id: string; name: string }>
  gridCols: number
  onRemove?: (instanceId: string) => void
  onEdit?: (instanceId: string) => void
  onReorderStart?: (e: React.MouseEvent, instanceId: string) => void
  onReorderAtCell?: (col: number, row: number) => void
  onReorderEnd?: () => void
  isDragging?: boolean
  dragWidgetId?: string | null
  onDragEnd?: () => void
}

export default function DashboardGrid({
  layout, widgets, definitions, gridCols,
  onRemove, onEdit,
  onReorderStart, onReorderAtCell, onReorderEnd,
  isDragging = false,
  dragWidgetId = null,
  onDragEnd,
}: Props) {
  const cells = useMemo(
    () => GridEngine.computeLayout(layout, gridCols),
    [layout, gridCols],
  )

  // FLIP animations — always enabled (capturePositions reads clean positions)
  useGridAnimation()

  // ── Floating clone refs ──
  const gridRef = useRef<HTMLDivElement>(null)
  const cloneRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number>(0)
  const grabOffset = useRef({ x: 0, y: 0 })
  const grabCellOffset = useRef({ x: 0, y: 0 })

  // Track which cell the cursor is over (for visual highlight)
  const [overlayTarget, setOverlayTarget] = useState<{ col: number; row: number } | null>(null)

  // ── Floating clone: follow cursor via ref + rAF (no React re-renders) ──
  useEffect(() => {
    if (!dragWidgetId) {
      return
    }

    // Position clone from widget's current DOM rect on drag start
    if (cloneRef.current) {
      const widgetEl = document.querySelector<HTMLElement>(`[data-widget-id="${dragWidgetId}"]`)
      if (widgetEl) {
        const r = widgetEl.getBoundingClientRect()
        cloneRef.current.style.left = `${r.left}px`
        cloneRef.current.style.top = `${r.top}px`
        cloneRef.current.style.width = `${r.width}px`
        cloneRef.current.style.height = `${r.height}px`
      }
    }

    function onMove(e: MouseEvent) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        // Position clone at cursor (maintaining grab offset)
        if (cloneRef.current) {
          cloneRef.current.style.left = `${e.clientX - grabOffset.current.x}px`
          cloneRef.current.style.top = `${e.clientY - grabOffset.current.y}px`
        }

        // Compute target cell from cursor position
        if (gridRef.current) {
          const gRect = gridRef.current.getBoundingClientRect()
          const x = e.clientX - gRect.left
          const y = e.clientY - gRect.top
          const rowHeight = gRect.height / GRID_ROWS
          const hoveredCol = Math.max(1, Math.min(gridCols, Math.floor(x / (gRect.width / gridCols)) + 1))
          const hoveredRow = Math.max(1, Math.min(GRID_ROWS, Math.floor(y / rowHeight) + 1))
          const col = Math.max(1, Math.min(gridCols, hoveredCol - grabCellOffset.current.x))
          const row = Math.max(1, Math.min(GRID_ROWS, hoveredRow - grabCellOffset.current.y))

          setOverlayTarget({ col, row })
          onReorderAtCell?.(col, row)
        }
      })
    }

    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [dragWidgetId, gridCols, onReorderAtCell])

  function handleOverlayMouseLeave() {
    if (!isDragging) setOverlayTarget(null)
  }

  // Cleanup when drag ends
  useEffect(() => {
    if (!isDragging) setOverlayTarget(null)
  }, [isDragging])

  // ── Floating clone widget ──
  const cloneWidget = dragWidgetId ? widgets.find((w) => w.id === dragWidgetId) : null

  return (
    <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Main grid */}
      <div
        ref={gridRef}
        className="grid gap-1 sm:gap-2 lg:gap-3 overflow-hidden flex-1 min-h-0"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
        }}
      >
        {cells.map((cell) => {
          const widget = widgets.find((w) => w.id === cell.instance.id)
          const isBeingDragged = dragWidgetId === cell.instance.id

          return (
            <div
              key={cell.instance.id}
              data-widget-id={cell.instance.id}
              onMouseDown={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                grabOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
                if (gridRef.current) {
                  const gRect = gridRef.current.getBoundingClientRect()
                  const colWidth = gRect.width / gridCols
                  const rowHeight = gRect.height / GRID_ROWS
                  grabCellOffset.current = {
                    x: Math.max(0, Math.min(cell.instance.w - 1, Math.floor((e.clientX - rect.left) / colWidth))),
                    y: Math.max(0, Math.min(cell.instance.h - 1, Math.floor((e.clientY - rect.top) / rowHeight))),
                  }
                }
                onReorderStart?.(e, cell.instance.id)
              }}
              onMouseUp={onReorderEnd}
              style={{
                gridColumn: `${cell.x} / span ${cell.instance.w}`,
                gridRow: `${cell.y} / span ${cell.instance.h}`,
                opacity: isBeingDragged ? 0.25 : 1,
                transition: isDragging ? 'none' : undefined,
              }}
              className={`relative group rounded-xl min-h-0 min-w-0 ${
                isBeingDragged
                  ? 'cursor-grabbing'
                  : 'cursor-grab active:cursor-grabbing'
              }`}
            >
              {/* Grip handle */}
              {onReorderStart && !isBeingDragged && (
                <div className="absolute top-1.5 left-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-white/90 border border-gray-200 rounded-md p-0.5 shadow-sm">
                    <GripVertical size={12} className="text-gray-400" />
                  </div>
                </div>
              )}

              {/* Edit button */}
              {onEdit && !isBeingDragged && (
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onEdit(cell.instance.id) }}
                  className="absolute top-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div className="bg-white/90 border border-gray-200 rounded-md p-0.5 shadow-sm hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                    <Maximize2 size={11} className="text-gray-400 hover:text-indigo-500" />
                  </div>
                </button>
              )}

              {/* Remove button */}
              {onRemove && !isBeingDragged && (
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); onRemove(cell.instance.id) }}
                  className="absolute top-1.5 right-1.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ right: onEdit ? '28px' : undefined }}
                >
                  <div className="bg-white/90 border border-gray-200 rounded-md p-0.5 shadow-sm hover:bg-red-50 hover:border-red-200 transition-colors">
                    <Trash2 size={11} className="text-gray-400 hover:text-red-500" />
                  </div>
                </button>
              )}

              {/* Widget content */}
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
      </div>

      {/* Grid template overlay — shows drop target during drag */}
      {isDragging && (
        <div
          className="grid gap-1 sm:gap-2 lg:gap-3 absolute inset-0 pointer-events-none h-full min-h-0"
          style={{
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${GRID_ROWS}, minmax(0, 1fr))`,
            zIndex: 30,
          }}
          onMouseLeave={handleOverlayMouseLeave}
        >
          {Array.from({ length: GRID_ROWS }, (_, row) =>
            Array.from({ length: gridCols }, (_, col) => {
              const colIdx = col + 1
              const rowIdx = row + 1
              const key = `${colIdx}-${rowIdx}`

              const isTarget = overlayTarget?.col === colIdx && overlayTarget?.row === rowIdx

              return (
                <div
                  key={key}
                  style={{
                    gridColumn: `${colIdx} / span 1`,
                    gridRow: `${rowIdx} / span 1`,
                  }}
                  onMouseUp={(e) => { e.stopPropagation(); onDragEnd?.() }}
                  className={`rounded-lg transition-all duration-150 pointer-events-auto border-2 ${
                    isTarget
                      ? 'bg-indigo-100/50 border-indigo-400 shadow-sm'
                      : 'border-gray-300/50'
                  }`}
                />
              )
            }),
          )}
        </div>
      )}

      {/* Floating clone — follows cursor during drag */}
      {dragWidgetId && cloneWidget && (
        <div
          ref={cloneRef}
          className="pointer-events-none"
          style={{
            position: 'fixed',
            zIndex: 1000,
            opacity: 0.92,
            transform: 'scale(1.03) rotate(1.5deg)',
            boxShadow: '0 16px 32px rgba(0,0,0,0.16), 0 6px 12px rgba(0,0,0,0.10)',
            borderRadius: '12px',
            transition: 'transform 120ms ease-out, box-shadow 120ms ease-out',
          }}
        >
          <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <WidgetRenderer widget={cloneWidget} />
          </div>
        </div>
      )}
    </div>
  )
}
