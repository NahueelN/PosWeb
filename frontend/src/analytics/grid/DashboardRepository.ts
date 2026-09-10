// Dashboard Repository
// Persistence layer for layout instances.
// Swappable: localStorage now, backend API later.

import type { LayoutInstance } from './types'

const STORAGE_KEY = 'dashboard-layout-v4'

export interface DashboardRepository {
  load(): LayoutInstance[]
  save(layout: LayoutInstance[]): void
  clear(): void
}

/** localStorage implementation (default for v1). */
export function createLocalStorageRepository(
  storageKey: string = STORAGE_KEY,
): DashboardRepository {
  return {
    load(): LayoutInstance[] {
      try {
        const raw = localStorage.getItem(storageKey)
        if (!raw) return []
        const parsed = JSON.parse(raw) as LayoutInstance[]
        // Migration: "meta del día" ya no viene por defecto; se puede volver a agregar desde el picker.
        return parsed.filter((i) => !(i.id === 'v3' && i.definitionId === 'meta'))
      } catch {
        return []
      }
    },

    save(layout: LayoutInstance[]): void {
      localStorage.setItem(storageKey, JSON.stringify(layout))
    },

    clear(): void {
      localStorage.removeItem(storageKey)
    },
  }
}

/** Backend API implementation (prepared, not yet wired). */
// export function createApiRepository(apiBase: string): DashboardRepository { ... }
