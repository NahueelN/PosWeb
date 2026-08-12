// Dashboard Grid Types
// Fixed-capacity layout model with auto-placement.
// User adds/removes widgets; engine computes positions.

// ── Grid Size ───────────────────────────────────────────────────

export interface GridSize {
  w: number
  h: number
}

export function gridSizeKey(s: GridSize): string {
  return `${s.w}x${s.h}`
}

export function sameSize(a: GridSize, b: GridSize): boolean {
  return a.w === b.w && a.h === b.h
}

// ── Standard Sizes (centralized presets) ────────────────────────

export const STANDARD_SIZES: Record<string, GridSize> = {
  '3x1': { w: 3, h: 1 },
  '3x2': { w: 3, h: 2 },
  '3x3': { w: 3, h: 3 },
  '6x1': { w: 6, h: 1 },
  '6x2': { w: 6, h: 2 },
  '6x3': { w: 6, h: 3 },
}

// ── Dashboard Grid Constants ────────────────────────────────────

export const GRID_COLS = 12
export const GRID_ROWS = 6
export const ROW_HEIGHT_PX = 80

// ── Layout Instance (persisted) ────────────────────────────────
// x/y are optional placement hints. When set, engine places widget there.
// When unset, engine uses greedy row-scan.

export interface LayoutInstance {
  id: string
  definitionId: string
  widgetType: string
  w: number       // columns wide (3 or 6 only)
  h: number       // rows tall (1..6)
  config: Record<string, any>
  x?: number      // explicit column (1-indexed). Engine respects if set.
  y?: number      // explicit row (1-indexed). Engine respects if set.
}

// ── Positioned Instance (computed — sent to backend) ────────────

export interface PositionedInstance extends LayoutInstance {
  x: number
  y: number
}

// ── Computed Layout Cell (for rendering) ────────────────────────

export interface LayoutCell {
  instance: LayoutInstance
  x: number
  y: number
}

// ── Responsive Breakpoints ──────────────────────────────────────

export interface BreakpointColumns {
  sm: number  // < 640px
  md: number  // 640-1024px
  lg: number  // 1024-1280px
  xl: number  // >= 1280px
}

export const BREAKPOINT_COLUMNS: BreakpointColumns = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
}

export function columnsForWidth(width: number): number {
  if (width < 640) return BREAKPOINT_COLUMNS.sm
  if (width < 1024) return BREAKPOINT_COLUMNS.md
  if (width < 1280) return BREAKPOINT_COLUMNS.lg
  return BREAKPOINT_COLUMNS.xl
}
