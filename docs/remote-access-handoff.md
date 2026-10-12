# Remote Access Handoff

Remote access exposes `https://<slug>.vendetoweb.com.ar` only while Vendeto is running. The Worker owns the slug and installation state; the desktop backend manages the connector child process.

## Runtime model

- The backend fetches the connector token and starts `vendeto-cloudflared.exe` with `TUNNEL_TOKEN` in its environment. The token is never passed to the frontend, command line, or logs.
- The connector is not a Windows service and does not require UAC. The mobile origin is local (`http://127.0.0.1:8543`), so a persistent tunnel would only serve 502 responses while Vendeto is closed.
- Configure development with `RemoteAccess__WorkerUrl` and `RemoteAccess__InternalKey`, or a gitignored `appsettings.Development.json`. Do not commit secret values.
- For a fresh local Tauri database, set `$env:Licensing__DevTrialBootstrap = 'true'` before `npm run tauri dev`. This only creates the seed trial; it does not enable remote access, which requires a real license. Never place this flag in release configuration.
- Embedded defaults have lower precedence than on-disk configuration and environment variables. This permits development overrides and CI injection; review all production overrides accordingly.
- Cloudflared is pinned to the latest stable GitHub release and its published SHA-256. Review the pin for every desktop release.

## State contract

| Database state | API status |
| --- | --- |
| no row or `disabled` | `inactive` |
| `provisioning` | `provisioning` |
| `failed` | `failed` with `lastError` |
| `provisioned`, healthy tunnel | `active` |
| `provisioned`, unhealthy/unavailable lookup | `waiting_connector` |

## Development environment

Every step requires explicit authorization and uses the isolated `dev` Worker only.

1. Create `vendeto-remote-access-dev` with `npx wrangler d1 create vendeto-remote-access-dev`, then replace `<DEV_D1_ID>` in `env.dev`.
2. Apply `npx wrangler d1 migrations apply vendeto-remote-access-dev --remote --env dev`.
3. Configure dev-only `INTERNAL_KEY`, `CF_PROVISIONER_TOKEN`, `CF_ACCOUNT_ID`, and `CF_ZONE_ID` with `npx wrangler secret put <NAME> --env dev`. Do not configure `LICENSING_*`.
4. Deploy with `npx wrangler deploy --env dev`.
5. Rebuild the sidecar, then set `RemoteAccess__WorkerUrl`, `RemoteAccess__InternalKey`, `RemoteAccess__AllowTrial='true'`, and `Licensing__DevTrialBootstrap='true'` before `npm run tauri dev`.
6. Deactivate every dev slug before deleting the dev Worker.
7. To restore `admin`/`123` only for local development, set `$env:Seed__ResetAdminPassword = 'true'` alongside `Licensing__DevTrialBootstrap` before `npm run tauri dev`. Never add this flag to release configuration.

The dev `INTERNAL_KEY` must never enter GitHub secrets or release configuration. The UI suffix remains `.vendetoweb.com.ar`; when active, use the link shown by the UI, whose actual hostname is `dev-<slug>.vendetoweb.com.ar`.

## Manual deployment runbook

Every step below requires explicit authorization. Do not deploy Workers, configure remote secrets, or change Cloudflare resources otherwise.

1. **Requires explicit authorization:** inspect the existing remote D1 schema for `remote_access_installations`.
2. **Requires explicit authorization:** apply migration `0001_remote_access_installations.sql` only after confirming the schema is compatible.
3. **Requires explicit authorization:** confirm `REMOTE_ACCESS_INTERNAL_KEY` exists in the legacy licensing account.
4. **Requires explicit authorization:** deploy `licensing-worker`; `/status` remains public and only `/internal/status` requires the remote-access key.
5. **Requires explicit authorization:** set `INTERNAL_KEY`, `LICENSING_WORKER_URL`, `LICENSING_REMOTE_ACCESS_KEY`, `CF_PROVISIONER_TOKEN`, `CF_ACCOUNT_ID`, and `CF_ZONE_ID` in the remote-access Worker.
6. **Requires explicit authorization:** deploy `vendeto-remote-access`.
7. **Requires explicit authorization:** add Cloudflare rate limiting for remote-access Worker routes.
8. **Requires explicit authorization:** set GitHub secrets `REMOTE_ACCESS_WORKER_URL` and `REMOTE_ACCESS_INTERNAL_KEY`.
9. **Requires explicit authorization:** perform an end-to-end test with one unused slug, activation, connector health, and deactivation.
10. **Requires explicit authorization:** generate an `ADMIN_KEY`, store it only in the approved secret manager, then run `wrangler secret put ADMIN_KEY` in the legacy licensing account. Deploy `licensing-worker`; use this key only for `/grant-license` and never ship it in an installer or client configuration.
11. **Requires explicit authorization:** apply remote-access migration `0002_activation_cooldown.sql` to both the dev and production D1 databases, then redeploy `vendeto-remote-access` in each environment.
12. **Requires explicit authorization:** optionally configure `ALERT_WEBHOOK_URL` as a remote-access Worker secret for capacity alerts. Do not commit or document its value.
13. **Requires explicit authorization:** in a non-Development run without `Seed__ResetAdminPassword`, change the `admin` password, restart Vendeto, and confirm the changed password still works.
14. **Requires explicit authorization:** verify orphan cleanup: start `tauri dev`, run `taskkill /f /im posweb-backend.exe`, and confirm `vendeto-cloudflared.exe` exits within seconds. Run `taskkill /f /im app.exe` and confirm `vendeto-mobile.exe` exits within seconds.
15. Existing customer installs retain `admin`/`123` until the password is changed; remote-access activation now requires that change. Fresh customer installs have no usable seed admin account.

## Validation commands

Run from PowerShell:

```text
cd vendeto-remote-access; npx vitest run; npx wrangler deploy --dry-run
cd licensing-worker; npx wrangler deploy --dry-run
dotnet build PosWeb/PosWeb.csproj
dotnet test PosWeb.Application.Test/PosWeb.Application.Test.csproj
cd frontend; npx vitest run; npm run build; npm run lint
cd frontend/src-tauri; cargo check
```
