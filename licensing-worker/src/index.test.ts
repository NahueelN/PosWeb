import { describe, expect, it } from 'vitest';
import app from './index';

function createEnv(remoteAccessKey?: string) {
  let queries = 0;
  const env = {
    LICENSES_DB: {
      prepare: () => {
        queries += 1;
        return {
          bind: () => ({
            first: async () => null,
          }),
        };
      },
    },
    MP_ACCESS_TOKEN: 'test-token',
    REMOTE_ACCESS_INTERNAL_KEY: remoteAccessKey,
  };

  return { env, queries: () => queries };
}

function statusRequest(path: '/status' | '/internal/status', authorization?: string) {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: JSON.stringify({ license_key: 'license-key', machine_id: 'machine-id' }),
  });
}

describe('license status authentication', () => {
  it('rejects /internal/status without an authorization key', async () => {
    const { env, queries } = createEnv('remote-access-key');

    const response = await app.fetch(statusRequest('/internal/status'), env);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ valid: false, error: 'Unauthorized' });
    expect(queries()).toBe(0);
  });

  it('rejects /internal/status when the remote access key is unset', async () => {
    const { env, queries } = createEnv();

    const response = await app.fetch(statusRequest('/internal/status', 'Bearer any-key'), env);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ valid: false, error: 'Unauthorized' });
    expect(queries()).toBe(0);
  });

  it('delegates /internal/status to the status handler with the configured key', async () => {
    const { env, queries } = createEnv('remote-access-key');

    const response = await app.fetch(statusRequest('/internal/status', 'Bearer remote-access-key'), env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ valid: false, error: 'License not found' });
    expect(queries()).toBe(1);
  });

  it('keeps /status public', async () => {
    const { env, queries } = createEnv('remote-access-key');

    const response = await app.fetch(statusRequest('/status'), env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ valid: false, error: 'License not found' });
    expect(queries()).toBe(1);
  });
});
