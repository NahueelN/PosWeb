## Exploration: startup-server-connection-and-strategic-logging

### Current State
Startup is gated entirely by `esperarBackend()` in `frontend/src/api/client.ts`. `App.tsx` shows `Iniciando PosWeb… / Conectando con el servidor` until that promise resolves, and it never surfaces progress while retries are happening. The startup probe uses a hard-coded absolute backend URL (`http://localhost:5196/api/sucursales`), while the backend exposes no CORS policy and the frontend ignores the existing Vite `/api` proxy because it does not use relative paths. The desktop sidecar already emits backend stdout/stderr in Tauri, but only when `cfg!(debug_assertions)` is true, and the ASP.NET exception middleware currently swallows unexpected exceptions without logging them.

### Affected Areas
- `frontend/src/App.tsx` — startup screen and the only place that transitions from loading to ready/error.
- `frontend/src/api/client.ts` — startup probe, shared fetch wrapper, hard-coded API base, and best location for structured frontend request/startup logs.
- `frontend/vite.config.ts` — existing `/api` proxy proves the intended dev path is relative API access, but current client code bypasses it.
- `PosWeb/Program.cs` — backend startup pipeline lacks CORS and any explicit startup/request logging.
- `PosWeb/Middlewares/ExceptionMiddleware.cs` — unexpected exceptions are converted to 500 without any diagnostic log.
- `frontend/src-tauri/src/lib.rs` — sidecar spawn/output logging exists, but is limited to debug builds and does not log startup milestones.

### Approaches
1. **Configurable API origin + startup diagnostic logs** — make the frontend resolve its API base by runtime context, use relative `/api` in web/dev, keep explicit localhost only where needed for desktop, add backend CORS for the Tauri/web origins that must call it directly, and add targeted logs around startup attempts, failures, and backend exceptions.
   - Pros: Addresses the most likely integration failure, aligns with the existing Vite proxy, preserves current UX, and gives useful signal across frontend, Tauri, and backend.
   - Cons: Requires touching both frontend and backend startup plumbing; CORS/origin handling must be tested in dev and packaged desktop modes.
   - Effort: Medium

2. **Keep current URL model and add only more retries/logging** — preserve the absolute `http://localhost:5196/api` client and instrument every retry/failure.
   - Pros: Smaller code surface and fastest to ship.
   - Cons: Likely misses the real integration problem if the fetch is failing because of origin/CORS/path assumptions; would explain failures better but not reliably fix them.
   - Effort: Low

### Recommendation
Choose **Approach 1**. The codebase already tells us the intended split: web/dev traffic should use the Vite `/api` proxy, while desktop can talk to the sidecar-backed API directly when necessary. Right now the hard-coded absolute base bypasses that design, and the backend returns no `Access-Control-Allow-Origin` headers. Fixing the startup path without fixing that integration boundary is just guessing. Add strategic logs at the startup state transition, each backend probe attempt/failure category, sidecar spawn/termination, backend startup, and exception middleware.

### Risks
- If the packaged sidecar or dev backend use different origins/ports than expected, a partial fix could still leave one runtime broken.
- Startup currently waits up to ~75 seconds (`30 * (2s timeout + 500ms delay)` worst case), so poor diagnostics can still feel like an infinite hang unless logs clearly show progress.
- Enabling broader logging in desktop/release without filtering may expose noisy backend stderr unless the log format is scoped.

### Ready for Proposal
Yes — propose a bugfix/change that (1) corrects the frontend/backend startup integration boundary and (2) adds scoped startup diagnostics across frontend, Tauri sidecar, and ASP.NET exception/startup flow.
