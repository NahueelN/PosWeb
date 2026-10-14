import { describe, expect, it } from 'vitest'
import { remoteAccessView } from '../remoteAccessView'

describe('remote access view', () => {
  it('maps inactive and provisioning states to their available actions', () => {
    expect(remoteAccessView({ status: 'inactive' })).toMatchObject({
      label: 'Acceso remoto inactivo',
      tone: 'neutral',
      canActivate: true,
      canDeactivate: false,
    })
    expect(remoteAccessView({ status: 'provisioning', slug: 'kiosco-lopez' })).toMatchObject({
      label: 'Preparando acceso remoto',
      tone: 'pending',
      canActivate: false,
      canDeactivate: true,
    })
  })

  it('maps connector progress, active access, and failures with their user-facing details', () => {
    expect(remoteAccessView({ status: 'waiting_connector', connector: { state: 'starting' } })).toMatchObject({
      label: 'Esperando conexión de esta PC',
      tone: 'pending',
    })
    expect(remoteAccessView({ status: 'active', hostname: 'kiosco-lopez.vendetoweb.com.ar' })).toMatchObject({
      label: 'Acceso remoto activo',
      tone: 'success',
      canActivate: false,
      canDeactivate: true,
    })
    expect(remoteAccessView({ status: 'failed', lastError: 'No se pudo crear el túnel' })).toMatchObject({
      label: 'No se pudo activar el acceso remoto',
      tone: 'error',
      canActivate: true,
      canDeactivate: true,
    })
  })

  it('keeps actions safe when a backend returns an unknown activation status', () => {
    expect(remoteAccessView({ status: 'provisioned' } as unknown as import('../../../api/client').RemoteAccessStatus)).toMatchObject({
      label: 'Estado de acceso remoto desconocido',
      tone: 'error',
      canActivate: false,
      canDeactivate: true,
    })
  })
})
