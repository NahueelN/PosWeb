// Dashboard Layout Engine
// Auto-placement algorithm for fixed-capacity grid.
// Pure functions — no state, no persistence, no React.
//
// Two-pass placement:
//   Pass 1 — widgets with explicit x/y (user-placed)
//   Pass 2 — remaining widgets via greedy column-scan

import type { LayoutInstance, LayoutCell, PositionedInstance, GridSize } from './types'
import { GRID_COLS, GRID_ROWS } from './types'

// ── Collision Detection ─────────────────────────────────────────

function rectsOverlap(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

function hasOverlap(
  placed: PositionedInstance[],
  x: number, y: number, w: number, h: number,
): boolean {
  return placed.some(
    (p) => rectsOverlap(p.x, p.y, p.w, p.h, x, y, w, h),
  )
}

// ── Auto-Placement (two-pass) ───────────────────────────────────

export function computeLayout(
  instances: LayoutInstance[],
  cols: number = GRID_COLS,
  rows: number = GRID_ROWS,
): LayoutCell[] {
  const placed: PositionedInstance[] = []
  const cells: LayoutCell[] = []
  // Widgets displaced by explicit placement → re-place via greedy
  const displaced: PositionedInstance[] = []

  // Pass 1: widgets with explicit x/y — user placement always wins
  for (const inst of instances) {
    if (inst.x != null && inst.y != null) {
      const w = Math.min(inst.w, cols)
      const h = Math.min(inst.h, rows)
      const x = Math.max(1, Math.min(inst.x, cols - w + 1))
      const y = Math.max(1, Math.min(inst.y, rows - h + 1))

      // Displace any already-placed widget that overlaps
      for (let i = placed.length - 1; i >= 0; i--) {
        if (rectsOverlap(placed[i].x, placed[i].y, placed[i].w, placed[i].h, x, y, w, h)) {
          displaced.push(placed[i])
          const cellIdx = cells.findIndex((c) => c.instance.id === placed[i].id)
          if (cellIdx !== -1) cells.splice(cellIdx, 1)
          placed.splice(i, 1)
        }
      }

      const positioned: PositionedInstance = { ...inst, x, y }
      placed.push(positioned)
      cells.push({ instance: inst, x, y })
    }
  }

  // Pass 2: remaining + displaced widgets — greedy column-scan
  const greedy = [
    ...instances.filter((i) => i.x == null || i.y == null),
    ...displaced,
  ]
  for (const inst of greedy) {
    const w = Math.min(inst.w, cols)
    const h = Math.min(inst.h, rows)
    const pos = findSlot(placed, w, h, cols, rows)
    if (pos) {
      const positioned: PositionedInstance = { ...inst, x: pos.x, y: pos.y }
      placed.push(positioned)
      cells.push({ instance: inst, x: pos.x, y: pos.y })
    }
  }

  return cells
}

/** Find first available slot — column-major: fill col 1 first, then col 2, etc. */
function findSlot(
  placed: PositionedInstance[],
  w: number, h: number,
  cols: number, rows: number,
): { x: number; y: number } | null {
  for (let x = 1; x <= cols - w + 1; x++) {
    for (let y = 1; y <= rows - h + 1; y++) {
      if (!hasOverlap(placed, x, y, w, h)) {
        return { x, y }
      }
    }
  }
  return null
}

// ── Responsive Fitting ──────────────────────────────────────────
// Reflows the layout into a clean top-down arrangement for a
// reduced column count, growing rows until every widget fits.

export interface FittedLayout {
  instances: PositionedInstance[]
  rows: number
}

function findRowMajorSlot(
  placed: PositionedInstance[],
  w: number, h: number,
  cols: number, rows: number,
): { x: number; y: number } | null {
  for (let y = 1; y <= rows - h + 1; y++) {
    for (let x = 1; x <= cols - w + 1; x++) {
      if (!hasOverlap(placed, x, y, w, h)) {
        return { x, y }
      }
    }
  }
  return null
}

export function fitLayout(
  instances: LayoutInstance[],
  cols: number,
  minRows: number = GRID_ROWS,
): FittedLayout {
  const clamped: LayoutInstance[] = instances.map((i) => ({ ...i, w: Math.min(i.w, cols) }))
  // Worst case each widget gets its own row, so this always fits.
  const maxRows = minRows + instances.length

  for (let rows = minRows; rows <= maxRows; rows++) {
    const placed: PositionedInstance[] = []
    let failed = false
    for (const inst of clamped) {
      const pos = findRowMajorSlot(placed, inst.w, inst.h, cols, rows)
      if (!pos) {
        failed = true
        break
      }
      placed.push({ ...inst, x: pos.x, y: pos.y })
    }
    if (!failed) {
      return { instances: placed, rows }
    }
  }

  return { instances: [], rows: minRows }
}

// ── Position Computation (for backend API) ──────────────────────

export function computePositioned(
  instances: LayoutInstance[],
  cols: number = GRID_COLS,
): PositionedInstance[] {
  return computeLayout(instances, cols).map((cell) => ({
    ...cell.instance,
    x: cell.x,
    y: cell.y,
  }))
}

// ── Capacity Check ──────────────────────────────────────────────

/** Check if a new widget can be placed in the remaining space. */
export function canAddWidget(
  currentInstances: LayoutInstance[],
  newW: number, newH: number,
  cols: number = GRID_COLS,
  rows: number = GRID_ROWS,
): boolean {
  const w = Math.min(newW, cols)
  const h = Math.min(newH, rows)
  const positioned = computeLayout(currentInstances, cols, rows)
  const allPlaced: PositionedInstance[] = positioned.map((c) => ({
    ...c.instance,
    x: c.x,
    y: c.y,
  }))
  return findSlot(allPlaced, w, h, cols, rows) !== null
}

// ── Resize Widget ───────────────────────────────────────────────

/** Change the size of a widget and recompute all positions. */
export function resizeWidget(
  instances: LayoutInstance[],
  instanceId: string,
  newSize: GridSize,
): LayoutInstance[] {
  return instances.map((inst) =>
    inst.id === instanceId ? { ...inst, w: newSize.w, h: newSize.h } : inst,
  )
}
