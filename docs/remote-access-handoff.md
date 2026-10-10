# Remote Access Handoff

Remote access exposes `https://<slug>.vendetoweb.com.ar` only while Vendeto is running. The Worker owns the slug and installation state; the desktop backend manages the connector child process.

## Runtime model

- The backend fetches the connector token and starts `vendeto-cloudflared.exe` with `TUNNEL_TOKEN` in its environment. The token is never passed to the frontend, command line, or logs.
- The connector is not a Windows service and does not require UAC. The mobile origin is local (`http://127.0.0.1:8543`), so a persistent tunnel would only serve 502 responses while Vendeto is closed.
- Configure development with `RemoteAccess__WorkerUrl` and `RemoteAccess__InternalKey`, or a gitignored `appsettings.Development.json`. Do not commit secret values.
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
