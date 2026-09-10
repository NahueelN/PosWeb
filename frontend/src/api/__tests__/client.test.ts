import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, isSessionExpiredError } from '../client'

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
