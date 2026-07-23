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
  basica: 999.99,
  media: 1999.99,
  maxima: 3999.99,
};

const VALID_PLANS = ['basica', 'media', 'maxima'];

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

      const terminalStatuses = ['refunded', 'cancelled', 'rejected', 'charged_back'];
      const newStatus = paymentStatus === 'approved' ? 'active'
        : terminalStatuses.includes(paymentStatus) ? 'cancelled'
        : 'pending';

      await env.LICENSES_DB
        .prepare('UPDATE licenses SET preapproval_id = ?, status = ?, updated_at = datetime(\'now\') WHERE license_key = ?')
        .bind(resourceId, newStatus, licenseKey)
        .run();

      return c.json({ success: true, license_key: licenseKey, status: newStatus });
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

    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    const nextBilling = date.toISOString().split('T')[0];

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

  if (license.status !== 'active' && license.status !== 'grace') {
    const msg = license.status === 'pending'
      ? 'El pago aún se está procesando. Esperá unos minutos y volvé a intentar.'
      : `La licencia está en estado "${license.status}". Contactá al soporte.`;
    return c.json({ success: false, error: msg }, 403);
  }

  await env.LICENSES_DB
    .prepare('UPDATE licenses SET machine_id = ?, activated_at = datetime(\'now\'), updated_at = datetime(\'now\') WHERE license_key = ?')
    .bind(machine_id, license.license_key)
    .run();

  return c.json({
    success: true,
    plan: license.plan,
    status: license.status,
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
          const nextBilling = new Date();
          nextBilling.setDate(nextBilling.getDate() + 30);
          await env.LICENSES_DB
            .prepare('UPDATE licenses SET status = ?, next_billing = ?, preapproval_id = ?, updated_at = datetime(\'now\') WHERE license_key = ?')
            .bind('active', nextBilling.toISOString().split('T')[0], approved.id.toString(), license.license_key)
            .run();
          license.status = 'active';
          license.next_billing = nextBilling.toISOString().split('T')[0];
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

  return c.json({
    valid: license.status === 'active' || license.status === 'grace',
    plan: license.plan,
    status: license.status,
    next_billing: license.next_billing,
    grace_until: license.grace_until,
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
    .prepare('SELECT * FROM licenses WHERE email = ? AND status IN (\'active\', \'grace\') ORDER BY created_at DESC LIMIT 1')
    .bind(email.toLowerCase().trim())
    .first<License>();

  if (!license) {
    return c.json({ found: false });
  }

  const now = new Date();
  const nextBillingDate = license.next_billing ? new Date(license.next_billing) : null;
  const daysRemaining = nextBillingDate
    ? Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return c.json({
    found: true,
    license_key: license.license_key,
    plan: license.plan,
    status: license.status,
    next_billing: license.next_billing,
    grace_until: license.grace_until,
    days_remaining: daysRemaining,
  });
});

app.post('/checkout', async (c) => {
  const env = c.env;
  const body = await c.req.json<{ plan: string; email: string }>();
  const { plan, email } = body;

  if (!plan || !email) {
    return c.json({ error: 'plan and email are required' }, 400);
  }

  const planKey = plan.toLowerCase();
  const price = PLAN_PRICES[planKey];
  if (!price) {
    return c.json({ error: `Invalid plan: ${plan}. Valid plans: ${VALID_PLANS.join(', ')}` }, 400);
  }

  const workerBase = `${new URL(c.req.url).protocol}//${new URL(c.req.url).hostname}`;

  const licenseKey = generateLicenseKey();
  const externalRef = `plan:${planKey}:${email}:${licenseKey}`;
  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + 30);
  const nextBillingStr = nextBilling.toISOString().split('T')[0];

  await env.LICENSES_DB
    .prepare(
      'INSERT INTO licenses (license_key, email, plan, status, next_billing, created_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'), datetime(\'now\'))'
    )
    .bind(licenseKey, email, planKey, 'pending', nextBillingStr)
    .run();

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
            title: `PosWeb - Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
            description: `Suscripción mensual al plan ${plan} de PosWeb`,
            quantity: 1,
            currency_id: 'ARS',
            unit_price: price,
          },
        ],
        payer: { email },
        back_urls: {
          success: `${workerBase}/success.html?license_key=${licenseKey}`,
          failure: `${workerBase}/error.html`,
          pending: `${workerBase}/success.html?license_key=${licenseKey}`,
        },
        auto_return: 'approved',
        external_reference: externalRef,
        notification_url: `${workerBase}/webhook`,
        statement_descriptor: 'PosWeb Licencia',
      }),
    });

    const data: any = await preferenceResponse.json();

    if (!preferenceResponse.ok) {
      await env.LICENSES_DB
        .prepare('DELETE FROM licenses WHERE license_key = ?')
        .bind(licenseKey)
        .run();
      return c.json({ error: data.message || 'Failed to create preference' }, 500);
    }

    return c.json({ checkout_url: data.init_point, preference_id: data.id });
  } catch (e: any) {
    await env.LICENSES_DB
      .prepare('DELETE FROM licenses WHERE license_key = ?')
      .bind(licenseKey)
      .run();
    return c.json({ error: `Failed to create checkout: ${e.message}` }, 500);
  }
});

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const LANDING_CSS = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;color:#1f2937;min-height:100vh}header{background:#fff;padding:2rem 1rem;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.05)}header h1{font-size:2rem;color:#2563eb}.subtitle{color:#4b5563;margin-top:.25rem}main{max-width:960px;margin:2rem auto;padding:0 1rem}.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.5rem}.plan-card{background:#fff;border:1px solid #e5e7eb;border-radius:.75rem;padding:2rem;text-align:center;position:relative;transition:transform .15s,box-shadow .15s}.plan-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.1)}.plan-card.popular{border-color:#2563eb}.plan-card h2{font-size:1.25rem;margin-bottom:.75rem}.price{font-size:2rem;font-weight:700;color:#1f2937;margin-bottom:1rem}.period{font-size:.875rem;font-weight:400;color:#4b5563}.badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:#2563eb;color:#fff;padding:.25rem 1rem;border-radius:1rem;font-size:.75rem;font-weight:600;white-space:nowrap}.plan-card ul{list-style:none;margin:1rem 0 1.5rem}.plan-card li{padding:.375rem 0;color:#4b5563;font-size:.9rem}.plan-card li::before{content:"✓ ";color:#16a34a;font-weight:700}.btn{display:inline-block;padding:.625rem 1.5rem;border:none;border-radius:.5rem;font-size:.95rem;font-weight:500;cursor:pointer;transition:background .15s;text-decoration:none}.btn-primary{background:#2563eb;color:#fff}.btn-primary:hover{background:#1d4ed8}.btn-secondary{background:#f3f4f6;color:#374151}.btn-secondary:hover{background:#e5e7eb}.btn-sm{padding:.375rem .75rem;font-size:.8rem}.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;z-index:100}.modal-overlay.hidden{display:none}.modal{background:#fff;padding:2rem;border-radius:.75rem;width:90%;max-width:400px;box-shadow:0 10px 25px rgba(0,0,0,.15)}.modal h3{margin-bottom:.5rem}.modal p{font-size:.9rem;color:#4b5563;margin-bottom:1rem}.modal input{width:100%;padding:.625rem;border:1px solid #e5e7eb;border-radius:.5rem;font-size:.95rem;margin-bottom:1rem}.modal input:focus{outline:none;border-color:#2563eb}.modal-actions{display:flex;gap:.75rem;justify-content:flex-end}.hidden{display:none}.loader{text-align:center;padding:.5rem;color:#4b5563;font-size:.875rem}.error{text-align:center;padding:.5rem;color:#dc2626;font-size:.875rem}.result-card{background:#fff;border-radius:.75rem;padding:3rem 2rem;text-align:center;max-width:520px;margin:2rem auto;box-shadow:0 1px 3px rgba(0,0,0,.05)}.result-card .icon{font-size:2.5rem;margin-bottom:1rem}.result-card.success .icon{color:#16a34a}.result-card.error .icon{color:#dc2626}.result-card h2{margin-bottom:.5rem}.result-card p{color:#4b5563;margin-bottom:1.5rem}.license-key-container{margin:1.5rem 0}.license-label{display:block;font-size:.8rem;color:#4b5563;margin-bottom:.5rem}.license-key-box{display:flex;gap:.5rem;align-items:center;justify-content:center}.license-key-box code{background:#f3f4f6;padding:.5rem 1rem;border-radius:.375rem;font-size:1.1rem;letter-spacing:.05em}.copied{color:#16a34a;font-size:.8rem;margin-top:.25rem;display:block}.instructions{text-align:left;margin-top:2rem}.instructions h3{margin-bottom:.5rem}.instructions ol{padding-left:1.25rem;color:#4b5563;font-size:.9rem}.instructions li{padding:.25rem 0}`;

const LANDING_JS = `const WORKER_URL=window.location.origin;let selectedPlan='';function openEmailModal(p){selectedPlan=p;document.getElementById('emailModal').classList.remove('hidden');document.getElementById('emailInput').value='';document.getElementById('errorMsg').classList.add('hidden');document.getElementById('loader').classList.add('hidden');document.getElementById('emailInput').focus()}function closeEmailModal(){document.getElementById('emailModal').classList.add('hidden')}async function startCheckout(){let e=document.getElementById('emailInput').value.trim();if(!e){showError('Ingresá tu email');return}if(!e.includes('@')||!e.includes('.')){showError('Ingresá un email válido');return}let btn=document.getElementById('checkoutBtn'),loader=document.getElementById('loader');btn.disabled=true;loader.classList.remove('hidden');hideError();try{let r=await fetch(WORKER_URL+'/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({plan:selectedPlan,email:e})});let d=await r.json();if(!r.ok)throw new Error(d.error||'Error al crear el pago');if(d.checkout_url)window.location.href=d.checkout_url;else throw new Error('No se recibió URL de pago')}catch(err){showError(err.message||'Error de conexión')}finally{btn.disabled=false;loader.classList.add('hidden')}}function showError(e){let el=document.getElementById('errorMsg');el.textContent=e;el.classList.remove('hidden')}function hideError(){document.getElementById('errorMsg').classList.add('hidden')}document.getElementById('emailInput').addEventListener('keydown',e=>{if(e.key==='Enter')startCheckout()})`;

const LANDING_HTML = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>PosWeb - Activá tu licencia</title><style>${LANDING_CSS}</style></head><body><header><h1>PosWeb</h1><p class="subtitle">Sistema de gestión para tu comercio</p></header><main><section class="plans" id="plans"><div class="plan-card" data-plan="basica"><h2>Plan Básico</h2><div class="price">$999<span class="period">/mes</span></div><ul><li>1 sucursal</li><li>1 administrador</li><li>1 usuario</li><li>Gestión de ventas</li><li>Control de stock</li><li>Caja diaria</li></ul><button class="btn btn-primary" onclick="openEmailModal('basica')">Contratar</button></div><div class="plan-card popular" data-plan="media"><div class="badge">Más popular</div><h2>Plan Medio</h2><div class="price">$1.999<span class="period">/mes</span></div><ul><li>Hasta 3 sucursales</li><li>1 administrador</li><li>Hasta 5 usuarios</li><li>Todo lo del plan Básico</li><li>Múltiples cajas</li><li>Reportes avanzados</li></ul><button class="btn btn-primary" onclick="openEmailModal('media')">Contratar</button></div><div class="plan-card" data-plan="maxima"><h2>Plan Máximo</h2><div class="price">$3.999<span class="period">/mes</span></div><ul><li>Sucursales ilimitadas</li><li>Admins ilimitados</li><li>Usuarios ilimitados</li><li>Todo lo del plan Medio</li><li>Soporte prioritario</li><li>Personalización</li></ul><button class="btn btn-primary" onclick="openEmailModal('maxima')">Contratar</button></div></section></main><div class="modal-overlay hidden" id="emailModal"><div class="modal"><h3>Completá tu email</h3><p>Recibirás tu clave de licencia en este correo después del pago.</p><input type="email" id="emailInput" placeholder="tu@email.com" autocomplete="email"><div class="modal-actions"><button class="btn btn-secondary" onclick="closeEmailModal()">Cancelar</button><button class="btn btn-primary" id="checkoutBtn" onclick="startCheckout()">Ir a pagar</button></div><div class="loader hidden" id="loader">Procesando...</div><div class="error hidden" id="errorMsg"></div></div></div><script>${LANDING_JS}</script></body></html>`;

const SUCCESS_HTML = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>PosWeb - Licencia activada</title><style>${LANDING_CSS}</style></head><body><header><h1>PosWeb</h1></header><main><section class="result-card success"><div class="icon">&#10003;</div><h2>Pago exitoso</h2><p>Tu licencia está lista. Copiá la clave y pegala en PosWeb para activarla.</p><div class="license-key-container"><span class="license-label">Tu clave de licencia:</span><div class="license-key-box"><code id="licenseKey">Cargando...</code><button class="btn btn-secondary btn-sm" onclick="copyLicenseKey()">Copiar</button></div><span class="copied hidden" id="copiedMsg">Copiado</span></div><div class="instructions"><h3>Instrucciones</h3><ol><li>Copiá la clave de licencia</li><li>Abrí PosWeb en tu computadora</li><li>Pegá la clave en la pantalla de activación</li><li>Iniciá sesión normalmente</li></ol></div></section></main><script>var p=new URLSearchParams(window.location.search);var k=p.get('license_key');if(k)document.getElementById('licenseKey').textContent=k;else document.getElementById('licenseKey').textContent='No se encontró la clave. Revisá tu email.';function copyLicenseKey(){var key=document.getElementById('licenseKey').textContent;navigator.clipboard.writeText(key).then(function(){var m=document.getElementById('copiedMsg');m.classList.remove('hidden');setTimeout(function(){m.classList.add('hidden')},2000)})}</script></body></html>`;

const ERROR_HTML = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>PosWeb - Error</title><style>${LANDING_CSS}</style></head><body><header><h1>PosWeb</h1></header><main><section class="result-card error"><div class="icon">&#10007;</div><h2>Hubo un problema</h2><p>No se pudo completar el pago. Revisá tus datos e intentá nuevamente.</p><a href="/" class="btn btn-primary">Volver a intentar</a></section></main></body></html>`;

app.get('/', (c) => c.html(LANDING_HTML));
app.get('/success.html', (c) => c.html(SUCCESS_HTML));
app.get('/error.html', (c) => c.html(ERROR_HTML));

export default app;
