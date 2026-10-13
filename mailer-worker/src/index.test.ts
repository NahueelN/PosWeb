import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from './index';

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
      'https://cpaas.zoho.com/v1.1/email',
      expect.objectContaining({
        body: expect.stringContaining('123456'),
      }),
    );
    const payload = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
    expect(payload.subject).toBe(subject);
    expect(payload.htmlbody).toContain('123456');
    expect(payload.textbody).toContain('123456');
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
