import { Hono } from 'hono';

interface Env {
  MAILER_INTERNAL_KEY?: string;
  ZEPTOMAIL_API_KEY?: string;
  FROM_EMAIL?: string;
  FROM_NAME?: string;
}

const ZEPTOMAIL_ENDPOINT = 'https://cpaas.zoho.com/v1.1/email';

const app = new Hono<{ Bindings: Env }>();

function checkInternalAuth(c: any, env: Env): boolean {
  if (!env.MAILER_INTERNAL_KEY) return false;
  const auth = c.req.header('Authorization') || '';
  return auth === `Bearer ${env.MAILER_INTERNAL_KEY}`;
}

function esEmailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;