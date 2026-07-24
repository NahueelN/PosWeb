// Analytics Widget Registry
// Each widget self-describes: id, name, category, icon, and default config.
// The Dashboard discovers widgets from this registry — no hardcoded if/else.

export type WidgetCategory = 'kpi' | 'rankings' | 'alerts' | 'charts' | 'lists' | 'gauges' | 'progress'

export interface ConfigOption {
  key: string
  label: string
  type: 'number' | 'select' | 'boolean'
  options?: { value: string; label: string }[]
  default: any
  min?: number
  max?: number
}

export interface WidgetRegistration {
  id: string                     // Matches backend widget.id
  name: string                   // Display name
  description: string            // Short description
  icon: string                   // Lucide icon name
  category: WidgetCategory       // Grouping in the editor
  widgetType: string             // Backend WidgetType enum value
  defaultOrder: number           // Default position in the dashboard
  defaultEnabled: boolean        // Shown by default for new users
  configOptions: ConfigOption[]  // Available settings
}

// ─── Registry ────────────────────────────────────────────────────

export const widgetRegistry: WidgetRegistration[] = [
  // KPIs
  {
    id: 'ventas-hoy',
    name: 'Ventas de hoy',
    description: 'Total recaudado, cantidad de ventas y ticket promedio',
    icon: 'DollarSign',
    category: 'kpi',
    widgetType: 'KPI',
    defaultOrder: 1,
    defaultEnabled: true,
    configOptions: [],
  },
  {
    id: 'caja',
    name: 'Caja',
    description: 'Estado y monto inicial de la caja del día',
    icon: 'Wallet',
    category: 'kpi',
    widgetType: 'KPI',
    defaultOrder: 2,
    defaultEnabled: true,
    configOptions: [],
  },
  {
    id: 'meta',
    name: 'Meta del día',
    description: 'Progreso hacia la meta diaria de ventas',
    icon: 'Target',
    category: 'kpi',
    widgetType: 'KPI',
    defaultOrder: 3,
    defaultEnabled: true,
    configOptions: [],
  },

  // Charts
  {
    id: 'ventas-semana',
    name: 'Ventas por día',
    description: 'Gráfico de barras con las ventas de los últimos 7 días',
    icon: 'BarChart3',
    category: 'charts',
    widgetType: 'BAR_CHART',
    defaultOrder: 10,
    defaultEnabled: true,
    configOptions: [
      {
        key: 'period',
        label: 'Período',
        type: 'select',
        options: [
          { value: '7', label: 'Últimos 7 días' },
          { value: '14', label: 'Últimos 14 días' },
          { value: '30', label: 'Últimos 30 días' },
        ],
        default: '7',
      },
    ],
  },

  // Rankings
  {
    id: 'top-productos',
    name: 'Productos más vendidos',
    description: 'Ranking de los productos más vendidos del día',
    icon: 'Package',
    category: 'rankings',
    widgetType: 'TABLE',
    defaultOrder: 20,
    defaultEnabled: true,
    configOptions: [
      {
        key: 'limit',
        label: 'Cantidad de productos',
        type: 'number',
        default: 5,
        min: 3,
        max: 10,
      },
    ],
  },

  // Alerts
  {
    id: 'alertas',
    name: 'Alertas',
    description: 'Stock bajo, deudas, pedidos pendientes y estado de caja',
    icon: 'AlertTriangle',
    category: 'alerts',
    widgetType: 'ALERTS',
    defaultOrder: 30,
    defaultEnabled: true,
    configOptions: [],
  },

  // Lists
  {
    id: 'resumen',
    name: 'Resumen del día',
    description: 'Cantidad de ventas, productos y clientes atendidos',
    icon: 'ClipboardList',
    category: 'lists',
    widgetType: 'LIST',
    defaultOrder: 40,
    defaultEnabled: true,
    configOptions: [],
  },
  {
    id: 'actividad',
    name: 'Actividad reciente',
    description: 'Últimos movimientos: ventas, compras, gastos y caja',
    icon: 'Clock',
    category: 'lists',
    widgetType: 'LIST',
    defaultOrder: 50,
    defaultEnabled: true,
    configOptions: [
      {
        key: 'limit',
        label: 'Cantidad de movimientos',
        type: 'number',
        default: 15,
        min: 5,
        max: 30,
      },
    ],
  },
  {
    id: 'ultimas-ventas',
    name: 'Últimas ventas',
    description: 'Detalle de las últimas ventas realizadas',
    icon: 'Receipt',
    category: 'lists',
    widgetType: 'LIST',
    defaultOrder: 60,
    defaultEnabled: false,
    configOptions: [
      {
        key: 'limit',
        label: 'Cantidad de ventas',
        type: 'number',
        default: 8,
        min: 3,
        max: 15,
      },
    ],
  },
]

// ─── Visual type info ────────────────────────────────────────────
// Metadata about each visual type (not tied to specific widgets).
// Used by the editor to show available types when creating custom widgets.

export interface VisualTypeInfo {
  name: string
  description: string
  icon: string
  category: WidgetCategory
  defaultSize: { cols: number; rows: number }
}

export const visualTypes: VisualTypeInfo[] = [
  { name: 'KPI', description: 'Indicador numérico con tendencia', icon: 'DollarSign', category: 'kpi', defaultSize: { cols: 1, rows: 1 } },
  { name: 'BAR_CHART', description: 'Gráfico de barras', icon: 'BarChart3', category: 'charts', defaultSize: { cols: 2, rows: 2 } },
  { name: 'LINE_CHART', description: 'Gráfico de líneas', icon: 'TrendingUp', category: 'charts', defaultSize: { cols: 2, rows: 2 } },
  { name: 'PIE_CHART', description: 'Gráfico circular o donut', icon: 'PieChart', category: 'charts', defaultSize: { cols: 2, rows: 2 } },
  { name: 'TABLE', description: 'Tabla de datos', icon: 'Table', category: 'rankings', defaultSize: { cols: 2, rows: 2 } },
  { name: 'LIST', description: 'Lista de items', icon: 'List', category: 'lists', defaultSize: { cols: 1, rows: 2 } },
  { name: 'ALERTS', description: 'Lista de alertas priorizadas', icon: 'AlertTriangle', category: 'alerts', defaultSize: { cols: 1, rows: 2 } },
  { name: 'PROGRESS', description: 'Barra de progreso', icon: 'Target', category: 'progress', defaultSize: { cols: 1, rows: 1 } },
  { name: 'GAUGE', description: 'Indicador tipo velocímetro', icon: 'Gauge', category: 'gauges', defaultSize: { cols: 1, rows: 1 } },
]

// ─── Helpers ─────────────────────────────────────────────────────

export const categoryLabels: Record<WidgetCategory, string> = {
  kpi: 'Resumen del día',
  rankings: 'Rankings',
  alerts: 'Alertas',
  charts: 'Gráficos',
  lists: 'Listas',
  gauges: 'Gauges',
  progress: 'Progreso',
}

export const categoryOrder: WidgetCategory[] = ['kpi', 'charts', 'rankings', 'alerts', 'lists', 'progress', 'gauges']

export function getWidgetById(id: string): WidgetRegistration | undefined {
  return widgetRegistry.find((w) => w.id === id)
}

export function getWidgetsByCategory(category: WidgetCategory): WidgetRegistration[] {
  return widgetRegistry.filter((w) => w.category === category)
}

export function getVisualType(name: string): VisualTypeInfo | undefined {
  return visualTypes.find((vt) => vt.name === name)
}
