import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from './index';

const env = {
  MAILER_INTERNAL_KEY: 'internal-key',
  ZEPTOMAIL_API_KEY: 'zepto-key',
};

function request(body: unknown) {
  return app.request('https://mailer.test/send-code', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer internal-key',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }, env);
}

function reportRequest(body: unknown, auth = 'Bearer internal-key') {
  return app.request('https://mailer.test/send-report', {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }, env);
}

function mockRateLimitCache() {
  globalThis.caches = {
    default: {
      match: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    },
  } as unknown as CacheStorage;
}

describe('POST /send-code', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.caches = {
      default: {
        match: vi.fn().mockResolvedValue(undefined),
        put: vi.fn().mockResolvedValue(undefined),
      },
    } as unknown as CacheStorage;
  });

  it('rejects the former arbitrary HTML payload', async () => {
    const response = await request({
      to: 'customer@example.com',
      kind: 'confirm',
      code: '123456',
      subject: 'Injected subject',
      htmlBody: '<script>alert(1)</script>',
      textBody: 'Injected text',
    });

    expect(response.status).toBe(400);
  });

  it.each([
    [{ to: 'customer@example.com', kind: 'marketing', code: '123456' }],
    [{ to: 'customer@example.com', kind: 'confirm', code: '12ab56' }],
  ])('rejects invalid template parameters: %o', async (body) => {
    const response = await request(body);

    expect(response.status).toBe(400);
  });

  it.each([
    ['confirm', 'Confirmá tu email - Vendeto'],
    ['reset', 'Código para restablecer tu contraseña - Vendeto'],
  ])('sends the fixed %s template through ZeptoMail', async (kind, subject) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));

    const response = await request({ to: 'customer@example.com', kind, code: '123456' });

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.zeptomail.com/v1.1/email',
      expect.objectContaining({
        body: expect.stringContaining('123456'),
      }),
    );
    const payload = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(payload.subject).toBe(subject);
    expect(payload.htmlbody).toContain('123456');
    expect(payload.textbody).toContain('123456');
    expect(payload.htmlbody).toContain('Expira en 15 minutos.');
    expect(payload.textbody).toContain('Expira en 15 minutos.');
    expect(payload.htmlbody).toContain('Si no lo pediste vos, ignorá este mensaje.');
    expect(payload.textbody).toContain('Si no lo pediste vos, ignorá este mensaje.');
  });

  it('limits each recipient to five codes per hour', async () => {
    let count = 0;
    globalThis.caches.default.match = vi.fn().mockImplementation(async () =>
      count === 0 ? undefined : new Response(String(count)));
    globalThis.caches.default.put = vi.fn().mockImplementation(async (_key, response) => {
      count = Number(await response.text());
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));

    for (let i = 0; i < 5; i++) {
      expect((await request({ to: 'customer@example.com', kind: 'confirm', code: '123456' })).status).toBe(200);
    }

    expect((await request({ to: 'customer@example.com', kind: 'confirm', code: '123456' })).status).toBe(429);
  });
});

describe('POST /send-report', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRateLimitCache();
  });

  it('requires the internal bearer key', async () => {
    const response = await reportRequest({ descripcion: 'El QR no se genera al cobrar' }, 'Bearer otra-clave');

    expect(response.status).toBe(401);
  });

  it('sends the report with titular as reply_to and logs attachment', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));

    const response = await reportRequest({
      titular_email: 'titular@example.com',
      reportado_por: 'vendedor (vendedor@example.com)',
      descripcion: 'El QR de MercadoPago no se genera',
      version: '1.1.26',
      attachment: { name: 'posweb-logs.txt', content: 'bG9ncw==' },
    });

    expect(response.status).toBe(200);
    const payload = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(payload.to[0].email_address.address).toBe('soporte@vendeto.com.ar');
    expect(payload.reply_to).toEqual([{ address: 'titular@example.com' }]);
    expect(payload.subject).toContain('1.1.26');
    expect(payload.attachments).toEqual([{ name: 'posweb-logs.txt', content: 'bG9ncw==', mime_type: 'text/plain' }]);
    expect(payload.htmlbody).toContain('El QR de MercadoPago no se genera');
    expect(payload.textbody).toContain('titular@example.com');
  });

  it('rejects unknown fields, short descriptions and oversized attachments', async () => {
    expect((await reportRequest({ descripcion: 'El QR no se genera al cobrar', extra: 'x' })).status).toBe(400);
    expect((await reportRequest({ descripcion: 'corto' })).status).toBe(400);
    expect((await reportRequest({
      descripcion: 'El QR no se genera al cobrar',
      attachment: { name: 'logs.txt', content: 'x'.repeat(5 * 1024 * 1024) },
    })).status).toBe(400);
  });

  it('sends without reply_to when there is no titular email', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));

    const response = await reportRequest({ descripcion: 'La impresora no imprime los tickets' });

    expect(response.status).toBe(200);
    const payload = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(payload.reply_to).toBeUndefined();
    expect(payload.attachments).toBeUndefined();
  });
});

describe('lead storage', () => {
  beforeEach(() => { vi.restoreAllMocks(); mockRateLimitCache(); });

  it.each([
    ['installer', { email: ' User@Example.com ' }, ['user@example.com', null, 'installer']],
    ['contact', { nombre: ' Ana ', email: ' User@Example.com ', consulta: 'Necesito ayuda por favor' }, ['user@example.com', 'Ana', 'contact']],
  ])('saves a normalized %s lead before sending', async (route, body, values) => {
    const run = vi.fn().mockResolvedValue({});
    const bind = vi.fn().mockReturnValue({ run });
    const DB = { prepare: vi.fn().mockReturnValue({ bind }) };
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).includes('api.github.com')) return Response.json({ html_url: 'https://example.com/download' });
      expect(run).toHaveBeenCalled();
      return new Response('', { status: 200 });
    });
    const response = await app.request(`https://mailer.test/${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }, { ...env, DB });
    expect(response.status).toBe(200);
    expect(bind).toHaveBeenCalledWith(...values);
    expect(fetchMock).toHaveBeenCalled();
  });

  it('continues sending when D1 fails', async () => {
    const DB = { prepare: vi.fn().mockImplementation(() => { throw new Error('D1 unavailable'); }) };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));
    const response = await app.request('https://mailer.test/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nombre: 'Ana', email: 'ana@example.com', consulta: 'Necesito ayuda por favor' }) }, { ...env, DB });
    expect(response.status).toBe(200);
  });
});

describe('installer URL lookup', () => {
  const DB = { prepare: vi.fn(() => ({ bind: () => ({ run: vi.fn().mockResolvedValue({}) }) })) };
  const installerRequest = (extra = {}) => app.request('https://mailer.test/installer', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'user@example.com' }),
  }, { ...env, DB, ...extra });

  beforeEach(() => { vi.restoreAllMocks(); mockRateLimitCache(); });

  it('sends the token and caches the resolved installer for ten minutes', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async url => String(url).includes('api.github.com')
      ? Response.json({ html_url: 'https://example.com/release', assets: [{ name: 'app-setup.exe', browser_download_url: 'https://example.com/setup.exe' }] })
      : new Response('', { status: 200 }));
    expect((await installerRequest({ GITHUB_TOKEN: 'github-secret' })).status).toBe(200);
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Accept: 'application/vnd.github+json', 'User-Agent': 'Vendeto-Web', Authorization: 'Bearer github-secret' });
    const [key, response] = vi.mocked(caches.default.put).mock.calls.find(([request]) => String((request as Request).url).includes('/__cache/installer-url'))!;
    expect((key as Request).url).toBe('https://mailer.test/__cache/installer-url');
    expect(response.headers.get('Cache-Control')).toBe('max-age=600');
    expect(await response.text()).toBe('https://example.com/setup.exe');
  });

  it('uses a cached URL without contacting GitHub', async () => {
    vi.mocked(caches.default.match).mockImplementation(async key => String((key as Request).url).includes('/__cache/installer-url') ? new Response('https://example.com/cached.exe') : undefined);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));
    expect((await installerRequest()).status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1]!.body as string).textbody).toContain('https://example.com/cached.exe');
  });

  it.each(['403', 'network'])('sends the fallback installer when GitHub fails with %s', async failure => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async url => {
      if (String(url).includes('api.github.com')) {
        if (failure === 'network') throw new Error('network failure');
        return new Response('', { status: 403 });
      }
      return new Response('', { status: 200 });
    });
    const response = await installerRequest();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    const payload = JSON.parse(fetchMock.mock.calls[1][1]!.body as string);
    expect(payload.textbody).toContain('https://github.com/NahueelN/PosWeb/releases/latest');
    expect(error).toHaveBeenCalled();
    if (failure === '403') expect(error.mock.calls.flat().join(' ')).toContain('403');
    expect(vi.mocked(caches.default.put).mock.calls.some(([key]) => String((key as Request).url).includes('/__cache/installer-url'))).toBe(false);
  });
});
