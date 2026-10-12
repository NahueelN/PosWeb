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

function provision(stub: FetchStub, tunnelId = 'tunnel-1', dnsId = 'dns-1') {
  stub.on('POST', /cfd_tunnel$/, () => json({ success: true, result: { id: tunnelId } }))
  stub.on('PUT', /configurations$/, () => json({ success: true, result: {} }))
  stub.on('GET', /dns_records\?name=/, () => json({ success: true, result: [] }))
  stub.on('POST', /dns_records$/, () => json({ success: true, result: { id: dnsId } }))
}

async function insertInstallation(testEnv: ReturnType<typeof env>, values: Partial<Record<'id' | 'license_hash' | 'machine_id' | 'slug' | 'tunnel_id' | 'dns_record_id' | 'status' | 'last_error' | 'created_at' | 'updated_at', string>> = {}) {
  const timestamp = new Date().toISOString()
  const row = {
    id: 'installation-1', license_hash: 'cc1d3b0234846714b0aeda6cc34b057b4305bb83dd447fb88f816efeb59a4e96', machine_id: 'machine', slug: 'mi-local',
    tunnel_id: 'tunnel-1', dns_record_id: 'dns-1', status: 'provisioned', last_error: null, created_at: timestamp, updated_at: timestamp, ...values,
  }
  await testEnv.REMOTE_ACCESS_DB.prepare('INSERT INTO remote_access_installations (id, license_hash, machine_id, slug, tunnel_id, dns_record_id, status, last_error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(row.id, row.license_hash, row.machine_id, row.slug, row.tunnel_id, row.dns_record_id, row.status, row.last_error, row.created_at, row.updated_at).run()
}

describe('remote access authorization and validation', () => {
  it('skips licensing validation only when it is disabled', async () => {
    const disabledEnv = env()
    disabledEnv.LICENSE_VALIDATION = 'disabled'
    const disabled = new FetchStub()
    restoreFetch = disabled.install()

    expect((await worker.fetch(request('/status', identity), disabledEnv)).status).toBe(200)
    expect(disabled.calls).toHaveLength(0)

    restoreFetch?.()
    const unset = installFetch()
    expect((await worker.fetch(request('/status', identity), env())).status).toBe(200)
    expect(unset.calls).toHaveLength(1)

    restoreFetch?.()
    const falseEnv = env()
    falseEnv.LICENSE_VALIDATION = 'false'
    const falseValue = installFetch()
    expect((await worker.fetch(request('/status', identity), falseEnv)).status).toBe(200)
    expect(falseValue.calls).toHaveLength(1)
  })

  it('rejects requests without the internal key', async () => {
    const unauthenticated = new Request('https://worker/status', { method: 'POST', body: JSON.stringify(identity) })
    expect((await worker.fetch(unauthenticated, env())).status).toBe(401)
  })

  it('requires a Bearer authorization scheme', async () => {
    const rawKey = new Request('https://worker/status', { method: 'POST', headers: { Authorization: 'test-key' }, body: JSON.stringify(identity) })
    expect((await worker.fetch(rawKey, env())).status).toBe(401)
  })

  it('rejects malformed and reserved activation requests', async () => {
    const testEnv = env()
    const stub = installFetch()
    expect((await worker.fetch(request('/activate', { ...identity, slug: '../other' }), testEnv)).status).toBe(400)
    expect((await worker.fetch(request('/activate', { ...identity, slug: 'admin' }), testEnv)).status).toBe(400)
    expect(stub.calls).toHaveLength(0)
  })

  it('rejects dev-prefixed slugs in production', async () => {
    const stub = installFetch()

    expect((await worker.fetch(request('/activate', { ...identity, slug: 'dev-foo' }), env())).status).toBe(400)
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
  it('applies the hostname prefix to provisioning and status', async () => {
    const testEnv = env()
    testEnv.LICENSE_VALIDATION = 'disabled'
    testEnv.HOSTNAME_PREFIX = 'dev-'
    const stub = new FetchStub()
    provision(stub)
    stub.on('GET', /cfd_tunnel\/tunnel-1$/, () => json({ success: true, result: { status: 'healthy' } }))
    restoreFetch = stub.install()

    const activation = await worker.fetch(request('/activate', { ...identity, slug: 'foo' }), testEnv)
    expect(await activation.json()).toMatchObject({ hostname: 'dev-foo.vendetoweb.com.ar' })
    expect(JSON.parse(String(stub.calls.find(call => /cfd_tunnel$/.test(call.url.toString()))?.init.body)).name).toMatch(/^vendeto-dev-foo-/)
    expect(JSON.parse(String(stub.calls.find(call => /configurations$/.test(call.url.toString()))?.init.body)).config.ingress[0].hostname).toBe('dev-foo.vendetoweb.com.ar')
    expect(stub.calls.find(call => /dns_records\?name=/.test(call.url.toString()))?.url.searchParams.get('name')).toBe('dev-foo.vendetoweb.com.ar')
    expect(JSON.parse(String(stub.calls.find(call => call.init.method === 'POST' && /dns_records$/.test(call.url.toString()))?.init.body)).name).toBe('dev-foo.vendetoweb.com.ar')

    expect(await (await worker.fetch(request('/status', identity), testEnv)).json()).toMatchObject({ hostname: 'dev-foo.vendetoweb.com.ar' })
  })

  it('accepts ordinary slugs in development', async () => {
    const testEnv = env()
    testEnv.LICENSE_VALIDATION = 'disabled'
    testEnv.HOSTNAME_PREFIX = 'dev-'
    const stub = new FetchStub()
    provision(stub)
    restoreFetch = stub.install()

    expect(await (await worker.fetch(request('/activate', { ...identity, slug: 'foo' }), testEnv)).json()).toMatchObject({ hostname: 'dev-foo.vendetoweb.com.ar' })
  })

  it('enforces the active installation cap before Cloudflare calls', async () => {
    const testEnv = env()
    testEnv.LICENSE_VALIDATION = 'disabled'
    testEnv.MAX_ACTIVE_INSTALLATIONS = '1'
    await insertInstallation(testEnv, { id: 'other-installation', license_hash: 'other-license', machine_id: 'other-machine', slug: 'other-local' })
    const stub = new FetchStub()
    restoreFetch = stub.install()

    const response = await worker.fetch(request('/activate', { ...identity, slug: 'mi-local' }), testEnv)
    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'Installation limit reached' })
    expect(stub.calls).toHaveLength(0)
  })

  it('allows reactivating the same installation at the active installation cap', async () => {
    const testEnv = env()
    testEnv.LICENSE_VALIDATION = 'disabled'
    testEnv.MAX_ACTIVE_INSTALLATIONS = '1'
    await insertInstallation(testEnv)
    const stub = new FetchStub()
    restoreFetch = stub.install()

    expect((await worker.fetch(request('/activate', { ...identity, slug: 'mi-local' }), testEnv)).status).toBe(200)
    expect(stub.calls).toHaveLength(0)
  })

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
    stub.on('GET', /dns_records\?name=/, () => json({ success: true, result: [{ id: 'dns-existing', type: 'CNAME', content: 'tunnel-1.cfargotunnel.com' }] }))

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
    stub.on('GET', /dns_records\?name=/, () => json({ success: true, result: [{ id: 'dns-old', type: 'CNAME', content: 'old-tunnel.cfargotunnel.com' }] }))
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
    stub.on('GET', /dns_records\?name=/, () => json({ success: true, result: [{ id: 'dns-old', type: 'CNAME', content: 'old-tunnel.cfargotunnel.com' }] }))
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

  it('retries after failed with a single live tunnel', async () => {
    const testEnv = env()
    await insertInstallation(testEnv, { status: 'failed', last_error: 'previous failure' })
    const stub = installFetch()
    stub.on('DELETE', /dns_records\/dns-1$/, () => json({ success: true, result: {} }))
    stub.on('DELETE', /connections$/, () => json({ success: true, result: {} }))
    stub.on('DELETE', /cfd_tunnel\/tunnel-1$/, () => json({ success: true, result: {} }))
    provision(stub, 'tunnel-2', 'dns-2')

    expect((await worker.fetch(request('/activate', { ...identity, slug: 'mi-local' }), testEnv)).status).toBe(200)
    expect(await testEnv.REMOTE_ACCESS_DB.prepare('SELECT tunnel_id, status FROM remote_access_installations').first<any>()).toMatchObject({ tunnel_id: 'tunnel-2', status: 'provisioned' })
  })

  it('reactivates after disabled with a new slug', async () => {
    const testEnv = env()
    await insertInstallation(testEnv, { status: 'disabled', slug: 'old-local', tunnel_id: null, dns_record_id: null })
    const stub = installFetch()
    provision(stub, 'tunnel-2', 'dns-2')

    expect((await worker.fetch(request('/activate', { ...identity, slug: 'new-local' }), testEnv)).status).toBe(200)
    expect(await testEnv.REMOTE_ACCESS_DB.prepare('SELECT slug, status FROM remote_access_installations').first<any>()).toMatchObject({ slug: 'new-local', status: 'provisioned' })
  })

  it('retries a stale provisioning row', async () => {
    const testEnv = env()
    await insertInstallation(testEnv, { status: 'provisioning', tunnel_id: null, dns_record_id: null, updated_at: new Date(Date.now() - 121_000).toISOString() })
    const stub = installFetch()
    provision(stub, 'tunnel-2', 'dns-2')

    expect((await worker.fetch(request('/activate', { ...identity, slug: 'mi-local' }), testEnv)).status).toBe(200)
    expect(await testEnv.REMOTE_ACCESS_DB.prepare('SELECT tunnel_id, status FROM remote_access_installations').first<any>()).toMatchObject({ tunnel_id: 'tunnel-2', status: 'provisioned' })
  })

  it.each([
    ['an A record', { id: 'dns-old', type: 'A', content: '192.0.2.1' }],
    ['a third-party CNAME', { id: 'dns-old', type: 'CNAME', content: 'example.com' }],
  ])('does not replace %s', async (_description, record) => {
    const testEnv = env()
    const stub = installFetch()
    stub.on('POST', /cfd_tunnel$/, () => json({ success: true, result: { id: 'tunnel-1' } }))
    stub.on('PUT', /configurations$/, () => json({ success: true, result: {} }))
    stub.on('GET', /dns_records\?name=/, () => json({ success: true, result: [record] }))
    stub.on('DELETE', /connections$/, () => json({ success: true, result: {} }))
    stub.on('DELETE', /cfd_tunnel\/tunnel-1$/, () => json({ success: true, result: {} }))

    const response = await worker.fetch(request('/activate', { ...identity, slug: 'mi-local' }), testEnv)
    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'Slug unavailable' })
    expect(stub.calls.some(call => call.init.method === 'DELETE' && /dns_records\/dns-old$/.test(call.url.toString()))).toBe(false)
  })
})

describe('remote access status, deactivation, and connector token', () => {
  it.each([
    ['healthy', 'healthy', 'active'],
    ['unhealthy', 'inactive', 'waiting_connector'],
  ])('maps %s tunnel health to %s', async (_description, health, status) => {
    const testEnv = env()
    await insertInstallation(testEnv)
    const stub = installFetch()
    stub.on('GET', /cfd_tunnel\/tunnel-1$/, () => json({ success: true, result: { status: health } }))

    expect(await (await worker.fetch(request('/status', identity), testEnv)).json()).toMatchObject({ status })
  })

  it('maps a health fetch failure to waiting_connector', async () => {
    const testEnv = env()
    await insertInstallation(testEnv)
    installFetch()

    expect(await (await worker.fetch(request('/status', identity), testEnv)).json()).toMatchObject({ status: 'waiting_connector' })
  })

  it('exposes lastError for a failed row', async () => {
    const testEnv = env()
    await insertInstallation(testEnv, { status: 'failed', last_error: 'Cloudflare failed' })
    installFetch()

    expect(await (await worker.fetch(request('/status', identity), testEnv)).json()).toMatchObject({ status: 'failed', lastError: 'Cloudflare failed' })
  })

  it('returns inactive without an installation', async () => {
    const stub = installFetch()
    expect(await (await worker.fetch(request('/status', identity), env())).json()).toEqual({ status: 'inactive' })
    expect(stub.calls).toHaveLength(1)
  })

  it('deactivates with a null tunnel without calling cfd_tunnel/null', async () => {
    const testEnv = env()
    await insertInstallation(testEnv, { tunnel_id: null, dns_record_id: null })
    const stub = installFetch()

    expect((await worker.fetch(request('/deactivate', identity), testEnv)).status).toBe(204)
    expect(stub.calls.some(call => call.url.toString().includes('cfd_tunnel/null'))).toBe(false)
  })

  it('keeps the row when DNS deletion fails', async () => {
    const testEnv = env()
    await insertInstallation(testEnv)
    const stub = installFetch()
    stub.on('DELETE', /dns_records\/dns-1$/, () => json({ success: false }, 500))

    expect((await worker.fetch(request('/deactivate', identity), testEnv)).status).toBe(502)
    expect(await testEnv.REMOTE_ACCESS_DB.prepare('SELECT status, tunnel_id, dns_record_id FROM remote_access_installations').first<any>()).toMatchObject({ status: 'provisioned', tunnel_id: 'tunnel-1', dns_record_id: 'dns-1' })
  })

  it('treats DNS and tunnel 404 responses as a successful deactivation', async () => {
    const testEnv = env()
    await insertInstallation(testEnv)
    const stub = installFetch()
    stub.on('DELETE', /dns_records\/dns-1$/, () => json({}, 404))
    stub.on('DELETE', /connections$/, () => json({}, 404))
    stub.on('DELETE', /cfd_tunnel\/tunnel-1$/, () => json({}, 404))

    expect((await worker.fetch(request('/deactivate', identity), testEnv)).status).toBe(204)
  })

  it('makes no Cloudflare calls when deactivated twice', async () => {
    const testEnv = env()
    await insertInstallation(testEnv, { status: 'disabled', tunnel_id: null, dns_record_id: null })
    const stub = installFetch()

    expect((await worker.fetch(request('/deactivate', identity), testEnv)).status).toBe(204)
    expect(stub.calls).toHaveLength(1)
  })

  it('rejects connector tokens for failed installations', async () => {
    const testEnv = env()
    await insertInstallation(testEnv, { status: 'failed' })
    installFetch()

    expect((await worker.fetch(request('/connector-token', identity), testEnv)).status).toBe(409)
  })
})
