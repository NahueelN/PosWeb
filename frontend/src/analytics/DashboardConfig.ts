// Dashboard Configuration — persisted in localStorage per user
// Controls which widgets are enabled and their individual settings

export interface WidgetUserConfig {
  enabled: boolean
  order: number
  settings: Record<string, any>  // Per-widget config (period, limit, etc.)
}

export interface DashboardConfig {
  version: number                // For future migrations
  widgets: Record<string, WidgetUserConfig>  // key = widget id
}

// ─── Defaults ────────────────────────────────────────────────────

import { widgetRegistry } from './registry'

export function createDefaultConfig(): DashboardConfig {
  const widgets: Record<string, WidgetUserConfig> = {}

  for (const reg of widgetRegistry) {
    const settings: Record<string, any> = {}
    for (const opt of reg.configOptions) {
      settings[opt.key] = opt.default
    }

    widgets[reg.id] = {
      enabled: reg.defaultEnabled,
      order: reg.defaultOrder,
      settings,
    }
  }

  return { version: 1, widgets }
}

// ─── LocalStorage Key ────────────────────────────────────────────

const STORAGE_KEY = 'dashboard-config'

export function loadDashboardConfig(): DashboardConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultConfig()

    const saved = JSON.parse(raw) as DashboardConfig

    // Merge: add any new widgets from registry that aren't in saved config
    for (const reg of widgetRegistry) {
      if (!saved.widgets[reg.id]) {
        const settings: Record<string, any> = {}
        for (const opt of reg.configOptions) {
          settings[opt.key] = opt.default
        }
        saved.widgets[reg.id] = {
          enabled: reg.defaultEnabled,
          order: reg.defaultOrder,
          settings,
        }
      }
    }

    return saved
  } catch {
    return createDefaultConfig()
  }
}

export function saveDashboardConfig(config: DashboardConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

// ─── Derived helpers ─────────────────────────────────────────────

/** Returns enabled widget IDs sorted by order */
export function getEnabledWidgetIds(config: DashboardConfig): string[] {
  return Object.entries(config.widgets)
    .filter(([_, wc]) => wc.enabled)
    .sort(([_, a], [__, b]) => a.order - b.order)
    .map(([id]) => id)
}
