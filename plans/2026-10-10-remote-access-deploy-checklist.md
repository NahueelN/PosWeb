# Remote Access Deploy Checklist

Operator: you (manual). Every step changes real Cloudflare or GitHub state. Run the commands from **PowerShell**, never paste secret values into chat, docs or commits, and use `wrangler secret put` so values are typed at the prompt instead of landing in shell history.

Expands `docs/remote-access-handoff.md` → "Manual deployment runbook". Code baseline: `8e9312d` (audit verdict: APROBADO CON OBSERVACIONES).

## Gotchas this checklist accounts for

1. **Two Cloudflare accounts.** `licensing-worker` → legacy account `7b16f3cf…` (`licensing-worker/wrangler.jsonc`). `vendeto-remote-access` + zone `vendetoweb.com.ar` → Vendeto account `c2c300a4…` (`vendeto-remote-access/wrangler.jsonc`). `wrangler` must be logged in with a user that can access the account of each phase.
2. **Secrets cannot be read back.** `LICENSING_REMOTE_ACCESS_KEY` (remote-access) must equal `REMOTE_ACCESS_INTERNAL_KEY` (licensing). If you don't have that value stored somewhere safe, **rotate it**: generate a new one and set it in both Workers (Phase 2 + Phase 4).
3. **Rate limiting does not apply to `*.workers.dev`.** WAF rules only cover hostnames inside the zone. Real rate limiting needs the Worker on a custom domain in `vendetoweb.com.ar` (Phase 6). It is not required for the first end-to-end test, but it is required before shipping a release to customers.

## Phase 0: Preconditions

- [ ] Working tree at the audited code: `git log --oneline -1` shows `8e9312d` or later, with the pending R1 frontend fix merged if available.
- [ ] Validation is green for the remote-access parts (see the audit). Pre-existing `TicketResultado` failures are known.
- [ ] Have a password manager entry ready for: `INTERNAL_KEY`, `REMOTE_ACCESS_INTERNAL_KEY`, `CF_PROVISIONER_TOKEN`.
- [ ] Generate two random keys (run twice, store each immediately):
  ```powershell
  node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
  ```
   - Key A → `REMOTE_ACCESS_INTERNAL_KEY` / `LICENSING_REMOTE_ACCESS_KEY` (Worker ↔ Worker; server-side only).
   - Key B → `INTERNAL_KEY` / `RemoteAccess:InternalKey` (desktop → Worker; ships inside installers, so treat it as a client identifier).
   - Key C → `ADMIN_KEY` (legacy licensing Worker only; never ship it in an installer or client configuration).
- [ ] Generate Key C with the same command, store it only in the approved secret manager, and never paste it into a document, commit, or client configuration.

## Phase 1: Inspect remote D1 (Vendeto account, read-only)

```powershell
cd vendeto-remote-access
npx wrangler whoami
npx wrangler d1 execute vendeto-remote-access --remote --command "SELECT name, sql FROM sqlite_master WHERE name LIKE 'remote_access%' OR name = 'd1_migrations'"
npx wrangler d1 migrations list vendeto-remote-access --remote
```

Decide:
- [ ] **No `remote_access_installations` table** → go to Phase 3.
- [ ] **Table exists and matches the migration** (has `dns_record_id`, the CHECK, and the `remote_access_installations_active_slug` index) → Phase 3 (the migration is `IF NOT EXISTS`).
- [ ] **Table exists with a different schema** (e.g. no `dns_record_id`, created by hand earlier):
  ```powershell
  npx wrangler d1 execute vendeto-remote-access --remote --command "SELECT COUNT(*) AS n FROM remote_access_installations"
  ```
  - `n = 0` → drop it, then Phase 3: `npx wrangler d1 execute vendeto-remote-access --remote --command "DROP TABLE remote_access_installations"`
  - `n > 0` → **STOP**. Those rows may own real tunnels/DNS. Bring the output back for a migration plan.

## Phase 2: Licensing Worker (legacy account)

```powershell
cd ..\licensing-worker
npx wrangler whoami            # must have access to account 7b16f3cf…
npx wrangler secret list       # names only
npx wrangler deployments list  # note the current version id for rollback
```

- [ ] If `REMOTE_ACCESS_INTERNAL_KEY` is missing, or you don't hold its value: `npx wrangler secret put REMOTE_ACCESS_INTERNAL_KEY` (paste Key A).
- [ ] Check that deploying HEAD won't ship unrelated unreleased licensing changes: compare `git log --oneline -- licensing-worker` with what the current deployment is known to contain. If unsure, **STOP** and review the diff first.
- [ ] Pending licensing D1 migrations? `npx wrangler d1 migrations list posweb-licenses --remote`. If any are pending, **STOP**: that's a separate release, not part of this change.
- [ ] Set the server-only grant key: `npx wrangler secret put ADMIN_KEY` (paste Key C at the prompt). Never use `POSWEB_INTERNAL_KEY` for `/grant-license`, and never expose `ADMIN_KEY` to a client.
- [ ] Deploy: `npx wrangler deploy`
- [ ] Smoke test: `/status` must stay public, and `/internal/status` must reject calls without the key.
  ```powershell
  $u = 'https://posweb-licensing.chiacchio-eze01.workers.dev'
  try { Invoke-RestMethod "$u/internal/status" -Method Post -ContentType 'application/json' -Body '{}' } catch { $_.Exception.Response.StatusCode.value__ }   # expect 401
  try { Invoke-RestMethod "$u/status" -Method Post -ContentType 'application/json' -Body '{"license_key":"x","machine_id":"y"}' } catch { $_.Exception.Response.StatusCode.value__ }  # must NOT be 401
  ```
- Rollback: `npx wrangler rollback <previous-version-id>`.

## Phase 3: Remote-access D1 migration (Vendeto account)

```powershell
cd ..\vendeto-remote-access
npx wrangler d1 migrations apply vendeto-remote-access --remote
npx wrangler d1 execute vendeto-remote-access --remote --command "SELECT name FROM sqlite_master WHERE name LIKE 'remote_access%'"
```

- [ ] The output lists both the table and `remote_access_installations_active_slug`.
- [ ] Confirm migration `0002_activation_cooldown.sql` is applied. Repeat this phase with `--env dev` against the isolated dev D1 database before deploying the dev Worker.

## Phase 4: Remote-access secrets + deploy (Vendeto account)

- [ ] **Zero Trust must be onboarded on the Vendeto account** (Dashboard → Zero Trust → complete the setup, including a payment method, even on the free plan). Without it, the API still creates tunnels and returns tokens, but `cloudflared` fails with `Register tunnel error from server side: Unauthorized: Tunnel not found` (found during the dev end-to-end test on 2026-10-12).
- [ ] Create the API token in the Vendeto account (Dashboard → My Profile → API Tokens → Create custom token). Use minimum scope:
  - Account → **Cloudflare Tunnel: Edit** (account `c2c300a4…` only)
  - Zone → **DNS: Edit** (zone `vendetoweb.com.ar` only)
  - Optional TTL/IP filtering
- [ ] Note `CF_ACCOUNT_ID` (`c2c300a4…`) and `CF_ZONE_ID` (Dashboard → `vendetoweb.com.ar` → Overview → API section).
- [ ] Set the secrets (each prompts for its value):
  ```powershell
  npx wrangler secret put INTERNAL_KEY                  # Key B
  npx wrangler secret put LICENSING_WORKER_URL          # https://posweb-licensing.chiacchio-eze01.workers.dev
  npx wrangler secret put LICENSING_REMOTE_ACCESS_KEY   # Key A (same as Phase 2)
  npx wrangler secret put CF_PROVISIONER_TOKEN
  npx wrangler secret put CF_ACCOUNT_ID
  npx wrangler secret put CF_ZONE_ID
   npx wrangler secret list                              # expect all 6 names
   ```
- [ ] Optional: configure the capacity-alert endpoint without exposing its value: `npx wrangler secret put ALERT_WEBHOOK_URL`.
- [ ] Deploy: `npx wrangler deploy`, and note the printed URL (`https://vendeto-remote-access.<subdomain>.workers.dev`).
- [ ] Smoke test (expects 401):
  ```powershell
  try { Invoke-RestMethod '<worker-url>/status' -Method Post -ContentType 'application/json' -Body '{}' } catch { $_.Exception.Response.StatusCode.value__ }
  ```

## Phase 5: Local end-to-end test

- [ ] **A valid paid license on this PC** (base `%LOCALAPPDATA%\KIO\posweb.db`). Trials don't work, and the current local license is `cancelled`. Activate an active license from the app ("Buscar licencia" with an email that owns one) before testing.
- [ ] Rebuild the sidecars so `tauri dev` runs the audited code (this also downloads and verifies cloudflared): `.\build-sidecar.ps1`
- [ ] Start with config in the environment. **Do not** set `ASPNETCORE_ENVIRONMENT`, because it switches the database.
  ```powershell
  $env:RemoteAccess__WorkerUrl = '<worker-url>'
  $env:RemoteAccess__InternalKey = Read-Host 'Key B'
  cd frontend; npm run tauri dev
  ```
- [ ] Configuración → Acceso remoto → activate an unused slug (not `prueba` or any other reserved name). Expect `Esperando conexión` and then `Acceso remoto activo` within about a minute.
- [ ] Open `https://<slug>.vendetoweb.com.ar` from a phone on mobile data (not Wi-Fi).
- [ ] Close the app, then confirm the URL stops responding and no `vendeto-cloudflared.exe` is left in Task Manager.
- [ ] With `tauri dev` running, run `taskkill /f /im posweb-backend.exe` and confirm `vendeto-cloudflared.exe` exits within seconds. Run `taskkill /f /im app.exe` and confirm `vendeto-mobile.exe` exits within seconds.
- [ ] Reopen the app. The connector must come back on its own (status `active`).
- [ ] Deactivate. In the Cloudflare dashboard, the tunnel `vendeto-<slug>-…` and the DNS record `<slug>.vendetoweb.com.ar` must both be gone.
- [ ] Reactivate with the same slug. It must work (the reactivate-after-disabled path).
- [ ] Before activating remote access, confirm an active Administrator or SuperAdministrator account other than the factory seed account exists. On a non-Development startup, Vendeto rotates a known factory credential for the seed account when that other administrator exists. Support must direct users to their own account; the factory seed account is disabled by design.

If any step fails: capture the UI message, the backend log lines (no tokens), and `npx wrangler tail` output from the remote-access Worker, and bring them back for diagnosis.

## Phase 6: Before shipping a release to customers

- [ ] Custom domain for the Worker (enables rate limiting): Workers → `vendeto-remote-access` → Settings → Domains & Routes → add `api.vendetoweb.com.ar`. `api` is already a reserved slug, so no customer can claim it. Then set `"workers_dev": false` in `vendeto-remote-access/wrangler.jsonc` (a code change: hand it to OpenCode) and redeploy.
- [ ] WAF → Rate limiting rule on `api.vendetoweb.com.ar`, for example per-IP limits on `/activate` and `/connector-token`. Pick thresholds that are generous for real users.
- [ ] GitHub repo → Settings → Secrets and variables → Actions:
  - `REMOTE_ACCESS_WORKER_URL` = `https://api.vendetoweb.com.ar`
  - `REMOTE_ACCESS_INTERNAL_KEY` = Key B
- [ ] Run a release build and confirm that the CI step "embedded RemoteAccess" passes.
- [ ] Install the built release on a clean PC and repeat Phase 5 against it. This validates the embedded config, which no audit has run yet.
- [ ] For local `tauri dev` only, set `Seed__AdminPassword` to a locally chosen development-only value alongside `Licensing__DevTrialBootstrap` when a resettable seed account is required. Never add the value or a seed-reset flag to release configuration.

## Phase 6A: Merged licensing and mailer release

- [ ] Before the next `licensing-worker` deploy, verify the build is the merged code: it retains the protected administrative and remote-access routes and includes the pricing endpoint and advance-payment logic. Do not deploy either side of that merge independently.
- [ ] After that deploy, repeat all Phase 2 smoke checks and confirm `GET /pricing` returns `200`.
- [ ] Deploy the mailer Worker version that accepts only email-code requests, then release the matching backend immediately in the same maintenance window. Do not deploy the mailer Worker alone while installed backends still require the prior endpoint.
- [ ] If a temporary compatibility route is retained for one release, verify it rejects requests and never accepts arbitrary message content.

## Rollback summary

| Component | Rollback |
| --- | --- |
| licensing-worker | `npx wrangler rollback <previous-version-id>` (legacy account) |
| vendeto-remote-access | `npx wrangler rollback`, or delete the Worker. Deactivate every active slug **first** so the tunnels and DNS get cleaned up. |
| D1 table | Leave it in place (harmless). Drop it only when it is empty. |
| API token | Revoke it in My Profile → API Tokens. |
