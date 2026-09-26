import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  LICENSES_DB: D1Database;
  MP_ACCESS_TOKEN: string;
  MP_WEBHOOK_SECRET?: string;
  POSWEB_INTERNAL_KEY?: string;
}

interface License {
  license_key: string;
  preapproval_id: string | null;
  email: string;
  plan: string;
  status: string;
  machine_id: string | null;
  next_billing: string | null;
  grace_until: string | null;
  created_at: string;
  activated_at: string | null;
  updated_at: string;
}

const PLAN_PRICES: Record<string, number> = {
  gratuito: 0,
  basica: 32500,
  maxima: 39990,
};

const VALID_PLANS = ['gratuito', 'basica', 'maxima'];

// Sitio comercial: la contratación de planes vive en la web de Vendeto,
// por lo que los back_urls de MercadoPago apuntan ahí (no al worker).
const WEB_BASE_URL = 'https://vendeto.com.ar';

const app = new Hono<{ Bindings: Env }>();

app.use('/*', cors());

async function verifyWebhookSignature(body: string, signature: string | null, secret: string | null): Promise<boolean> {
  if (!secret || !signature) return true;
  const parts = signature.split(',');
  if (parts.length !== 2) return false;
  const ts = parts[0];
  const v1 = parts[1];
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = encoder.encode(`${ts}.${body}`);
  const sig = await crypto.subtle.sign('HMAC', key, data);
  const hex = Array.from(new Uint8Array(sig), b => b.toString(16).padStart(2, '0')).join('');
  return v1 === hex;
}

function generateLicenseKey(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Punto de partida para renovar: si todavía quedan días de la licencia actual, el próximo
// ciclo se suma a partir de ahí (no se pierden); si ya venció, se cuenta desde hoy.
function fechaBaseParaRenovacion(nextBillingActual: string | null): Date {
  const hoy = new Date();
  if (!nextBillingActual) return hoy;
  const actual = new Date(nextBillingActual);
  return actual > hoy ? actual : hoy;
}

// Renovación manual mensual: se suman 30 días desde el vencimiento vigente si todavía
// quedaban días (se respeta el original), o desde hoy si la licencia ya estaba vencida.
function calcularNuevoVencimiento(nextBillingActual: string | null): string {
  const base = fechaBaseParaRenovacion(nextBillingActual);
  base.setDate(base.getDate() + 30);
  return base.toISOString().split('T')[0];
}

const GRACE_HOURS = 48;
const GRACE_MS = GRACE_HOURS * 60 * 60 * 1000;

// Evalúa el estado efectivo de una licencia a partir de su next_billing:
// - active: vencimiento en el futuro.
// - grace: venció, pero está dentro de las 48h de gracia (sigue permitida).
// - expired: pasó la gracia (acceso revocado).
function evaluarVigencia(l: License): { status: string; valid: boolean; graceUntil: string | null } {
  if (l.status === 'cancelled' || l.status === 'paused') {
    return { status: l.status, valid: false, graceUntil: null };
  }
  if (l.status === 'pending') {
    return { status: 'pending', valid: false, graceUntil: null };
  }
  if (!l.next_billing) {
    return { status: 'active', valid: true, graceUntil: null };
  }
  const next = new Date(l.next_billing);
  const now = new Date();
  if (next > now) {
    return { status: 'active', valid: true, graceUntil: null };
  }
  const graceUntil = new Date(next.getTime() + GRACE_MS);
  if (now <= graceUntil) {
    return { status: 'grace', valid: true, graceUntil: graceUntil.toISOString() };
  }
  return { status: 'expired', valid: false, graceUntil: null };
}

async function persistirVigencia(env: Env, l: License, v: { status: string; graceUntil: string | null }) {
  if (v.status !== l.status || (v.graceUntil ?? null) !== (l.grace_until ?? null)) {
    await env.LICENSES_DB
      .prepare('UPDATE licenses SET status = ?, grace_until = ?, updated_at = datetime(\'now\') WHERE license_key = ?')
      .bind(v.status, v.graceUntil, l.license_key)
      .run();
  }
}

async function normalizePlan(env: Env, plan: string): Promise<string> {
  const lowered = plan.toLowerCase();
  if (VALID_PLANS.includes(lowered)) return lowered;
  return 'basica';
}

app.post('/webhook', async (c) => {
  const env = c.env;
  const body = await c.req.text();
  const signature = c.req.header('x-signature') ?? null;

  if (!await verifyWebhookSignature(body, signature, env.MP_WEBHOOK_SECRET ?? null)) {
    return c.json({ error: 'Invalid signature' }, 403);
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const topic = payload.action || payload.type;
  const resourceId = payload.data?.id;

  if (!resourceId) {
    return c.json({ error: 'Missing resource id' }, 400);
  }

  if (topic === 'payment.created' || topic === 'payment.updated') {
    try {
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${resourceId}`, {
        headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
      });
      if (!mpResponse.ok) {
        return c.json({ error: `MP payment fetch failed: ${mpResponse.status}` }, 500);
      }
      const mpData: any = await mpResponse.json();
      const paymentStatus = mpData.status;
      const externalRef = mpData.external_reference || '';

      const refParts = externalRef.split(':');
      const licenseKey = refParts[3];

      if (!licenseKey) {
        return c.json({ error: 'No license key in external reference' }, 400);
      }

      const existing = await env.LICENSES_DB
        .prepare('SELECT * FROM licenses WHERE license_key = ?')
        .bind(licenseKey.toUpperCase())
        .first<License>();

      if (!existing) {
        return c.json({ error: 'License not found' }, 404);
      }

      if (paymentStatus === 'approved') {
        const nextBilling = calcularNuevoVencimiento(existing.next_billing);
        await env.LICENSES_DB
          .prepare('UPDATE licenses SET status = ?, next_billing = ?, grace_until = NULL, updated_at = datetime(\'now\') WHERE license_key = ?')
          .bind('active', nextBilling, licenseKey)
          .run();
        return c.json({ success: true, license_key: licenseKey, status: 'active', next_billing: nextBilling });
      }

      const terminalStatuses = ['refunded', 'cancelled', 'rejected', 'charged_back'];
      if (terminalStatuses.includes(paymentStatus)) {
        await env.LICENSES_DB
          .prepare('UPDATE licenses SET status = ?, updated_at = datetime(\'now\') WHERE license_key = ?')
          .bind('cancelled', licenseKey)
          .run();
        return c.json({ success: true, license_key: licenseKey, status: 'cancelled' });
      }

      // pending (u otro estado no terminal): no se toca la licencia, conserva su estado actual.
      return c.json({ success: true, license_key: licenseKey, status: existing.status });
    } catch (e: any) {
      return c.json({ error: `Failed to process webhook: ${e.message}` }, 500);
    }
  }

  if (topic === 'subscription_preapproval' || topic === 'subscription_preapproval.updated') {
    try {
      const existing = await env.LICENSES_DB
        .prepare('SELECT * FROM licenses WHERE preapproval_id = ?')
        .bind(resourceId)
        .first<License>();

      if (!existing) {
        return c.json({ error: 'License not found for this preapproval' }, 404);
      }

      const mpResponse = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
        headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` },
      });
      if (!mpResponse.ok) {
        return c.json({ error: `MP preapproval fetch failed: ${mpResponse.status}` }, 500);
      }
      const mpData: any = await mpResponse.json();

      const newStatus = mpData.status === 'authorized' ? 'active'
        : mpData.status === 'paused' ? 'paused'
        : mpData.status === 'cancelled' ? 'cancelled'
        : 'pending';

      await env.LICENSES_DB
        .prepare('UPDATE licenses SET status = ?, updated_at = datetime(\'now\') WHERE license_key = ?')
        .bind(newStatus, existing.license_key)
        .run();

      return c.json({ success: true, license_key: existing.license_key, status: newStatus });
    } catch (e: any) {
      return c.json({ error: `Failed to process webhook: ${e.message}` }, 500);
    }
  }

  if (topic === 'subscription_authorized_payment') {
    const existing = await env.LICENSES_DB
      .prepare('SELECT * FROM licenses WHERE preapproval_id = ?')
      .bind(resourceId)
      .first<License>();

    if (!existing) {
      return c.json({ error: 'License not found for this preapproval' }, 404);
    }

    const nextBilling = calcularNuevoVencimiento(existing.next_billing);

    await env.LICENSES_DB
      .prepare('UPDATE licenses SET status = ?, next_billing = ?, grace_until = NULL, updated_at = datetime(\'now\') WHERE license_key = ?')
      .bind('active', nextBilling, existing.license_key)
      .run();

    return c.json({ success: true, status: 'active', next_billing: nextBilling });
  }

  return c.json({ error: `Unknown topic: ${topic}` }, 400);
});

app.post('/activate', async (c) => {
  const env = c.env;
  const body = await c.req.json<{ license_key: string; machine_id: string }>();
  const { license_key, machine_id } = body;

  if (!license_key || !machine_id) {
    return c.json({ success: false, error: 'license_key and machine_id are required' }, 400);
  }

  const license = await env.LICENSES_DB
    .prepare('SELECT * FROM licenses WHERE license_key = ?')
    .bind(license_key.toUpperCase())
    .first<License>();

  if (!license) {
    return c.json({ success: false, error: 'License not found' }, 404);
  }

  if (license.machine_id && license.machine_id !== machine_id) {
    return c.json({ success: false, error: 'License already activated on another device' }, 409);
  }

  const vigencia = evaluarVigencia(license);
  await persistirVigencia(env, license, vigencia);

  if (!vigencia.valid) {
    const msg = vigencia.status === 'pending'
      ? 'El pago aún se está procesando. Esperá unos minutos y volvé a intentar.'
      : vigencia.status === 'expired'
        ? 'Tu licencia está vencida. Renovala para continuar.'
        : `La licencia está en estado "${vigencia.status}". Contactá al soporte.`;
    return c.json({ success: false, error: msg }, 403);
  }

  await env.LICENSES_DB
    .prepare('UPDATE licenses SET machine_id = ?, activated_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE license_key = ?')
    .bind(machine_id, license.license_key)
    .run();

  return c.json({
    success: true,
    plan: license.plan,
    status: vigencia.status,
    next_billing: license.next_billing,
  });
});

app.post('/status', async (c) => {
  const env = c.env;
  const body = await c.req.json<{ license_key: string; machine_id: string }>();
  const { license_key, machine_id } = body;

  if (!license_key || !machine_id) {
    return c.json({ valid: false, error: 'license_key and machine_id are required' }, 400);
  }

  const license = await env.LICENSES_DB
    .prepare('SELECT * FROM licenses WHERE license_key = ?')
    .bind(license_key.toUpperCase())
    .first<License>();

  if (!license) {
    return c.json({ valid: false, error: 'License not found' });
  }

  if (license.machine_id && license.machine_id !== machine_id) {
    return c.json({ valid: false, error: 'Machine ID mismatch' });
  }

  if (license.status === 'cancelled') {
    return c.json({ valid: false, error: 'License cancelled' });
  }

  if (license.status === 'pending' && license.preapproval_id) {
    try {
      const refParts = (license.preapproval_id || '').includes(':')
        ? [] : [];
      const mpCheck = await fetch(
        `https://api.mercadopago.com/v1/payments/search?external_reference=plan:${license.plan}:${license.email}:${license.license_key}`,
        { headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}` } }
      );
      if (mpCheck.ok) {
        const searchData: any = await mpCheck.json();
        const approved = searchData.results?.find((p: any) => p.status === 'approved');
        if (approved) {
          const nextBilling = calcularNuevoVencimiento(license.next_billing);
          await env.LICENSES_DB
            .prepare('UPDATE licenses SET status = ?, next_billing = ?, preapproval_id = ?, updated_at = datetime(\'now\') WHERE license_key = ?')
            .bind('active', nextBilling, approved.id.toString(), license.license_key)
            .run();
          license.status = 'active';
          license.next_billing = nextBilling;
        }
      }
    } catch {
      // ignore MP errors during status check, keep pending
    }
  }

  const now = new Date();
  const nextBillingDate = license.next_billing ? new Date(license.next_billing) : null;
  const daysRemaining = nextBillingDate
    ? Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const vigencia = evaluarVigencia(license);
  await persistirVigencia(env, license, vigencia);

  return c.json({
    valid: vigencia.valid,
    plan: license.plan,
    status: vigencia.status,
    next_billing: license.next_billing,
    grace_until: vigencia.graceUntil,
    days_remaining: daysRemaining,
  });
});

function checkInternalAuth(c: any, env: Env): boolean {
  if (!env.POSWEB_INTERNAL_KEY) return false;
  const auth = c.req.header('Authorization') || '';
  return auth === `Bearer ${env.POSWEB_INTERNAL_KEY}`;
}

app.post('/grant-license', async (c) => {
  const env = c.env;

  if (!checkInternalAuth(c, env)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json<{ email: string; plan: string; activate?: boolean; duration_days?: number }>();
  const { email, plan, activate, duration_days } = body;

  if (!email) {
    return c.json({ error: 'email is required' }, 400);
  }

  const planKey = plan.toLowerCase();
  if (!VALID_PLANS.includes(planKey)) {
    return c.json({ error: `Invalid plan: ${plan}. Valid plans: ${VALID_PLANS.join(', ')}` }, 400);
  }

  const duration = Math.min(730, Math.max(1, duration_days ?? 30));
  const licenseKey = generateLicenseKey();
  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + duration);
  const nextBillingStr = nextBilling.toISOString().split('T')[0];
  const status = activate ? 'active' : 'pending';

  await env.LICENSES_DB
    .prepare(
      'INSERT INTO licenses (license_key, email, plan, status, next_billing, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))'
    )
    .bind(licenseKey, email.toLowerCase().trim(), planKey, status, nextBillingStr)
    .run();

  return c.json({
    license_key: licenseKey,
    email: email.toLowerCase().trim(),
    plan: planKey,
    status,
    next_billing: nextBillingStr,
  });
});

app.post('/license-by-email', async (c) => {
  const env = c.env;

  if (!checkInternalAuth(c, env)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json<{ email: string }>();
  const { email } = body;

  if (!email) {
    return c.json({ found: false, error: 'email is required' }, 400);
  }

  const license = await env.LICENSES_DB
    .prepare('SELECT * FROM licenses WHERE email = ? ORDER BY created_at DESC LIMIT 1')
    .bind(email.toLowerCase().trim())
    .first<License>();

  if (!license) {
    return c.json({ found: false });
  }

  const vigencia = evaluarVigencia(license);
  await persistirVigencia(env, license, vigencia);

  const now = new Date();
  const nextBillingDate = license.next_billing ? new Date(license.next_billing) : null;
  const daysRemaining = nextBillingDate
    ? Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Se devuelve found:true para cualquier licencia existente (incluso vencida/cancelada),
  // con su estado efectivo: así el backend puede mostrar el motivo real al intentar activarla.
  return c.json({
    found: true,
    license_key: license.license_key,
    plan: license.plan,
    status: vigencia.status,
    next_billing: license.next_billing,
    grace_until: vigencia.graceUntil,
    days_remaining: daysRemaining,
  });
});

// Registro del email como plan gratuito (placeholder). Solo interno (backend .NET lo llama
// al registrarse un titular). status=pending para que NO se active como licencia (no debe
// pisar la prueba gratuita local); el /checkout posterior lo encuentra y actualiza el plan.
// NO degrada una licencia paga existente (basica/maxima).
app.post('/register', async (c) => {
  const env = c.env;

  if (!checkInternalAuth(c, env)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const body = await c.req.json<{ email: string }>();
  const { email } = body;

  if (!email) {
    return c.json({ error: 'email is required' }, 400);
  }

  const emailLower = email.toLowerCase().trim();

  const existing = await env.LICENSES_DB
    .prepare('SELECT * FROM licenses WHERE email = ? ORDER BY created_at DESC LIMIT 1')
    .bind(emailLower)
    .first<License>();

  if (existing) {
    if (existing.plan === 'gratuito') {
      await env.LICENSES_DB
        .prepare('UPDATE licenses SET updated_at = datetime(\'now\') WHERE license_key = ?')
        .bind(existing.license_key)
        .run();
    }
    // Si ya es basica/maxima no se toca (no degradar una licencia paga).
    return c.json({ ok: true, email: emailLower, plan: existing.plan });
  }

  const licenseKey = generateLicenseKey();

  await env.LICENSES_DB
    .prepare(
      'INSERT INTO licenses (license_key, email, plan, status, next_billing, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, datetime(\'now\'), datetime(\'now\'))'
    )
    .bind(licenseKey, emailLower, 'gratuito', 'pending')
    .run();

  return c.json({ ok: true, email: emailLower, plan: 'gratuito', status: 'pending' });
});

app.post('/checkout', async (c) => {
  const env = c.env;
  const body = await c.req.json<{ plan: string; email: string }>();
  const { plan, email } = body;

  if (!plan || !email) {
    return c.json({ error: 'plan and email are required' }, 400);
  }

  const planKey = plan.toLowerCase();
  if (planKey === 'gratuito') {
    return c.json({ error: 'El plan gratuito no se contrata: es el nivel que se obtiene al vencer la prueba' }, 400);
  }
  const price = PLAN_PRICES[planKey];
  if (!price) {
    return c.json({ error: `Invalid plan: ${plan}. Valid plans: ${VALID_PLANS.join(', ')}` }, 400);
  }

  const workerBase = `${new URL(c.req.url).protocol}//${new URL(c.req.url).hostname}`;

  const emailLower = email.toLowerCase().trim();

  // Renovación: si ya existe una licencia para este email, se reutiliza (misma license_key,
  // misma máquina y se conserva el vencimiento actual, que el pago extenderá). Si no, se crea.
  const existing = await env.LICENSES_DB
    .prepare('SELECT * FROM licenses WHERE email = ? ORDER BY created_at DESC LIMIT 1')
    .bind(emailLower)
    .first<License>();

  const licenseKey = existing?.license_key ?? generateLicenseKey();
  const externalRef = `plan:${planKey}:${emailLower}:${licenseKey}`;

  if (existing) {
    await env.LICENSES_DB
      .prepare('UPDATE licenses SET plan = ?, updated_at = datetime(\'now\') WHERE license_key = ?')
      .bind(planKey, licenseKey)
      .run();
  } else {
    await env.LICENSES_DB
      .prepare('INSERT INTO licenses (license_key, email, plan, status, next_billing, created_at, updated_at) VALUES (?, ?, ?, ?, NULL, datetime(\'now\'), datetime(\'now\'))')
      .bind(licenseKey, emailLower, planKey, 'pending')
      .run();
  }

  try {
    const preferenceResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            id: `plan-${planKey}`,
            title: `Vendeto - Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
            description: `Suscripción mensual al plan ${plan} de Vendeto`,
            quantity: 1,
            currency_id: 'ARS',
            unit_price: price,
          },
        ],
        payer: { email: emailLower },
        back_urls: {
          success: `${WEB_BASE_URL}/contratar-exito?license_key=${licenseKey}`,
          failure: `${WEB_BASE_URL}/contratar-error`,
          pending: `${WEB_BASE_URL}/contratar-exito?license_key=${licenseKey}`,
        },
        auto_return: 'approved',
        external_reference: externalRef,
        notification_url: `${workerBase}/webhook`,
        statement_descriptor: 'Vendeto Licencia',
      }),
    });

    const data: any = await preferenceResponse.json();

    if (!preferenceResponse.ok) {
      // Solo se borra si la acabamos de crear; una renovación no debe eliminar la existente.
      if (!existing) {
        await env.LICENSES_DB
          .prepare('DELETE FROM licenses WHERE license_key = ?')
          .bind(licenseKey)
          .run();
      }
      return c.json({ error: data.message || 'Failed to create preference' }, 500);
    }

    return c.json({ checkout_url: data.init_point, preference_id: data.id });
  } catch (e: any) {
    if (!existing) {
      await env.LICENSES_DB
        .prepare('DELETE FROM licenses WHERE license_key = ?')
        .bind(licenseKey)
        .run();
    }
    return c.json({ error: `Failed to create checkout: ${e.message}` }, 500);
  }
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const LANDING_CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;color:#1f2937;min-height:100vh}header{background:#fff;padding:2rem 1rem;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.05)}header h1{font-size:2rem;color:#2563eb}.subtitle{color:#4b5563;margin-top:.25rem}main{max-width:960px;margin:2rem auto;padding:0 1rem}.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem}.plan-card{background:#fff;border:1px solid #e5e7eb;border-radius:.75rem;padding:2rem;text-align:center;position:relative;transition:transform .15s,box-shadow .15s}.plan-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1)}.plan-card.popular{border-color:#2563eb}.plan-card h2{font-size:1.25rem;margin-bottom:.75rem}.price{font-size:2rem;font-weight:700;color:#1f2937;margin-bottom:1rem}.period{font-size:.875rem;font-weight:400;color:#4b5563}.badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#2563eb;color:#fff;padding:.25rem 1rem;border-radius:1rem;font-size:.75rem;font-weight:600;white-space:nowrap}.plan-card ul{list-style:none;margin:1rem 0 1.5rem}.plan-card li{padding:.375rem 0;color:#4b5563;font-size:.9rem}.plan-card li::before{content:"✓ ";color:#16a34a;font-weight:700}.note{font-size:.8rem;color:#9ca3af;margin-top:.5rem}.btn{display:inline-block;padding:.625rem 1.5rem;border:none;border-radius:.5rem;font-size:.95rem;font-weight:500;cursor:pointer;transition:background .15s;text-decoration:none}.btn-primary{background:#2563eb;color:#fff}.btn-primary:hover{background:#1d4ed8}.btn-secondary{background:#f3f4f6;color:#374151}.btn-secondary:hover{background:#e5e7eb}.btn-sm{padding:.375rem .75rem;font-size:.8rem}.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:100}.modal-overlay.hidden{display:none}.modal{background:#fff;padding:2rem;border-radius:.75rem;width:90%;max-width:400px;box-shadow:0 10px 25px rgba(0,0,0,.15)}.modal h3{margin-bottom:.5rem}.modal p{font-size:.9rem;color:#4b5563;margin-bottom:1rem}.modal input{width:100%;padding:.625rem;border:1px solid #e5e7eb;border-radius:.5rem;font-size:.95rem;margin-bottom:1rem}.modal input:focus{outline:none;border-color:#2563eb}.modal-actions{display:flex;gap:.75rem;justify-content:flex-end}.hidden{display:none}.loader{text-align:center;padding:.5rem;color:#4b5563;font-size:.875rem}.error{text-align:center;padding:.5rem;color:#dc2626;font-size:.875rem}.result-card{background:#fff;border-radius:.75rem;padding:3rem 2rem;text-align:center;max-width:520px;margin:2rem auto;box-shadow:0 1px 3px rgba(0,0,0,.05)}.result-card .icon{font-size:2.5rem;margin-bottom:1rem}.result-card.success .icon{color:#16a34a}.result-card.error .icon{color:#dc2626}.result-card h2{margin-bottom:.5rem}.result-card p{color:#4b5563;margin-bottom:1.5rem}.license-key-container{margin:1.5rem 0}.license-label{display:block;font-size:.8rem;color:#4b5563;margin-bottom:.5rem}.license-key-box{display:flex;gap:.5rem;align-items:center;justify-content:center}.license-key-box code{background:#f3f4f6;padding:.5rem 1rem;border-radius:.375rem;font-size:1.1rem;letter-spacing:.05em}.copied{color:#16a34a;font-size:.8rem;margin-top:.25rem;display:block}.instructions{text-align:left;margin-top:2rem}.instructions h3{margin-bottom:.5rem}.instructions ol{padding-left:1.25rem;color:#4b5563;font-size:.9rem}.instructions li{padding:.25rem 0}`;

const LANDING_JS = `const WORKER_URL=window.location.origin;let selectedPlan='';function openEmailModal(p){selectedPlan=p;document.getElementById('emailModal').classList.remove('hidden');document.getElementById('emailInput').value='';document.getElementById('errorMsg').classList.add('hidden');document.getElementById('loader').classList.add('hidden');document.getElementById('emailInput').focus()}function closeEmailModal(){document.getElementById('emailModal').classList.add('hidden')}async function startCheckout(){let e=document.getElementById('emailInput').value.trim();if(!e){showError('Ingresá tu email');return}if(!e.includes('@')||!e.includes('.')){showError('Ingresá un email válido');return}let btn=document.getElementById('checkoutBtn'),loader=document.getElementById('loader');btn.disabled=true;loader.classList.remove('hidden');hideError();try{let r=await fetch(WORKER_URL+'/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:selectedPlan,email:e})});let d=await r.json();if(!r.ok)throw new Error(d.error||'Error al crear el pago');if(d.checkout_url)window.location.href=d.checkout_url;else throw new Error('No se recibió URL de pago')}catch(err){showError(err.message||'Error de conexión')}finally{btn.disabled=false;loader.classList.add('hidden')}}function showError(e){let el=document.getElementById('errorMsg');el.textContent=e;el.classList.remove('hidden')}function hideError(){document.getElementById('errorMsg').classList.add('hidden')}document.getElementById('emailInput').addEventListener('keydown',e=>{if(e.key==='Enter')startCheckout()})`;

const LANDING_HTML = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Vendeto - Activá tu licencia</title><style>${LANDING_CSS}</style></head><body><header><h1>Vendeto</h1><p class="subtitle">Sistema de gestión para tu comercio</p></header><main><section class="plans" id="plans"><div class="plan-card" data-plan="gratuito"><h2>Plan Gratuito</h2><div class="price">$0<span class="period">/mes</span></div><ul><li>1 usuario con acceso completo</li><li>Hasta 500 productos</li><li>Seguimiento de ventas, caja y stock</li></ul><p class="note">Se obtiene al vencer la prueba gratuita</p></div><div class="plan-card popular" data-plan="basica"><div class="badge">Recomendado</div><h2>Plan Básico</h2><div class="price">$32.500<span class="period">/mes</span></div><ul><li>3 usuarios</li><li>Hasta 1000 productos</li><li>Todos los módulos activados</li></ul><button class="btn btn-primary" onclick="openEmailModal('basica')">Contratar</button></div><div class="plan-card" data-plan="maxima"><h2>Plan Máximo</h2><div class="price">$39.990<span class="period">/mes</span></div><ul><li>Usuarios ilimitados</li><li>Hasta 10000 productos</li><li>MercadoPago: verificación de compras al instante</li><li>Soporte prioritario por email y WhatsApp</li></ul><button class="btn btn-primary" onclick="openEmailModal('maxima')">Contratar</button></div></section></main><div class="modal-overlay hidden" id="emailModal"><div class="modal"><h3>Completá tu email</h3><p>Recibirás tu clave de licencia en este correo después del pago.</p><input type="email" id="emailInput" placeholder="tu@email.com" autocomplete="email"><div class="modal-actions"><button class="btn btn-secondary" onclick="closeEmailModal()">Cancelar</button><button class="btn btn-primary" id="checkoutBtn" onclick="startCheckout()">Ir a pagar</button></div><div class="loader hidden" id="loader">Procesando...</div><div class="error hidden" id="errorMsg"></div></div></div><script>${LANDING_JS}</script></body></html>`;

const SUCCESS_HTML = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Vendeto - Licencia activada</title><style>${LANDING_CSS}</style></head><body><header><h1>Vendeto</h1></header><main><section class="result-card success"><div class="icon">&#10003;</div><h2>Pago exitoso</h2><p>Tu licencia quedó asociada a tu email. Ahora activala en Vendeto.</p><div class="instructions"><h3>Instrucciones</h3><ol><li>Descargá e instal� Vendeto en tu computadora</li><li>Registrate con el mismo email con el que pagaste (te da una prueba de 7 días)</li><li>Si ya tenés cuenta, ingresá a Configuración y tocá "Buscar licencia"</li></ol></div></section></main></body></html>`;

const ERROR_HTML = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Vendeto - Error</title><style>${LANDING_CSS}</style></head><body><header><h1>Vendeto</h1></header><main><section class="result-card error"><div class="icon">&#10007;</div><h2>Hubo un problema</h2><p>No se pudo completar el pago. Revisá tus datos e intentá nuevamente.</p><a href="/" class="btn btn-primary">Volver a intentar</a></section></main></body></html>`;

app.get('/', (c) => c.html(LANDING_HTML));
app.get('/success.html', (c) => c.html(SUCCESS_HTML));
app.get('/error.html', (c) => c.html(ERROR_HTML));

export default app;
