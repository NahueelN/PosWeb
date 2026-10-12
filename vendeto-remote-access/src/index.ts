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
  LICENSE_VALIDATION?: string
  HOSTNAME_PREFIX?: string
  MAX_ACTIVE_INSTALLATIONS?: string
  ACTIVATION_LIMIT_PER_DAY?: string
  DNS_RECORD_QUOTA?: string
  CAPACITY_RESERVE?: string
  ALERT_WEBHOOK_URL?: string
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
  activation_count: number
  activation_window_start: string | null
}

type RequestBody = { licenseKey: string; machineId: string; slug?: string }
const reservedSlugs = new Set(['www', 'api', 'admin', 'app', 'mail', 'prueba', 'status', 'licensing', 'vendeto'])
const app = new Hono<{ Bindings: Env }>()
class SlugUnavailableError extends Error {}

const hostname = (env: Env, slug: string) => `${env.HOSTNAME_PREFIX ?? ''}${slug}.${env.REMOTE_ACCESS_DOMAIN ?? 'vendetoweb.com.ar'}`
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
  const bearer = authorization?.match(/^Bearer (.+)$/)
  if (!bearer || !await sameKey(bearer[1], c.env.INTERNAL_KEY)) return c.json({ error: 'Unauthorized' }, 401)
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
  if (env.LICENSE_VALIDATION === 'disabled') return null
  const state = await licenseState(env, body.licenseKey, body.machineId)
  if (state === 'unavailable') return Response.json({ error: 'Licensing unavailable' }, { status: 503 })
  return state === 'invalid' ? Response.json({ error: 'Invalid license or device' }, { status: 403 }) : null
}

async function sha256(value: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, '0')).join('')
}

function normalizeSlug(env: Env, value: string | undefined): string | null {
  const slug = value?.trim().toLowerCase()
  if (!slug || !/^[a-z0-9-]{3,40}$/.test(slug) || slug.startsWith('-') || slug.endsWith('-') || reservedSlugs.has(slug) || !env.HOSTNAME_PREFIX && slug.startsWith('dev-')) return null
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
  const tunnel = await cfResult<{ id: string }>(await fetch(accountBase, { method: 'POST', headers, body: JSON.stringify({ name: `vendeto-${env.HOSTNAME_PREFIX ?? ''}${installation.slug}-${installation.id.slice(0, 8)}`, config_src: 'cloudflare' }) }))
  installation.tunnel_id = tunnel.id
  await env.REMOTE_ACCESS_DB.prepare('UPDATE remote_access_installations SET tunnel_id = ?, updated_at = ? WHERE id = ?').bind(tunnel.id, now(), installation.id).run()
  try {
    await cfResult(await fetch(`${accountBase}/${tunnel.id}/configurations`, { method: 'PUT', headers, body: JSON.stringify({ config: { ingress: [{ hostname: hostname(env, installation.slug), service: env.ORIGIN_SERVICE ?? 'http://127.0.0.1:8543' }, { service: 'http_status:404' }] } }) }))
    const dnsBase = `https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/dns_records`
    const target = `${tunnel.id}.cfargotunnel.com`
    const records = await cfResult<Array<{ id: string; type: string; content: string }>>(await fetch(`${dnsBase}?name=${encodeURIComponent(hostname(env, installation.slug))}`, { headers }))
    let dns = records.find(record => record.type === 'CNAME' && record.content === target)
    if (!dns) {
      for (const record of records) {
        if (record.type !== 'CNAME' || !record.content.endsWith('.cfargotunnel.com')) throw new SlugUnavailableError('Slug unavailable')
        const existingTunnelId = record.content.slice(0, -'.cfargotunnel.com'.length)
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

function activationLimit(env: Env): number {
  const value = Number(env.ACTIVATION_LIMIT_PER_DAY ?? '3')
  return Number.isInteger(value) && value > 0 ? value : 3
}

function retryAfter(installation: Installation, env: Env): number | null {
  if (!installation.activation_window_start) return null
  const started = Date.parse(installation.activation_window_start)
  const remaining = started + 24 * 60 * 60 * 1000 - Date.now()
  if (!Number.isFinite(started) || remaining <= 0 || installation.activation_count < activationLimit(env)) return null
  return Math.ceil(remaining / 1000)
}

async function countActivation(env: Env, installation: Installation): Promise<void> {
  const started = Date.parse(installation.activation_window_start ?? '')
  const reset = !Number.isFinite(started) || Date.now() - started >= 24 * 60 * 60 * 1000
  const windowStart = reset ? now() : installation.activation_window_start!
  const count = (reset ? 0 : installation.activation_count) + 1
  await env.REMOTE_ACCESS_DB.prepare('UPDATE remote_access_installations SET activation_count = ?, activation_window_start = ? WHERE id = ?').bind(count, windowStart, installation.id).run()
  installation.activation_count = count
  installation.activation_window_start = windowStart
}

async function hasCapacity(env: Env): Promise<boolean> {
  const quota = Number(env.DNS_RECORD_QUOTA ?? '200')
  const reserve = Number(env.CAPACITY_RESERVE ?? '10')
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${env.CF_ZONE_ID}/dns_records?per_page=1`, { headers: cfHeaders(env) })
    const body = await response.json<{ success?: boolean; result_info?: { total_count?: number } }>()
    if (!response.ok || !body.success || typeof body.result_info?.total_count !== 'number') throw new Error('Cloudflare count request failed')
    if (body.result_info.total_count < quota - reserve) return true
    const alert = { total_count: body.result_info.total_count, quota }
    console.error('[capacity-alert]', alert)
    if (env.ALERT_WEBHOOK_URL) void fetch(env.ALERT_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(alert) }).catch(() => undefined)
    return false
  } catch {
    console.error('[capacity-unknown]')
    return true
  }
}

function uniqueConflict(error: unknown): 'slug' | 'installation' | null {
  if (!(error instanceof Error) || !/unique|constraint/i.test(error.message)) return null
  return /remote_access_installations_active_slug|remote_access_installations\.slug/i.test(error.message) ? 'slug' : 'installation'
}

app.post('/activate', async c => {
  const body = await parseBody(c.req.raw)
  const slug = normalizeSlug(c.env, body?.slug)
  if (!body || !slug) return c.json({ error: 'Invalid request' }, 400)
  const licenseError = await requireLicense(c.env, body)
  if (licenseError) return licenseError
  const licenseHash = await sha256(body.licenseKey)
  let installation = await c.env.REMOTE_ACCESS_DB.prepare('SELECT * FROM remote_access_installations WHERE license_hash = ? AND machine_id = ?').bind(licenseHash, body.machineId).first<Installation>()
  if (installation?.status === 'provisioned') return installation.slug === slug ? c.json({ status: 'waiting_connector', slug, hostname: hostname(c.env, slug) }) : c.json({ error: 'Deactivate first' }, 409)
  if (installation?.status === 'provisioning' && Date.now() - Date.parse(installation.updated_at) < 120_000) return c.json({ error: 'Provisioning in progress' }, 409)
  const seconds = installation ? retryAfter(installation, c.env) : null
  if (seconds !== null) return c.json({ error: 'Activation limit reached', retryAfter: seconds }, 429)
  if (/^[1-9]\d*$/.test(c.env.MAX_ACTIVE_INSTALLATIONS ?? '')) {
    const limit = Number(c.env.MAX_ACTIVE_INSTALLATIONS)
    const active = await c.env.REMOTE_ACCESS_DB.prepare("SELECT COUNT(*) AS count FROM remote_access_installations WHERE status <> 'disabled' AND id <> ?").bind(installation?.id ?? '').first<{ count: number }>()
    if (active && active.count >= limit) return c.json({ error: 'Installation limit reached' }, 409)
  }
  const held = await c.env.REMOTE_ACCESS_DB.prepare("SELECT id FROM remote_access_installations WHERE slug = ? AND status <> 'disabled' AND id <> ?").bind(slug, installation?.id ?? '').first()
  if (held) return c.json({ error: 'Slug unavailable' }, 409)
  if (!await hasCapacity(c.env)) return c.json({ error: 'Capacity reached' }, 503)
  try {
    if (installation) {
      if (installation.tunnel_id || installation.dns_record_id) await cleanup(c.env, installation)
      await c.env.REMOTE_ACCESS_DB.prepare("UPDATE remote_access_installations SET slug = ?, tunnel_id = NULL, dns_record_id = NULL, status = 'provisioning', last_error = NULL, updated_at = ? WHERE id = ?").bind(slug, now(), installation.id).run()
      installation = { ...installation, slug, tunnel_id: null, dns_record_id: null, status: 'provisioning' }
    } else {
      installation = { id: crypto.randomUUID(), license_hash: licenseHash, machine_id: body.machineId, slug, tunnel_id: null, dns_record_id: null, status: 'provisioning', last_error: null, created_at: now(), updated_at: now(), activation_count: 0, activation_window_start: null }
      await c.env.REMOTE_ACCESS_DB.prepare('INSERT INTO remote_access_installations (id, license_hash, machine_id, slug, tunnel_id, dns_record_id, status, last_error, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(installation.id, installation.license_hash, installation.machine_id, slug, null, null, 'provisioning', null, installation.created_at, installation.updated_at).run()
    }
    await countActivation(c.env, installation)
    await provision(c.env, installation)
    return c.json({ status: 'waiting_connector', slug, hostname: hostname(c.env, slug) })
  } catch (error) {
    if (error instanceof SlugUnavailableError) {
      await c.env.REMOTE_ACCESS_DB.prepare("UPDATE remote_access_installations SET status = 'failed', last_error = ?, updated_at = ? WHERE id = ?").bind(error.message, now(), installation.id).run()
      return c.json({ error: 'Slug unavailable' }, 409)
    }
    const conflict = uniqueConflict(error)
    if (conflict) return c.json({ error: conflict === 'slug' ? 'Slug unavailable' : 'Provisioning in progress' }, 409)
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
