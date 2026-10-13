import { Hono } from 'hono';
import { cors } from 'hono/cors';

interface Env {
  MAILER_INTERNAL_KEY?: string;
  ZEPTOMAIL_API_KEY?: string;
  FROM_EMAIL?: string;
  FROM_NAME?: string;
  CONTACT_TO?: string;
}

const ZEPTOMAIL_ENDPOINT = 'https://cpaas.zoho.com/v1.1/email';

// Límite de consultas por IP para el formulario de contacto público.
const CONTACT_MAX_PER_IP = 5;
const CONTACT_WINDOW_SECONDS = 60 * 60;
const CODE_MAX_PER_RECIPIENT = 5;
const CODE_WINDOW_SECONDS = 60 * 60;

const app = new Hono<{ Bindings: Env }>();

app.use('/contact', cors({
  origin: ['https://vendeto.com.ar', 'https://www.vendeto.com.ar', 'https://vendeto.vercel.app'],
}));

function checkInternalAuth(c: any, env: Env): boolean {
  if (!env.MAILER_INTERNAL_KEY) return false;
  const auth = c.req.header('Authorization') || '';
  return auth === `Bearer ${env.MAILER_INTERNAL_KEY}`;
}

function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Rate limit simple por IP usando la Cache API de Cloudflare (sin infra adicional).
// La clave se construye sobre el hostname real del worker (la Cache API rechaza hosts
// sintéticos); el Cache-Control define la ventana. Suficiente para un formulario de
// contacto público: frena spam, no es una garantía de consistencia.
async function excedeLimiteContacto(c: any): Promise<boolean> {
  const ip = c.req.header('cf-connecting-ip') || 'desconocida';
  const hostname = new URL(c.req.url).hostname;
  const url = `https://${hostname}/__ratelimit/contact/${encodeURIComponent(ip)}`;
  const cacheKey = new Request(url);
  const cached = await caches.default.match(cacheKey);
  let contador = cached ? Number(await cached.text()) || 0 : 0;
  if (contador >= CONTACT_MAX_PER_IP) return true;
  await caches.default.put(cacheKey, new Response(String(contador + 1), {
    headers: { 'Cache-Control': `max-age=${CONTACT_WINDOW_SECONDS}` },
  }));
  return false;
}

async function excedeLimiteCodigo(c: any, to: string): Promise<boolean> {
  const hostname = new URL(c.req.url).hostname;
  const cacheKey = new Request(`https://${hostname}/__ratelimit/send-code/${encodeURIComponent(to)}`);
  const cached = await caches.default.match(cacheKey);
  const count = cached ? Number(await cached.text()) || 0 : 0;
  if (count >= CODE_MAX_PER_RECIPIENT) return true;

  await caches.default.put(cacheKey, new Response(String(count + 1), {
    headers: { 'Cache-Control': `max-age=${CODE_WINDOW_SECONDS}` },
  }));
  return false;
}

function templateCodigo(kind: 'confirm' | 'reset', code: string) {
  if (kind === 'confirm') {
    return {
      subject: 'Confirmá tu email - Vendeto',
      text: `Tu código para confirmar tu email es: ${code}`,
      html: `<p>Tu código para confirmar tu email es: <strong>${code}</strong></p>`,
    };
  }

  return {
    subject: 'Código para restablecer tu contraseña - Vendeto',
    text: `Tu código para restablecer tu contraseña es: ${code}`,
    html: `<p>Tu código para restablecer tu contraseña es: <strong>${code}</strong></p>`,
  };
}

// Solo el backend local (autenticado con MAILER_INTERNAL_KEY) puede enviar códigos.
app.post('/send-code', async (c) => {
  const env = c.env;

  if (!checkInternalAuth(c, env)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (!env.ZEPTOMAIL_API_KEY) {
    return c.json({ error: 'ZEPTOMAIL_API_KEY no configurado' }, 500);
  }

  const body = await c.req.json<{ to?: string; kind?: string; code?: string }>();
  if (Object.keys(body).some(key => key !== 'to' && key !== 'kind' && key !== 'code')) {
    return c.json({ error: 'El cuerpo solo admite to, kind y code' }, 400);
  }
  const to = body.to?.trim().toLowerCase() ?? '';
  const kind = body.kind;
  const code = body.code;

  if (!esEmailValido(to)) {
    return c.json({ error: 'to es requerido y debe ser un email válido' }, 400);
  }
  if (kind !== 'confirm' && kind !== 'reset') {
    return c.json({ error: 'kind debe ser confirm o reset' }, 400);
  }
  if (!/^\d{6}$/.test(code ?? '')) {
    return c.json({ error: 'code debe tener exactamente 6 dígitos' }, 400);
  }
  if (await excedeLimiteCodigo(c, to)) {
    return c.json({ error: 'Demasiados códigos enviados a este email. Intentá más tarde.' }, 429);
  }

  const template = templateCodigo(kind, code);

  const from = {
    address: env.FROM_EMAIL ?? 'hola@vendeto.com.ar',
    name: env.FROM_NAME ?? 'Vendeto',
  };

  try {
    const response = await fetch(ZEPTOMAIL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Zoho-enczapikey ${env.ZEPTOMAIL_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: [{ email_address: { address: to } }],
        subject: template.subject,
        htmlbody: template.html,
        textbody: template.text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return c.json({ error: `ZeptoMail falló: ${response.status}`, detail: errorBody }, 502);
    }

    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: `Error enviando email: ${e.message}` }, 500);
  }
});

// Formulario de contacto público del sitio vendeto.com.ar. Envía a soporte@vendeto.com.ar
// con reply_to al email del cliente, para que soporte responda directo a la casilla del cliente.
app.post('/contact', async (c) => {
  const env = c.env;

  if (!env.ZEPTOMAIL_API_KEY) {
    return c.json({ error: 'ZEPTOMAIL_API_KEY no configurado' }, 500);
  }

  const body = await c.req.json<{ nombre?: string; email?: string; consulta?: string }>();
  const nombre = (body.nombre || '').trim();
  const email = (body.email || '').trim();
  const consulta = (body.consulta || '').trim();

  if (!nombre || nombre.length > 100) {
    return c.json({ error: 'Ingresá tu nombre (máx. 100 caracteres)' }, 400);
  }
  if (!esEmailValido(email)) {
    return c.json({ error: 'Ingresá un email válido' }, 400);
  }
  if (!consulta || consulta.length < 10 || consulta.length > 2000) {
    return c.json({ error: 'La consulta debe tener entre 10 y 2000 caracteres' }, 400);
  }

  if (await excedeLimiteContacto(c)) {
    return c.json({ error: 'Demasiadas consultas desde esta dirección. Intentá más tarde.' }, 429);
  }

  const to = env.CONTACT_TO || 'soporte@vendeto.com.ar';
  const asunto = `Consulta desde la web: ${nombre}`;

  const textBody = `Nueva consulta desde vendeto.com.ar\n\nNombre: ${nombre}\nEmail: ${email}\n\nConsulta:\n${consulta}\n\nResponder a: ${email}`;

  const htmlBody =
    '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">' +
    '<h2 style="color:#2563eb">Nueva consulta desde la web</h2>' +
    `<table style="border-collapse:collapse;margin:16px 0">` +
    `<tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#334155">Nombre</td><td style="padding:6px 0;color:#0f172a">${escapeHtml(nombre)}</td></tr>` +
    `<tr><td style="padding:6px 12px 6px 0;font-weight:600;color:#334155">Email</td><td style="padding:6px 0;color:#0f172a"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>` +
    '</table>' +
    `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;white-space:pre-wrap;color:#0f172a">${escapeHtml(consulta)}</div>` +
    `<p style="color:#64748b;font-size:0.85rem">Responder directamente a: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>` +
    '</div>';

  const from = {
    address: env.FROM_EMAIL ?? 'hola@vendeto.com.ar',
    name: env.FROM_NAME ?? 'Vendeto',
  };

  try {
    const response = await fetch(ZEPTOMAIL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Zoho-enczapikey ${env.ZEPTOMAIL_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: [{ email_address: { address: to } }],
        reply_to: [{ address: email, name: nombre }],
        subject: asunto,
        htmlbody: htmlBody,
        textbody: textBody,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return c.json({ error: `ZeptoMail falló: ${response.status}`, detail: errorBody }, 502);
    }

    return c.json({ ok: true });
  } catch (e: any) {
    return c.json({ error: `Error enviando consulta: ${e.message}` }, 500);
  }
});

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
