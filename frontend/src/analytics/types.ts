// Analytics Framework Types
// Frontend models matching the backend Analytics API.

// ── Grid Size ───────────────────────────────────────────────────

export interface GridSize {
  w: number
  h: number
}

// ── Widget Types ─────────────────────────────────────────────────

export type WidgetType = 'KPI' | 'BAR_CHART' | 'LINE_CHART' | 'PIE_CHART' | 'TABLE' | 'LIST' | 'ALERTS' | 'PROGRESS' | 'GAUGE' | 'HEATMAP'

// ── Dataset ──────────────────────────────────────────────────────

export interface DatasetColumn {
  name: string
  type: 'string' | 'number' | 'currency' | 'date' | 'percentage' | 'boolean'
  label?: string
  format?: string
}

export interface DatasetSummary {
  total?: number
  count?: number
  average?: number
  growth?: number
}

export interface Dataset {
  columns: DatasetColumn[]
  rows: Record<string, any>[]
  summary?: DatasetSummary
}

// ── Widget Config ────────────────────────────────────────────────

export interface WidgetConfig {
  icon?: string
  color?: string
  period?: string
  subtitle?: string
  refreshInterval?: number
  xAxis?: string
  yAxis?: string
  showLegend?: boolean
  showLabels?: boolean
  showDots?: boolean
  donut?: boolean
  showPercentages?: boolean
  visibleColumns?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  pageSize?: number
  max?: number
  min?: number
  showLabel?: boolean
  valueFormat?: 'number' | 'currency' | 'percentage'
}

// ── Widget (rendered — returned by backend) ──────────────────────

export interface Widget {
  id: string
  title: string
  type: WidgetType
  dataset: Dataset
  config?: WidgetConfig
}

// ── WidgetDefinition (catalog from backend) ─────────────────────

export interface WidgetDefinitionParam {
  key: string
  label: string
  type: 'number' | 'select' | 'boolean' | 'text'
  default?: any
  options?: { value: string; label: string }[]
  min?: number
  max?: number
}

export interface WidgetVisualizationType {
  type: WidgetType
  label: string
  icon: string
  params: WidgetDefinitionParam[]
}

export interface WidgetDefinition {
  id: string
  name: string
  description: string
  category: string
  icon: string
  compatibleTypes: WidgetVisualizationType[]
  supportedSizes: GridSize[]
  defaultSize: GridSize
}

// ── Dashboard Response ───────────────────────────────────────────

export interface DashboardResponse {
  definitions: WidgetDefinition[]
  widgets: Widget[]
}
