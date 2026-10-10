import { Hono } from 'hono'

type Env = {
  REMOTE_ACCESS_DB: D1Database
  INTERNAL_KEY?: string
  CF_PROVISIONER_TOKEN?: string
  CF_ACCOUNT_ID?: string
  CF_ZONE_ID?: string
  LICENSING_WORKER_URL?: string
  LICENSING_REMOTE_ACCESS_KEY?: string
  REMOTE_ACCESS_DOMAIN?: string
  ORIGIN_SERVICE?: string
}

type Installation = {
  id: string
  license_hash: string
  machine_id: string
  slug: string
  tunnel_id: string | null
  dns_record_id: string | null
  status: 'provisioning' | 'provisioned' | 'failed' | 'disabled'
  last_error: string | null
  created_at: string
  updated_at: string
}

type RequestBody = { licenseKey: string; machineId: string; slug?: string }
const reservedSlugs = new Set(['www', 'api', 'admin', 'app', 'mail', 'prueba', 'status', 'licensing', 'vendeto'])
const app = new Hono<{ Bindings: Env }>()

const hostname = (env: Env, slug: string) => `${slug}.${env.REMOTE_ACCESS_DOMAIN ?? 'vendetoweb.com.ar'}`
const now = () => new Date().toISOString()

async function sameKey(actual: string | undefined, expected: string | undefined): Promise<boolean> {
  if (!actual || !expected) return false
  const [left, right] = await Promise.all([crypto.subtle.digest('SHA-256', new TextEncoder().encode(actual)), crypto.subtle.digest('SHA-256', new TextEncoder().encode(expected))])
  const a = new Uint8Array(left)
  const b = new Uint8Array(right)
  let difference = a.length ^ b.length
  for (let index = 0; index < Math.max(a.length, b.length); index++) difference |= (a[index] ?? 0) ^ (b[index] ?? 0)
  return difference === 0
}

app.use('*', async (c, next) => {
  const authorization = c.req.header('Authorization')
  if (!await sameKey(authorization?.replace(/^Bearer /, ''), c.env.INTERNAL_KEY)) return c.json({ error: 'Unauthorized' }, 401)
  await next()
})

async function parseBody(request: Request): Promise<RequestBody | null> {
  try {
    const body = await request.json<unknown>()
    if (!body || typeof body !== 'object') return null
    const { licenseKey, machineId, slug } = body as Record<string, unknown>
    if (typeof licenseKey !== 'string' || !licenseKey || typeof machineId !== 'string' || !machineId || (slug !== undefined && typeof slug !== 'string')) return null
    return { licenseKey, machineId, slug: slug as string | undefined }
  } catch { return null }
}

async function licenseState(env: Env, licenseKey: string, machineId: string): Promise<'valid' | 'invalid' | 'unavailable'> {
  if (!env.LICENSING_WORKER_URL || !env.LICENSING_REMOTE_ACCESS_KEY) return 'unavailable'
  try {
    const response = await fetch(`${env.LICENSING_WORKER_URL}/internal/status`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.LICENSING_REMOTE_ACCESS_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_key: licenseKey, machine_id: machineId }),
    })
    if (response.status >= 500) return 'unavailable'
    if (!response.ok) return 'invalid'
    return (await response.json<{ valid?: boolean }>()).valid === true ? 'valid' : 'invalid'
  } catch { return 'unavailable' }
}

async function requireLicense(env: Env, body: RequestBody): Promise<Response | null> {
  const state = await licenseState(env, body.licenseKey, body.machineId)
  if (state === 'unavailable') return Response.json({ error: 'Licensing unavailable' }, { status: 503 })
  return state === 'invalid' ? Response.json({ error: 'Invalid license or device' }, { status: 403 }) : null
}

async function sha256(value: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function normalizeSlug(value: string | undefined): string | null {
  const slug = value?.trim().toLowerCase()
  if (!slug || !/^[a-z0-9-]{3,40}$/.test(slug) || slug.startsWith('-') || slug.endsWith('-') || reservedSlugs.has(slug)) return null
  return slug
}

function cfHeaders(env: Env): HeadersInit {
  if (!env.CF_PROVISIONER_TOKEN || !env.CF_ACCOUNT_ID || !env.CF_ZONE_ID) throw new Error('Provisioning is not configured')
  return { Authorization: `Bearer ${env.CF_PROVISIONER_TOKEN}`, 'Content-Type': 'application/json' }
}

async function cfResult<T>(response: Response): Promise<T> {
  const body = await response.json<{ success?: boolean; result?: T }>().catch(() => ({}))
  if (!response.ok || !body.success) throw new Error('Cloudflare request failed')
  return body.result as T
}

async function cleanup(env: Env, installation: Installation): Promise<void> {
  const headers = cfHeaders(env)
  const dnsBase = `https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/dns_records`
  const remove = async (url: string) => {
    const response = await fetch(url, { method: 'DELETE', headers })
    if (response.status !== 404) await cfResult(response)
  }
  if (installation.dns_record_id) await remove(`${dnsBase}/${installation.dns_record_id}`)
  else if (installation.tunnel_id) {
    const records = await cfResult<Array<{ id: string; content: string }>>(await fetch(`${dnsBase}?name=${encodeURIComponent(hostname(env, installation.slug))}`, { headers }))
    for (const record of records) if (record.content === `${installation.tunnel_id}.cfargotunnel.com`) await remove(`${dnsBase}/${record.id}`)
  }
  if (installation.tunnel_id) {
    const base = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/cfd_tunnel/${installation.tunnel_id}`
    await remove(`${base}/connections`)
    await remove(base)
  }
}

async function provision(env: Env, installation: Installation): Promise<void> {
  const headers = cfHeaders(env)
  const accountBase = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/cfd_tunnel`
  const tunnel = await cfResult<{ id: string }>(await fetch(accountBase, { method: 'POST', headers, body: JSON.stringify({ name: `vendeto-${installation.slug}-${installation.id.slice(0, 8)}`, config_src: 'cloudflare' }) }))
  installation.tunnel_id = tunnel.id
  await env.REMOTE_ACCESS_DB.prepare('UPDATE remote_access_installations SET tunnel_id = ?, updated_at = ? WHERE id = ?').bind(tunnel.id, now(), installation.id).run()
  try {
    await cfResult(await fetch(`${accountBase}/${tunnel.id}/configurations`, { method: 'PUT', headers, body: JSON.stringify({ config: { ingress: [{ hostname: hostname(env, installation.slug), service: env.ORIGIN_SERVICE ?? 'http://127.0.0.1:8543' }, { service: 'http_status:404' }] } }) }))
    const dnsBase = `https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/dns_records`
    const target = `${tunnel.id}.cfargotunnel.com`
    const records = await cfResult<Array<{ id: string; content: string }>>(await fetch(`${dnsBase}?name=${encodeURIComponent(hostname(env, installation.slug))}`, { headers }))
    let dns = records.find(record => record.content === target)
    if (!dns) {
      for (const record of records) {
        const existingTunnelId = record.content.endsWith('.cfargotunnel.com') ? record.content.slice(0, -'.cfargotunnel.com'.length) : null
        const ownerByRecord = await env.REMOTE_ACCESS_DB.prepare("SELECT id FROM remote_access_installations WHERE dns_record_id = ? AND status <> 'disabled' AND id <> ?").bind(record.id, installation.id).first()
        const ownerByTunnel = existingTunnelId
          ? await env.REMOTE_ACCESS_DB.prepare("SELECT id FROM remote_access_installations WHERE tunnel_id = ? AND status <> 'disabled' AND id <> ?").bind(existingTunnelId, installation.id).first()
          : null
        if (ownerByRecord || ownerByTunnel) throw new Error('DNS record is in use')
        await cfResult(await fetch(`${dnsBase}/${record.id}`, { method: 'DELETE', headers }))
      }
      dns = await cfResult<{ id: string }>(await fetch(dnsBase, { method: 'POST', headers, body: JSON.stringify({ type: 'CNAME', name: hostname(env, installation.slug), content: target, proxied: true, ttl: 1 }) }))
    }
    installation.dns_record_id = dns.id
    await env.REMOTE_ACCESS_DB.prepare("UPDATE remote_access_installations SET dns_record_id = ?, status = 'provisioned', last_error = NULL, updated_at = ? WHERE id = ?").bind(dns.id, now(), installation.id).run()
  } catch (error) {
    try { await cleanup(env, installation) } catch { /* The row retains identifiers for a later retry. */ }
    throw error
  }
}

function isUniqueError(error: unknown): boolean { return error instanceof Error && /unique|constraint/i.test(error.message) }

app.post('/activate', async c => {
  const body = await parseBody(c.req.raw)
  const slug = normalizeSlug(body?.slug)
  if (!body || !slug) return c.json({ error: 'Invalid request' }, 400)
  const licenseError = await requireLicense(c.env, body)
  if (licenseError) return licenseError
  const licenseHash = await sha256(body.licenseKey)
  let installation = await c.env.REMOTE_ACCESS_DB.prepare('SELECT * FROM remote_access_installations WHERE license_hash = ? AND machine_id = ?').bind(licenseHash, body.machineId).first<Installation>()
  if (installation?.status === 'provisioned') return installation.slug === slug ? c.json({ status: 'waiting_connector', slug, hostname: hostname(c.env, slug) }) : c.json({ error: 'Deactivate first' }, 409)
  if (installation?.status === 'provisioning' && Date.now() - Date.parse(installation.updated_at) < 120_000) return c.json({ error: 'Provisioning in progress' }, 409)
  const held = await c.env.REMOTE_ACCESS_DB.prepare("SELECT id FROM remote_access_installations WHERE slug = ? AND status <> 'disabled' AND id <> ?").bind(slug, installation?.id ?? '').first()
  if (held) return c.json({ error: 'Slug unavailable' }, 409)
  try {
    if (installation) {
      if (installation.tunnel_id || installation.dns_record_id) await cleanup(c.env, installation)
      await c.env.REMOTE_ACCESS_DB.prepare("UPDATE remote_access_installations SET slug = ?, tunnel_id = NULL, dns_record_id = NULL, status = 'provisioning', last_error = NULL, updated_at = ? WHERE id = ?").bind(slug, now(), installation.id).run()
      installation = { ...installation, slug, tunnel_id: null, dns_record_id: null, status: 'provisioning' }
    } else {
      installation = { id: crypto.randomUUID(), license_hash: licenseHash, machine_id: body.machineId, slug, tunnel_id: null, dns_record_id: null, status: 'provisioning', last_error: null, created_at: now(), updated_at: now() }
      await c.env.REMOTE_ACCESS_DB.prepare('INSERT INTO remote_access_installations (id, license_hash, machine_id, slug, tunnel_id, dns_record_id, status, last_error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(installation.id, installation.license_hash, installation.machine_id, slug, null, null, 'provisioning', null, installation.created_at, installation.updated_at).run()
    }
    await provision(c.env, installation)
    return c.json({ status: 'waiting_connector', slug, hostname: hostname(c.env, slug) })
  } catch (error) {
    if (isUniqueError(error)) return c.json({ error: 'Slug unavailable' }, 409)
    const message = error instanceof Error ? error.message : 'Provisioning failed'
    await c.env.REMOTE_ACCESS_DB.prepare("UPDATE remote_access_installations SET status = 'failed', last_error = ?, updated_at = ? WHERE id = ?").bind(message, now(), installation.id).run()
    return c.json({ error: message }, 502)
  }
})

app.post('/status', async c => {
  const body = await parseBody(c.req.raw)
  if (!body) return c.json({ error: 'Invalid request' }, 400)
  const licenseError = await requireLicense(c.env, body)
  if (licenseError) return licenseError
  const installation = await c.env.REMOTE_ACCESS_DB.prepare('SELECT * FROM remote_access_installations WHERE license_hash = ? AND machine_id = ?').bind(await sha256(body.licenseKey), body.machineId).first<Installation>()
  if (!installation || installation.status === 'disabled') return c.json({ status: 'inactive' })
  if (installation.status === 'provisioning') return c.json({ status: 'provisioning', slug: installation.slug, updatedAt: installation.updated_at })
  if (installation.status === 'failed') return c.json({ status: 'failed', slug: installation.slug, lastError: installation.last_error, updatedAt: installation.updated_at })
  try {
    const health = await cfResult<{ status?: string }>(await fetch(`https://api.cloudflare.com/client/v4/accounts/${c.env.CF_ACCOUNT_ID}/cfd_tunnel/${installation.tunnel_id}`, { headers: cfHeaders(c.env) }))
    return c.json({ status: health.status === 'healthy' ? 'active' : 'waiting_connector', slug: installation.slug, hostname: hostname(c.env, installation.slug), updatedAt: installation.updated_at })
  } catch { return c.json({ status: 'waiting_connector', slug: installation.slug, hostname: hostname(c.env, installation.slug), updatedAt: installation.updated_at }) }
})

app.post('/connector-token', async c => {
  const body = await parseBody(c.req.raw)
  if (!body) return c.json({ error: 'Invalid request' }, 400)
  const licenseError = await requireLicense(c.env, body)
  if (licenseError) return licenseError
  const installation = await c.env.REMOTE_ACCESS_DB.prepare('SELECT * FROM remote_access_installations WHERE license_hash = ? AND machine_id = ?').bind(await sha256(body.licenseKey), body.machineId).first<Installation>()
  if (installation?.status !== 'provisioned' || !installation.tunnel_id) return c.json({ error: 'Remote access is not active' }, 409)
  try { return c.json({ token: await cfResult<string>(await fetch(`https://api.cloudflare.com/client/v4/accounts/${c.env.CF_ACCOUNT_ID}/cfd_tunnel/${installation.tunnel_id}/token`, { headers: cfHeaders(c.env) })) }) } catch { return c.json({ error: 'Connector token unavailable' }, 502) }
})

app.post('/deactivate', async c => {
  const body = await parseBody(c.req.raw)
  if (!body) return c.json({ error: 'Invalid request' }, 400)
  const licenseError = await requireLicense(c.env, body)
  if (licenseError) return licenseError
  const installation = await c.env.REMOTE_ACCESS_DB.prepare('SELECT * FROM remote_access_installations WHERE license_hash = ? AND machine_id = ?').bind(await sha256(body.licenseKey), body.machineId).first<Installation>()
  if (!installation || installation.status === 'disabled') return c.body(null, 204)
  try { await cleanup(c.env, installation) } catch (error) { return c.json({ error: error instanceof Error ? error.message : 'Deactivation failed' }, 502) }
  await c.env.REMOTE_ACCESS_DB.prepare("UPDATE remote_access_installations SET status = 'disabled', tunnel_id = NULL, dns_record_id = NULL, updated_at = ? WHERE id = ?").bind(now(), installation.id).run()
  return c.body(null, 204)
})

export default app
