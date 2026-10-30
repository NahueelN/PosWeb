import { beforeEach, describe, expect, it, vi } from 'vitest';
import worker from './index';
import { createToken } from './unsubscribe';

const candidate = { email: 'a@example.com', source: 'installer', leadCreatedAt: new Date(Date.now() - 2 * 86400000).toISOString(), licenseCreatedAt: null, lastLogin: null, paid: 0 };
function db() {
  const run = vi.fn().mockResolvedValue({ success: true });
  const all = vi.fn().mockImplementation(async function(this: any) { return { results: this.sql.includes('WITH') ? [candidate] : [] }; });
  return { run, prepare: vi.fn((sql: string) => ({ sql, all, bind: vi.fn().mockReturnValue({ run }) })) };
}
const env = (DB: any) => ({ DB, MAILER_INTERNAL_KEY: 'key', UNSUBSCRIBE_SECRET: 'secret', ZEPTOMAIL_API_KEY: 'key', DRY_RUN: 'true', TRIAL_DAYS: '7', TRIAL_PROMO_DAYS: '30', TRIAL_PROMO_UNTIL: '2026-12-01', MAX_PER_RUN: '50', PUBLIC_URL: 'https://mailer.test' });

describe('follow-up endpoints and cron', () => {
  beforeEach(() => vi.restoreAllMocks());
  it('protects preview and returns the selected list without sending', async () => {
    const database = db();
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    const unauthorized = await worker.fetch(new Request('https://mailer.test/internal/followups/preview', { method: 'POST' }), env(database));
    expect(unauthorized.status).toBe(401);
    const response = await worker.fetch(new Request('https://mailer.test/internal/followups/preview', { method: 'POST', headers: { Authorization: 'Bearer key' } }), env(database));
    expect(await response.json()).toMatchObject([{ email: 'a@example.com', kind: 'installer_nudge' }]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('requires confirmation by POST and rejects invalid tokens on both methods', async () => {
    const database = db();
    const invalidGet = await worker.fetch(new Request('https://mailer.test/unsubscribe?e=a%40example.com&t=bad'), env(database));
    expect(invalidGet.status).toBe(400);
    expect(await invalidGet.text()).toContain('Enlace inválido.');
    const invalidPost = await worker.fetch(new Request('https://mailer.test/unsubscribe', { method: 'POST', body: new URLSearchParams({ e: 'a@example.com', t: 'bad' }) }), env(database));
    expect(invalidPost.status).toBe(400);
    expect(await invalidPost.text()).toContain('Enlace inválido.');
    const token = await createToken('secret', 'a@example.com');
    const response = await worker.fetch(new Request(`https://mailer.test/unsubscribe?e=a%40example.com&t=${token}`), env(database));
    expect(response.status).toBe(200);
    const html = await response.text();
    expect(html).toContain('¿Querés dejar de recibir estos mails?');
    expect(html).toMatch(/<form[^>]*method="post"/i);
    expect(html).toContain('name="e"');
    expect(html).toContain('name="t"');
    expect(html).toContain('Darme de baja');
    expect(database.run).not.toHaveBeenCalled();
    const confirmed = await worker.fetch(new Request('https://mailer.test/unsubscribe', { method: 'POST', body: new URLSearchParams({ e: 'a@example.com', t: token }) }), env(database));
    expect(confirmed.status).toBe(200);
    expect(await confirmed.text()).toContain('Listo, no vas a recibir más estos mails.');
    expect(database.run).toHaveBeenCalledTimes(1);
  });
  it('dry run does not send or log', async () => {
    const database = db();
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await worker.scheduled({} as any, env(database));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(database.run).not.toHaveBeenCalled();
  });
  it('logs only successful sends', async () => {
    const database = db();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => String(url).includes('github.com') ? Response.json({ html_url: 'https://example.com/setup.exe' }) : new Response('', { status: 200 }));
    await worker.scheduled({} as any, { ...env(database), DRY_RUN: 'false' });
    expect(database.run).toHaveBeenCalledTimes(1);
  });
  it('does not log failed sends and continues with the next recipient', async () => {
    const database = db();
    const originalPrepare = database.prepare;
    database.prepare = vi.fn((sql: string) => {
      if (!sql.includes('WITH')) return originalPrepare(sql);
      return { all: vi.fn().mockResolvedValue({ results: [candidate, { ...candidate, email: 'b@example.com' }] }) } as any;
    });
    const send = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
      if (String(url).includes('github.com')) return Response.json({ html_url: 'https://example.com/setup.exe' });
      return new Response('', { status: send.mock.calls.filter(call => !String(call[0]).includes('github.com')).length === 1 ? 500 : 200 });
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await worker.scheduled({} as any, { ...env(database), DRY_RUN: 'false' });
    expect(send).toHaveBeenCalledTimes(3);
    expect(send.mock.calls.filter(call => String(call[0]).includes('github.com'))).toHaveLength(1);
    expect(database.run).toHaveBeenCalledTimes(1);
  });
  it('does not fetch the installer for other follow-up kinds', async () => {
    const database = db();
    const originalPrepare = database.prepare;
    database.prepare = vi.fn((sql: string) => sql.includes('WITH')
      ? { all: vi.fn().mockResolvedValue({ results: [{ ...candidate, licenseCreatedAt: new Date(Date.now() - 4 * 86400000).toISOString() }] }) } as any
      : originalPrepare(sql));
    const send = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 200 }));
    await worker.scheduled({} as any, { ...env(database), DRY_RUN: 'false' });
    expect(send).toHaveBeenCalledTimes(1);
    expect(String(send.mock.calls[0][0])).not.toContain('github.com');
  });
});
