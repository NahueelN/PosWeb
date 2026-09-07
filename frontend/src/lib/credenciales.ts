import { invoke } from '@tauri-apps/api/core'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export interface CredencialesGuardadas {
  usuario: string
  password?: string
}

// En Tauri las credenciales se guardan en el keychain del SO (Windows Credential Manager).
// En navegador (dev) se usa localStorage como fallback.

export async function obtenerCredenciales(): Promise<CredencialesGuardadas | null> {
  if (isTauri) {
    try {
      return await invoke<CredencialesGuardadas | null>('obtener_credenciales')
    } catch {
      return null
    }
  }
  const usuario = localStorage.getItem('posweb_user')
  if (!usuario) return null
  const password = localStorage.getItem('posweb_pass') ?? undefined
  return { usuario, password }
}

export async function guardarCredenciales(usuario: string, password: string | null): Promise<void> {
  if (isTauri) {
    try {
      if (password) {
        await invoke('guardar_credenciales', { usuario, password })
      } else {
        await invoke('guardar_usuario', { usuario })
      }
    } catch {
      /* keychain no disponible */
    }
    return
  }
  localStorage.setItem('posweb_user', usuario)
  if (password) localStorage.setItem('posweb_pass', password)
  else localStorage.removeItem('posweb_pass')
}

export async function borrarCredenciales(): Promise<void> {
  if (isTauri) {
    try {
      await invoke('borrar_credenciales')
    } catch {
      /* ignore */
    }
    return
  }
  localStorage.removeItem('posweb_user')
  localStorage.removeItem('posweb_pass')
}