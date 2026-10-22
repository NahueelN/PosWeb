// Dashboard Repository
// Persistence layer for dashboard tabs.
// Swappable: localStorage now, backend API later.

import type { LayoutInstance, DashboardTab } from './types'

const TABS_KEY = 'dashboard-tabs-v1'
const LEGACY_KEY = 'dashboard-layout-v4'

export const MAX_TABS = 5

export interface DashboardTabsRepository {
  load(): DashboardTab[]
  save(tabs: DashboardTab[]): void
  clear(): void
}

/**
 * Migraciones por tab: elimina widgets que ya no vienen por defecto.
 */
function migrateLayout(layout: LayoutInstance[]): LayoutInstance[] {
  // "meta del día" ya no viene por defecto; se puede volver a agregar desde el picker.
  return layout.filter((i) => !(i.id === 'v3' && i.definitionId === 'meta'))
}

function isTab(value: unknown): value is DashboardTab {
  const t = value as DashboardTab
  return (
    typeof t?.id === 'string' &&
    typeof t?.title === 'string' &&
    Array.isArray(t?.layout)
  )
}

/** localStorage implementation. */
export function createLocalStorageTabsRepository(): DashboardTabsRepository {
  return {
    load(): DashboardTab[] {
      // Formato nuevo: array de pestañas.
      try {
        const rawTabs = localStorage.getItem(TABS_KEY)
        if (rawTabs) {
          const parsed = JSON.parse(rawTabs) as unknown
          if (Array.isArray(parsed)) {
            return parsed
              .filter(isTab)
              .map((t) => ({
                id: t.id,
                title: t.title,
                layout: migrateLayout(t.layout),
              }))
              .slice(0, MAX_TABS)
          }
        }
      } catch {
        /* ignore */
      }

      // Formato legacy (v4): array de LayoutInstance -> una única pestaña.
      try {
        const rawLegacy = localStorage.getItem(LEGACY_KEY)
        if (rawLegacy) {
          const parsed = JSON.parse(rawLegacy) as unknown
          if (Array.isArray(parsed)) {
            const layout = migrateLayout(parsed as LayoutInstance[])
            const tabs: DashboardTab[] = [
              { id: 'tab-inicio', title: 'Inicio', layout },
            ]
            localStorage.setItem(TABS_KEY, JSON.stringify(tabs))
            return tabs
          }
        }
      } catch {
        /* ignore */
      }

      return []
    },

    save(tabs: DashboardTab[]): void {
      localStorage.setItem(TABS_KEY, JSON.stringify(tabs.slice(0, MAX_TABS)))
    },

    clear(): void {
      localStorage.removeItem(TABS_KEY)
    },
  }
}

/** Backend API implementation (prepared, not yet wired). */
// export function createApiTabsRepository(apiBase: string): DashboardTabsRepository { ... }