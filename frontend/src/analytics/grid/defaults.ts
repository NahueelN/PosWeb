// Default Layout
// The initial dashboard layout when no saved state exists.
// All items have explicit x/y — RGL never computes positions.

import type { LayoutInstance } from './types'

export const DEFAULT_LAYOUT: LayoutInstance[] = [
  // ── Row 1: KPIs (3×1 each) — column 1 ──
  { id: 'v1', definitionId: 'ventas-hoy',  widgetType: 'KPI',         w: 3, h: 1, x: 1, y: 1, config: { color: 'indigo' } },
  { id: 'v2', definitionId: 'caja',        widgetType: 'KPI',         w: 3, h: 1, x: 1, y: 2, config: { color: 'emerald' } },
  { id: 'v3', definitionId: 'meta',        widgetType: 'KPI',         w: 3, h: 1, x: 1, y: 3, config: { color: 'purple' } },

  // ── Charts & Table (6×3 each) — columns 4-9 ──
  { id: 'v4', definitionId: 'ventas-semana', widgetType: 'BAR_CHART',  w: 6, h: 3, x: 4, y: 1, config: { period: '7' } },
  { id: 'v5', definitionId: 'top-productos', widgetType: 'TABLE',      w: 6, h: 3, x: 4, y: 4, config: { limit: 5 } },

  // ── Alerts + Lists (3×2 each) — columns 10, 7, 10 ──
  { id: 'v6', definitionId: 'alertas',    widgetType: 'ALERTS',        w: 3, h: 2, x: 10, y: 1, config: {} },
  { id: 'v7', definitionId: 'resumen',    widgetType: 'LIST',          w: 3, h: 2, x: 10, y: 3, config: {} },
  { id: 'v8', definitionId: 'actividad',  widgetType: 'LIST',          w: 3, h: 2, x: 7,  y: 1, config: { limit: 15 } },
]
