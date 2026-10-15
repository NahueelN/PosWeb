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
const RELEASE_REPO = 'NahueelN/PosWeb';

// Límite de consultas por IP para el formulario de contacto público.
const CONTACT_MAX_PER_IP = 5;
const CONTACT_WINDOW_SECONDS = 60 * 60;

// Límite de envíos de instalador por IP.
const INSTALLER_MAX_PER_IP = 5;
const INSTALLER_WINDOW_SECONDS = 60 * 60;

const ALLOWED_ORIGINS = ['https://vendeto.com.ar', 'https://www.vendeto.com.ar', 'https://vendeto.vercel.app'];

const app = new Hono<{ Bindings: Env }>();

app.use('/contact', cors({ origin: ALLOWED_ORIGINS }));
app.use('/installer', cors({ origin: ALLOWED_ORIGINS }));

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
// sintéticos); el Cache-Control define la ventana. Suficiente para endpoints públicos:
// frena spam, no es una garantía de consistencia.
async function excedeLimite(c: any, bucket: string, max: number, windowSeconds: number): Promise<boolean> {
  const ip = c.req.header('cf-connecting-ip') || 'desconocida';
  const hostname = new URL(c.req.url).hostname;
  const url = `https://${hostname}/__ratelimit/${bucket}/${encodeURIComponent(ip)}`;
  const cacheKey = new Request(url);
  const cached = await caches.default.match(cacheKey);
  let contador = cached ? Number(await cached.text()) || 0 : 0;
  if (contador >= max) return true;
  await caches.default.put(cacheKey, new Response(String(contador + 1), {
    headers: { 'Cache-Control': `max-age=${windowSeconds}` },
  }));
  return false;
}

// Resuelve la URL del instalador desde el último release de GitHub (igual que api/latest.js
// del sitio). Prefiere el asset .exe y cae al html_url si no lo encuentra.
async function obtenerInstaladorUrl(): Promise<string> {
  const resp = await fetch(`https://api.github.com/repos/${RELEASE_REPO}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Vendeto-Web' },
  });
  if (!resp.ok) throw new Error(`GitHub API error ${resp.status}`);
  const data = await resp.json<{ html_url: string; assets?: Array<{ name: string; browser_download_url: string }> }>();
  const asset = data.assets?.find((a) => a.name.endsWith('-setup.exe') || a.name.endsWith('.exe'));
  return asset?.browser_download_url || data.html_url;
}

// Solo el backend local (autenticado con MAILER_INTERNAL_KEY) puede enviar.
app.post('/send', async (c) => {
  const env = c.env;

  if (!checkInternalAuth(c, env)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  if (!env.ZEPTOMAIL_API_KEY) {
    return c.json({ error: 'ZEPTOMAIL_API_KEY no configurado' }, 500);
  }

  // El backend serializa con SnakeCaseLower (html_body/text_body); también se acepta camelCase.
  const body = await c.req.json<{ to: string; subject: string; htmlBody?: string; textBody?: string; html_body?: string; text_body?: string }>();
  const { to, subject } = body;
  const htmlBody = body.htmlBody ?? body.html_body;
  const textBody = body.textBody ?? body.text_body;

  if (!to || !esEmailValido(to)) {
    return c.json({ error: 'to es requerido y debe ser un email válido' }, 400);
  }
  if (!subject || subject.length > 200) {
    return c.json({ error: 'subject es requerido (máx. 200 caracteres)' }, 400);
  }
  if ((!htmlBody || !htmlBody.trim()) && (!textBody || !textBody.trim())) {
    return c.json({ error: 'Se requiere htmlBody o textBody' }, 400);
  }

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
        subject,
        ...(htmlBody ? { htmlbody: htmlBody } : {}),
        ...(textBody ? { textbody: textBody } : {}),
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

  if (await excedeLimite(c, 'contact', CONTACT_MAX_PER_IP, CONTACT_WINDOW_SECONDS)) {
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

// Envía automáticamente el instalador de Vendeto al email del interesado. Pensado para el
// tráfico móvil de la campaña (Meta Ads): el usuario deja su email y recibe el link de
// descarga para abrir en su PC Windows, en lugar de intentar bajar un .exe en el celular.
app.post('/installer', async (c) => {
  const env = c.env;

  if (!env.ZEPTOMAIL_API_KEY) {
    return c.json({ error: 'ZEPTOMAIL_API_KEY no configurado' }, 500);
  }

  const body = await c.req.json<{ email?: string }>();
  const email = (body.email || '').trim();

  if (!esEmailValido(email)) {
    return c.json({ error: 'Ingresá un email válido' }, 400);
  }

  if (await excedeLimite(c, 'installer', INSTALLER_MAX_PER_IP, INSTALLER_WINDOW_SECONDS)) {
    return c.json({ error: 'Demasiadas solicitudes desde esta dirección. Intentá más tarde.' }, 429);
  }

  let downloadUrl: string;
  try {
    downloadUrl = await obtenerInstaladorUrl();
  } catch (e: any) {
    return c.json({ error: `No se pudo obtener la última versión: ${e.message}` }, 502);
  }

  const from = {
    address: env.FROM_EMAIL ?? 'hola@vendeto.com.ar',
    name: env.FROM_NAME ?? 'Vendeto',
  };
  const asunto = 'Tu instalador de Vendeto';
  const safeUrl = escapeHtml(downloadUrl);

  const textBody =
    '¡Gracias por tu interés en Vendeto!\n\n' +
    'Descargá el instalador para Windows desde este enlace:\n' +
    `${downloadUrl}\n\n` +
    'Si el enlace no funciona, copialo y pegalo en el navegador de tu PC.\n\n' +
    '— Equipo Vendeto';

  const htmlBody =
    '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">' +
    '<h2 style="color:#2563eb">Tu instalador de Vendeto</h2>' +
    '<p style="color:#334155">¡Gracias por tu interés en Vendeto! Descargá el instalador para Windows desde el siguiente enlace:</p>' +
    `<p style="margin:24px 0"><a href="${safeUrl}" style="background:#2563eb;color:#fff;text-decoration:none;font-weight:600;padding:14px 26px;border-radius:12px;display:inline-block">Descargar Vendeto</a></p>` +
    `<p style="color:#64748b;font-size:0.85rem">Si el botón no funciona, copiá y pegá este enlace en el navegador de tu PC:<br><a href="${safeUrl}">${safeUrl}</a></p>` +
    '<p style="color:#64748b;font-size:0.85rem">Vendeto se instala en una PC Windows.</p>' +
    '</div>';

  try {
    const response = await fetch(ZEPTOMAIL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Zoho-enczapikey ${env.ZEPTOMAIL_API_KEY}`,
      },
      body: JSON.stringify({
        from,
        to: [{ email_address: { address: email } }],
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
    return c.json({ error: `Error enviando instalador: ${e.message}` }, 500);
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