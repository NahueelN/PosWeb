export type UpdaterStatus = 'idle' | 'checking' | 'downloading' | 'installing' | 'error' | 'no-update'

export interface UpdaterState {
  status: UpdaterStatus
  version?: string
  errorMsg?: string
}

type UpdaterCb = (state: UpdaterState) => void
const listeners = new Set<UpdaterCb>()
let current: UpdaterState = { status: 'idle' }
let checkUpdate: (() => Promise<void>) | null = null

export function onUpdaterChange(cb: UpdaterCb) {
  listeners.add(cb)
  cb(current)
  return () => { listeners.delete(cb) }
}

function emit(next: UpdaterState) {
  current = next
  listeners.forEach(cb => cb(next))
}

function logError(msg: string) {
  try {
    const now = new Date().toISOString()
    const entry = `[${now}] ${msg}\n`
    const existing = localStorage.getItem('update_errors') ?? ''
    localStorage.setItem('update_errors', existing + entry)
  } catch { /* ignore */ }
}

function logUpdate(msg: string) {
  try {
    const now = new Date().toISOString()
    const line = `[${now}] ${msg}\n`
    const existing = localStorage.getItem('update_history') ?? ''
    localStorage.setItem('update_history', existing + line)
  } catch { /* ignore */ }
}

async function initUpdater() {
  try {
    const upMod = await import('@tauri-apps/plugin-updater')
    const invokeMod = await import('@tauri-apps/api/core')
    checkUpdate = async () => {
      emit({ status: 'checking' })
      try {
        console.log('[Updater] Checking for updates...')
        const update = await upMod.check()
        if (!update) {
          console.log('[Updater] No updates available')
          emit({ status: 'no-update' })
          return
        }
        console.log('[Updater] Nueva versión disponible:', update.version)
        emit({ status: 'downloading', version: update.version })

        try {
          console.log('[Updater] Killing posweb-backend sidecar...')
          await invokeMod.invoke('kill_sidecar')
        } catch {
          console.log('[Updater] Sidecar already stopped, skipping kill')
        }

        console.log('[Updater] Downloading and installing...')
        emit({ status: 'installing', version: update.version })
        logUpdate(`Instalando v${update.version}`)
        await update.downloadAndInstall()
        console.log('[Updater] Update installed successfully')
        emit({ status: 'idle' })
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error('[Updater] Update failed:', msg)
        console.error('[Updater] Error details:', JSON.stringify(e, Object.getOwnPropertyNames(e as object)))
        logError(`Update failed: ${msg}`)
        emit({ status: 'error', errorMsg: msg })
      }
    }
  } catch {
    console.log('[Updater] Tauri updater plugin not available (browser mode)')
  }
}

const initPromise = initUpdater()

export async function runUpdateCheck(currentVersion?: string): Promise<void> {
  await initPromise
  if (currentVersion) {
    const orig = checkUpdate!
    checkUpdate = async () => {
      try {
        logUpdate(`Buscando actualización (v${currentVersion})...`)
        await orig()
      } catch (e) {
        logError(`Update check failed: ${String(e)}`)
      }
    }
  }
  checkUpdate?.()
}
