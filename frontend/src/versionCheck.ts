const VERSION_KEY = 'app_version'
const UPDATE_LOG_KEY = 'update_history'

let currentVersion = ''

function isTauri(): boolean {
  return !!(window as any).__TAURI__
}

async function getAppVersion(): Promise<string> {
  if (!isTauri()) return ''
  try {
    const appMod = await import('@tauri-apps/api/app')
    return appMod.getVersion()
  } catch {
    return ''
  }
}

function logUpdate(entry: string) {
  try {
    const now = new Date().toISOString()
    const line = `[${now}] ${entry}\n`
    const existing = localStorage.getItem(UPDATE_LOG_KEY) ?? ''
    localStorage.setItem(UPDATE_LOG_KEY, existing + line)
  } catch { /* ignore */ }
}

async function clearWebCaches() {
  try {
    const regs = await navigator.serviceWorker.getRegistrations()
    await Promise.all(regs.map(r => r.unregister()))
    console.log('[VersionCheck] Service workers unregistered')
  } catch { /* ignore */ }

  try {
    const keys = await caches.keys()
    await Promise.all(keys.map(k => caches.delete(k)))
    console.log('[VersionCheck] Cache storage cleared')
  } catch { /* ignore */ }
}

export async function initVersionCheck(): Promise<void> {
  currentVersion = await getAppVersion()
  if (!currentVersion) return

  const stored = localStorage.getItem(VERSION_KEY)

  if (!stored) {
    logUpdate(`Primer inicio detectado — v${currentVersion}`)
    localStorage.setItem(VERSION_KEY, currentVersion)
    return
  }

  if (stored !== currentVersion) {
    console.log(`[VersionCheck] Version changed: ${stored} → ${currentVersion}. Clearing caches...`)
    logUpdate(`Actualización: v${stored} → v${currentVersion}`)
    await clearWebCaches()
    localStorage.setItem(VERSION_KEY, currentVersion)
  }
}

export function getCurrentVersion(): string {
  return currentVersion
}
