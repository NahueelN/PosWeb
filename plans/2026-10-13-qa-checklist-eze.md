# QA Checklist: `FT_VendetoMobile_ABM` before merging to master

For: Eze. Branch on Azure DevOps (`origin`), tip `8a60e74` or later. It contains remote access, the security hardening, your `mailerpassword` work (integrated), and the mobile sidecar fix.

## 0. Setup (your PC, `C:\Dev\PosWeb2\Pos 2`)

```powershell
cd "C:\Dev\PosWeb2\Pos 2"
git status                       # your Cargo.toml change is line endings only; discard it if nothing else changed:
git checkout -- frontend/src-tauri/Cargo.toml
git fetch origin
git checkout -b FT_VendetoMobile_ABM origin/FT_VendetoMobile_ABM
.\build-sidecar.ps1              # must end with "OK: cloudflared 2026.10.0 verified"
```

**Changes to your branch you should know about:**
- The hardcoded admin password is gone. In dev, use `$env:Seed__ResetAdminPassword='true'` (optionally `$env:Seed__AdminPassword='<yours>'`, which defaults to the dev password documented in the README) to get `admin` back.
- The mailer now only exposes `/send-code` (fixed templates). `/send` no longer exists, and the new mailer **is already deployed**.
- `/grant-license` requires `ADMIN_KEY` (shared through the password manager).
- **Do not run `wrangler deploy`** for `licensing-worker` or `mailer-worker` from `mailerpassword` anymore.

## 1. Fresh install path (the most important one)

Use a clean local DB: run `reset-local.ps1`, or rename `%LOCALAPPDATA%\KIO\posweb.db*`.

```powershell
cd frontend; npm run tauri dev
```

- [ ] **Register** a new titular account with a real email you can read.
- [ ] The **confirmation code email arrives**: the subject is "Confirmá tu email - Vendeto", and the body says "Expira en 15 minutos. Si no lo pediste vos, ignorá este mensaje."
- [ ] Confirm the code → you can **log in**.
- [ ] Without confirming, login is refused (expected).
- [ ] **Forgot password**: the code arrives and the reset works. Then log in with the new password.
- [ ] **Configuración → Perfil → Cambiar contraseña**: the wrong current password is rejected, a mismatched confirmation is blocked, a short password and `123` are rejected, and a valid change works (log out and back in).

## 2. Seed admin hardening

- [ ] On a non-dev run (plain `npm run tauri dev`, **no** `Seed__ResetAdminPassword`), after registering your own titular account, `admin` with any factory password **no longer logs in**.
- [ ] Restart the app → it still doesn't log in, and your own account still works.

## 3. Existing data (upgrade path)

Use a copy of a DB that **already has users** (for example, a backup of your current local DB).

- [ ] Existing users **can log in without confirming their email** (the migration marks them as confirmed).
- [ ] Ventas, caja, productos (including barcode / empaques) and Configuración open without errors.
- [ ] The **Configuración** page opens (it crashed after the first merge attempt; now it's fixed).

## 4. Remote access (needs a key; ask Nahuel)

Option A, the **dev** Worker (no paid license needed):

```powershell
$env:RemoteAccess__WorkerUrl = 'https://vendeto-remote-access-dev.vendeto.workers.dev'
$env:RemoteAccess__InternalKey = Read-Host 'Dev INTERNAL_KEY'
$env:RemoteAccess__AllowTrial = 'true'
```

Option B, **production** (needs Key B and an active paid license on your machine):
`RemoteAccess__WorkerUrl = 'https://api.vendetoweb.com.ar'`.

- [ ] Configuración → Acceso remoto → activate a slug. In dev, the URL is `dev-<slug>.vendetoweb.com.ar`. The state reaches "Acceso remoto activo".
- [ ] Open the link from a phone on **mobile data** → the mobile app loads and you can log in.
- [ ] Close the app → the link stops responding, and no `vendeto-cloudflared.exe` remains in Task Manager.
- [ ] Deactivate → the tunnel and DNS record are gone.
- [ ] With env vars missing → the page says "no está configurado en esta instalación" and hides the buttons.

## 5. Report back

For each section: OK / FAIL, plus the exact message or a screenshot for any failure. Don't fix things on this branch: report them and we plan the fix.

## Known and not blocking

- 3 `TicketResultado` frontend tests fail (`localStorage`), pre-existing.
- `/licencias-largas` (advance payment) needs a separate `licensing-worker` redeploy from this branch, outside this release.
