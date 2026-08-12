// Default Layout
// The initial dashboard layout when no saved state exists.
// All items have explicit x/y — RGL never computes positions.
// Designed to tile the full 12x6 grid with zero empty cells:
//   Row 1    → hero KPI (6w) + 2 compact KPIs (fills cols 1-12)
//   Rows 2-4 → sales chart (6x3) + best sellers (6x3) side by side
//   Rows 5-6 → activity feed (6x2) + alerts + day summary (3x2 each)

import type { LayoutInstance } from './types'

export const DEFAULT_LAYOUT: LayoutInstance[] = [
  // ── Row 1: Hero metric (6w) + two compact KPIs ──
  { id: 'v1', definitionId: 'ventas-hoy',   widgetType: 'KPI',      w: 6, h: 1, x: 1,  y: 1, config: { color: 'indigo' } },
  { id: 'v2', definitionId: 'caja',         widgetType: 'KPI',      w: 3, h: 1, x: 7,  y: 1, config: { color: 'emerald' } },
  { id: 'v3', definitionId: 'meta',         widgetType: 'KPI',      w: 3, h: 1, x: 10, y: 1, config: { color: 'purple' } },

  // ── Rows 2-4: Primary chart (left) + ranking (right), equal 6x3 ──
  { id: 'v5', definitionId: 'ventas-semana', widgetType: 'BAR_CHART', w: 6, h: 3, x: 1, y: 2, config: { period: '7' } },
  { id: 'v6', definitionId: 'top-productos', widgetType: 'TABLE',     w: 6, h: 3, x: 7, y: 2, config: { limit: 5 } },

  // ── Rows 5-6: Activity feed (6w) + alerts + day summary ──
  { id: 'v8', definitionId: 'actividad',  widgetType: 'LIST',    w: 6, h: 2, x: 1,  y: 5, config: { limit: 15 } },
  { id: 'v4', definitionId: 'alertas',    widgetType: 'ALERTS',  w: 3, h: 2, x: 7,  y: 5, config: {} },
  { id: 'v7', definitionId: 'resumen',    widgetType: 'LIST',    w: 3, h: 2, x: 10, y: 5, config: {} },
]