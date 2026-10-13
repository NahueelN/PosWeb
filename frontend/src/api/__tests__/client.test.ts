import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, isSessionExpiredError, resolveApiBase, type RemoteAccessStatus } from '../client'

function createStorage(): Storage {
  const values = new Map<string, string>()
  return {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value) },
    removeItem: key => { values.delete(key) },
    clear: () => { values.clear() },
    key: index => [...values.keys()][index] ?? null,
    get length() { return values.size },
  }
}

describe('API client session expiry', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', createStorage())
  })

  it('does not send a request with an expired token', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    localStorage.setItem('jwt_token', 'expired-token')
    localStorage.setItem('jwt_expires', new Date(Date.now() - 1).toISOString())
    localStorage.setItem('user_info', JSON.stringify({ id: 1 }))

    await expect(api.cajas.activa(1)).rejects.toSatisfy(isSessionExpiredError)

    expect(fetchMock).not.toHaveBeenCalled()
    expect(localStorage.getItem('jwt_token')).toBeNull()
    expect(localStorage.getItem('jwt_expires')).toBeNull()
    expect(localStorage.getItem('user_info')).toBeNull()
  })

  it('expires the local session when an authenticated request returns 401', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"error":"No autorizado"}', {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })))
    localStorage.setItem('jwt_token', 'valid-token')
    localStorage.setItem('jwt_expires', new Date(Date.now() + 60_000).toISOString())
    localStorage.setItem('user_info', JSON.stringify({ id: 1 }))

    await expect(api.cajas.activa(1)).rejects.toSatisfy(isSessionExpiredError)

    expect(localStorage.getItem('jwt_token')).toBeNull()
  })
})

describe('API client Tauri base URL', () => {
  it('uses the direct backend URL when Tauri loads the frontend from localhost', async () => {
    expect(resolveApiBase(true)).toBe('http://localhost:5196/api')
  })

  it('uses the same-origin proxy when running in a browser', async () => {
    expect(resolveApiBase(false)).toBe('/api')
  })
})

describe('remote access API', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', createStorage())
    vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response('{}', { status: 200 }))))
  })

  it('gets the current remote access status', async () => {
    const fetchMock = vi.mocked(fetch)
    await api.remoteAccess.status()

    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/remote-access\/status$/), expect.objectContaining({}))
  })

  it('posts normalized activation and deactivation requests', async () => {
    const fetchMock = vi.mocked(fetch)
    const status: RemoteAccessStatus = { status: 'inactive' }
    expect(status.status).toBe('inactive')

    await api.remoteAccess.activate('kiosco-lopez')
    await api.remoteAccess.deactivate()

    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.stringMatching(/\/api\/remote-access\/activate$/), expect.objectContaining({ method: 'POST', body: '{"slug":"kiosco-lopez"}' }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.stringMatching(/\/api\/remote-access\/deactivate$/), expect.objectContaining({ method: 'POST' }))
  })
})

describe('password change API', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.stubGlobal('localStorage', createStorage())
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 204 })))
  })

  it('posts only the current and new password fields', async () => {
    const fetchMock = vi.mocked(fetch)
    const request = {
      actual: String.fromCharCode(...Array.from({ length: 7 }, () => 97)),
      nueva: String.fromCharCode(...Array.from({ length: 7 }, () => 98)),
    }

    await api.auth.cambiarPassword(request)

    expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/api\/auth\/cambiar-password$/), expect.objectContaining({
      method: 'POST',
      body: JSON.stringify(request),
    }))
  })
})
