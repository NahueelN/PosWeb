// Widget Instances — persisted in localStorage
// The Dashboard only knows WidgetInstances. It never knows about specific queries.

import type { WidgetInstance, WidgetType } from './types'

const STORAGE_KEY = 'dashboard-instances'

// ── Default instances (migration from old hardcoded widgets) ──────

export function getDefaultInstances(): WidgetInstance[] {
  return [
    { id: 'ventas-hoy', definitionId: 'ventas-hoy', widgetType: 'KPI', config: { color: 'indigo' }, col: 0, row: 0, width: 1, height: 1, order: 1 },
    { id: 'caja', definitionId: 'caja', widgetType: 'KPI', config: { color: 'emerald' }, col: 1, row: 0, width: 1, height: 1, order: 2 },
    { id: 'meta', definitionId: 'meta', widgetType: 'KPI', config: { color: 'purple' }, col: 2, row: 0, width: 1, height: 1, order: 3 },
    { id: 'ventas-semana', definitionId: 'ventas-semana', widgetType: 'BAR_CHART', config: { period: '7' }, col: 3, row: 0, width: 1, height: 1, order: 10 },
    { id: 'top-productos', definitionId: 'top-productos', widgetType: 'TABLE', config: { limit: 5 }, col: 4, row: 0, width: 1, height: 1, order: 20 },
    { id: 'alertas', definitionId: 'alertas', widgetType: 'ALERTS', config: {}, col: 5, row: 0, width: 1, height: 1, order: 30 },
    { id: 'resumen', definitionId: 'resumen', widgetType: 'LIST', config: {}, col: 0, row: 1, width: 1, height: 1, order: 40 },
    { id: 'actividad', definitionId: 'actividad', widgetType: 'LIST', config: { limit: 15 }, col: 1, row: 1, width: 1, height: 1, order: 50 },
  ]
}

// ── Load / Save ──────────────────────────────────────────────────

export function loadInstances(): WidgetInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultInstances()
    return JSON.parse(raw) as WidgetInstance[]
  } catch {
    return getDefaultInstances()
  }
}

export function saveInstances(instances: WidgetInstance[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(instances))
}

// ── CRUD ─────────────────────────────────────────────────────────

export function addInstance(
  instances: WidgetInstance[],
  definitionId: string,
  widgetType: WidgetType,
  config: Record<string, any> = {},
  title?: string
): WidgetInstance[] {
  const maxOrder = instances.reduce((max, i) => Math.max(max, i.order), 0)
  const newInstance: WidgetInstance = {
    id: `${definitionId}-${Date.now()}`,
    definitionId,
    widgetType,
    title,
    config,
    col: 0,
    row: 0,
    width: 1,
    height: 1,
    order: maxOrder + 1,
  }
  const next = [...instances, newInstance]
  saveInstances(next)
  return next
}

export function removeInstance(instances: WidgetInstance[], instanceId: string): WidgetInstance[] {
  const next = instances.filter((i) => i.id !== instanceId)
  saveInstances(next)
  return next
}

export function updateInstanceConfig(
  instances: WidgetInstance[],
  instanceId: string,
  config: Record<string, any>
): WidgetInstance[] {
  const next = instances.map((i) =>
    i.id === instanceId ? { ...i, config } : i
  )
  saveInstances(next)
  return next
}

export function reorderInstances(instances: WidgetInstance[], fromId: string, toId: string): WidgetInstance[] {
  const from = instances.find((i) => i.id === fromId)
  const to = instances.find((i) => i.id === toId)
  if (!from || !to) return instances

  const next = instances.map((i) => {
    if (i.id === fromId) return { ...i, order: to.order }
    if (i.id === toId) return { ...i, order: from.order }
    return i
  })
  saveInstances(next)
  return next
}

export function resetToDefaults(): WidgetInstance[] {
  const defaults = getDefaultInstances()
  saveInstances(defaults)
  return defaults
}
