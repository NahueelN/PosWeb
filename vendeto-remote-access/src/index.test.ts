import { afterEach, describe, expect, it } from 'vitest'
import worker from './index'
import { FetchStub, json } from '../test/cf-fetch'
import { makeD1 } from '../test/d1'

const authorization = { Authorization: 'Bearer test-key', 'Content-Type': 'application/json' }
let restoreFetch: (() => void) | undefined
afterEach(() => restoreFetch?.())

function env() {
  return { REMOTE_ACCESS_DB: makeD1(), INTERNAL_KEY: 'test-key', CF_PROVISIONER_TOKEN: 'cf-token', CF_ACCOUNT_ID: 'account', CF_ZONE_ID: 'zone', LICENSING_WORKER_URL: 'https://licensing.test', LICENSING_REMOTE_ACCESS_KEY: 'licensing-key', REMOTE_ACCESS_DOMAIN: 'vendetoweb.com.ar', ORIGIN_SERVICE: 'http://127.0.0.1:8543' } as any
}

function installFetch(valid = true) {
  const stub = new FetchStub()
  stub.on('POST', /licensing\.test\/internal\/status$/, () => json({ valid }))
  restoreFetch = stub.install()
  return stub
}

function request(path: string, body?: object) {
  return new Request(`https://worker${path}`, { method: 'POST', headers: authorization, body: body && JSON.stringify(body) })
}

const identity = { licenseKey: 'license', machineId: 'machine' }

describe('remote access authorization and validation', () => {
  it('rejects requests without the internal key', async () => {
    const unauthenticated = new Request('https://worker/status', { method: 'POST', body: JSON.stringify(identity) })
    expect((await worker.fetch(unauthenticated, env())).status).toBe(401)
  })

  it('rejects malformed and reserved activation requests', async () => {
    const testEnv = env()
    const stub = installFetch()
    expect((await worker.fetch(request('/activate', { ...identity, slug: '../other' }), testEnv)).status).toBe(400)
    expect((await worker.fetch(request('/activate', { ...identity, slug: 'admin' }), testEnv)).status).toBe(400)
    expect(stub.calls).toHaveLength(0)
  })

  it('maps invalid and unavailable licensing to 403 and 503', async () => {
    const invalid = installFetch(false)
    expect((await worker.fetch(request('/status', identity), env())).status).toBe(403)
    restoreFetch?.()
    const unavailable = new FetchStub()
    unavailable.on('POST', /licensing\.test/, () => { throw new Error('down') })
    restoreFetch = unavailable.install()
    expect((await worker.fetch(request('/status', identity), env())).status).toBe(503)
    expect(invalid.calls).toHaveLength(1)
  })
})

describe('remote access lifecycle', () => {
  it('provisions an installation idempotently and prevents duplicate slugs', async () => {
    const testEnv = env()
    const stub = installFetch()
    stub.on('POST', /cfd_tunnel$/, () => json({ success: true, result: { id: 'tunnel-1' } }))
    stub.on('PUT', /configurations$/, () => json({ success: true, result: {} }))
    stub.on('GET', /dns_records\?name=/, () => json({ success: true, result: [] }))
    stub.on('POST', /dns_records$/, () => json({ success: true, result: { id: 'dns-1' } }))
    const activation = await worker.fetch(request('/activate', { ...identity, slug: 'mi-local' }), testEnv)
    expect(activation.status).toBe(200)
    expect(await activation.json()).toMatchObject({ status: 'waiting_connector', slug: 'mi-local', hostname: 'mi-local.vendetoweb.com.ar' })
    expect((await worker.fetch(request('/activate', { ...identity, slug: 'mi-local' }), testEnv)).status).toBe(200)
    expect((await worker.fetch(request('/activate', { licenseKey: 'another', machineId: 'another-machine', slug: 'mi-local' }), testEnv)).status).toBe(409)
    expect(stub.calls.filter(call => /cfd_tunnel$/.test(call.url.toString()))).toHaveLength(1)
  })

  it('reuses a DNS record already pointing to the new tunnel', async () => {
    const testEnv = env()
    const stub = installFetch()
    stub.on('POST', /cfd_tunnel$/, () => json({ success: true, result: { id: 'tunnel-1' } }))
    stub.on('PUT', /configurations$/, () => json({ success: true, result: {} }))
    stub.on('GET', /dns_records\?name=/, () => json({ success: true, result: [{ id: 'dns-existing', content: 'tunnel-1.cfargotunnel.com' }] }))

    expect((await worker.fetch(request('/activate', { ...identity, slug: 'mi-local' }), testEnv)).status).toBe(200)
    expect(stub.calls.some(call => call.init.method === 'POST' && /dns_records$/.test(call.url.toString()))).toBe(false)
    const row = await testEnv.REMOTE_ACCESS_DB.prepare('SELECT dns_record_id, status FROM remote_access_installations').first<any>()
    expect(row).toMatchObject({ dns_record_id: 'dns-existing', status: 'provisioned' })
  })

  it('replaces an unowned DNS record before creating one for the tunnel', async () => {
    const testEnv = env()
    const stub = installFetch()
    stub.on('POST', /cfd_tunnel$/, () => json({ success: true, result: { id: 'tunnel-1' } }))
    stub.on('PUT', /configurations$/, () => json({ success: true, result: {} }))
    stub.on('GET', /dns_records\?name=/, () => json({ success: true, result: [{ id: 'dns-old', content: 'old-tunnel.cfargotunnel.com' }] }))
    stub.on('DELETE', /dns_records\/dns-old$/, () => json({ success: true, result: {} }))
    stub.on('POST', /dns_records$/, () => json({ success: true, result: { id: 'dns-new' } }))

    expect((await worker.fetch(request('/activate', { ...identity, slug: 'mi-local' }), testEnv)).status).toBe(200)
    expect(stub.calls.some(call => call.init.method === 'DELETE' && /dns_records\/dns-old$/.test(call.url.toString()))).toBe(true)
    const row = await testEnv.REMOTE_ACCESS_DB.prepare('SELECT dns_record_id FROM remote_access_installations').first<any>()
    expect(row.dns_record_id).toBe('dns-new')
  })

  it('does not replace a DNS record owned by another active installation', async () => {
    const testEnv = env()
    await testEnv.REMOTE_ACCESS_DB.prepare("INSERT INTO remote_access_installations (id, license_hash, machine_id, slug, tunnel_id, dns_record_id, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'provisioned', ?, ?)")
      .bind('other-installation', 'other-license', 'other-machine', 'other-local', 'old-tunnel', 'dns-old', new Date().toISOString(), new Date().toISOString()).run()
    const stub = installFetch()
    stub.on('POST', /cfd_tunnel$/, () => json({ success: true, result: { id: 'tunnel-1' } }))
    stub.on('PUT', /configurations$/, () => json({ success: true, result: {} }))
    stub.on('GET', /dns_records\?name=/, () => json({ success: true, result: [{ id: 'dns-old', content: 'old-tunnel.cfargotunnel.com' }] }))
    stub.on('DELETE', /connections$/, () => json({ success: true, result: {} }))
    stub.on('DELETE', /cfd_tunnel\/tunnel-1$/, () => json({ success: true, result: {} }))

    expect((await worker.fetch(request('/activate', { ...identity, slug: 'mi-local' }), testEnv)).status).toBe(502)
    expect(stub.calls.some(call => call.init.method === 'DELETE' && /dns_records\/dns-old$/.test(call.url.toString()))).toBe(false)
  })

  it('marks provisioning failures as failed and attempts tunnel cleanup', async () => {
    const testEnv = env()
    const stub = installFetch()
    stub.on('POST', /cfd_tunnel$/, () => json({ success: true, result: { id: 'tunnel-1' } }))
    stub.on('PUT', /configurations$/, () => json({ success: true, result: {} }))
    stub.on('POST', /dns_records$/, () => json({ success: false }, 500))
    stub.on('GET', /dns_records\?name=/, () => json({ success: true, result: [] }))
    stub.on('DELETE', /connections$/, () => json({ success: true, result: {} }))
    stub.on('DELETE', /cfd_tunnel\/tunnel-1$/, () => json({ success: true, result: {} }))
    expect((await worker.fetch(request('/activate', { ...identity, slug: 'mi-local' }), testEnv)).status).toBe(502)
    const row = await testEnv.REMOTE_ACCESS_DB.prepare('SELECT status FROM remote_access_installations').first<any>()
    expect(row.status).toBe('failed')
    expect(stub.calls.some(call => call.init.method === 'DELETE' && /cfd_tunnel\/tunnel-1$/.test(call.url.toString()))).toBe(true)
  })
})
