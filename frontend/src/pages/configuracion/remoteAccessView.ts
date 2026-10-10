import type { RemoteAccessStatus } from '../../api/client'

export type RemoteAccessView = {
  label: string
  tone: 'neutral' | 'pending' | 'success' | 'error'
  steps: string[]
  canActivate: boolean
  canDeactivate: boolean
}

export function remoteAccessView(status: RemoteAccessStatus): RemoteAccessView {
  switch (status.status) {
    case 'inactive':
      return { label: 'Acceso remoto inactivo', tone: 'neutral', steps: [], canActivate: true, canDeactivate: false }
    case 'provisioning':
      return { label: 'Preparando acceso remoto', tone: 'pending', steps: ['Reservando subdominio', 'Configurando tunnel'], canActivate: false, canDeactivate: true }
    case 'waiting_connector':
      return { label: 'Esperando conexión de esta PC', tone: 'pending', steps: ['Subdominio reservado', 'Tunnel configurado', 'Esperando conexión de esta PC'], canActivate: false, canDeactivate: true }
    case 'active':
      return { label: 'Acceso remoto activo', tone: 'success', steps: ['Subdominio reservado', 'Tunnel configurado', 'PC conectada', 'URL pública validada'], canActivate: false, canDeactivate: true }
    case 'failed':
      return { label: 'No se pudo activar el acceso remoto', tone: 'error', steps: [], canActivate: true, canDeactivate: true }
    default:
      return { label: 'Estado de acceso remoto desconocido', tone: 'error', steps: [], canActivate: false, canDeactivate: true }
  }
}
