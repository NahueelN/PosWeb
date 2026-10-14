import { describe, expect, it } from 'vitest';
import app from './index';

function createEnv({
  remoteAccessKey,
  internalKey,
  adminKey,
}: {
  remoteAccessKey?: string;
  internalKey?: string;
  adminKey?: string;
} = {}) {
  let queries = 0;
  const env = {
    LICENSES_DB: {
      prepare: () => {
        queries += 1;
        return {
          bind: () => ({
            first: async () => null,
            run: async () => ({}),
          }),
        };
      },
    },
    MP_ACCESS_TOKEN: 'test-token',
    REMOTE_ACCESS_INTERNAL_KEY: remoteAccessKey,
    POSWEB_INTERNAL_KEY: internalKey,
    ADMIN_KEY: adminKey,
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
    const { env, queries } = createEnv({ remoteAccessKey: 'remote-access-key' });

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
    const { env, queries } = createEnv({ remoteAccessKey: 'remote-access-key' });

    const response = await app.fetch(statusRequest('/internal/status', 'Bearer remote-access-key'), env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ valid: false, error: 'License not found' });
    expect(queries()).toBe(1);
  });

  it('keeps /status public', async () => {
    const { env, queries } = createEnv({ remoteAccessKey: 'remote-access-key' });

    const response = await app.fetch(statusRequest('/status'), env);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ valid: false, error: 'License not found' });
    expect(queries()).toBe(1);
  });
});

function authenticatedRequest(path: string, authorization?: string, body: Record<string, unknown> = {}) {
  return new Request(`http://localhost${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe('internal license endpoint authentication', () => {
  it('rejects POSWEB_INTERNAL_KEY for /grant-license', async () => {
    const { env, queries } = createEnv({ internalKey: 'client-key', adminKey: 'admin-key' });

    const response = await app.fetch(
      authenticatedRequest('/grant-license', 'Bearer client-key', { email: 'buyer@example.com', plan: 'maxima' }),
      env,
    );

    expect(response.status).toBe(401);
    expect(queries()).toBe(0);
  });

  it('accepts ADMIN_KEY for /grant-license', async () => {
    const { env } = createEnv({ internalKey: 'client-key', adminKey: 'admin-key' });

    const response = await app.fetch(
      authenticatedRequest('/grant-license', 'Bearer admin-key', { email: 'buyer@example.com', plan: 'maxima' }),
      env,
    );

    expect(response.status).toBe(200);
  });

  it('rejects every key for /grant-license when ADMIN_KEY is unset', async () => {
    const { env, queries } = createEnv({ internalKey: 'client-key' });

    const response = await app.fetch(
      authenticatedRequest('/grant-license', 'Bearer any-key', { email: 'buyer@example.com', plan: 'maxima' }),
      env,
    );

    expect(response.status).toBe(401);
    expect(queries()).toBe(0);
  });

  it('keeps POSWEB_INTERNAL_KEY authorization for /license-by-email and /register', async () => {
    const { env } = createEnv({ internalKey: 'client-key', adminKey: 'admin-key' });

    const licenseResponse = await app.fetch(
      authenticatedRequest('/license-by-email', 'Bearer client-key', { email: 'buyer@example.com' }),
      env,
    );
    const registerResponse = await app.fetch(
      authenticatedRequest('/register', 'Bearer client-key', { email: 'buyer@example.com' }),
      env,
    );

    expect(licenseResponse.status).toBe(200);
    expect(registerResponse.status).toBe(200);
  });
});
