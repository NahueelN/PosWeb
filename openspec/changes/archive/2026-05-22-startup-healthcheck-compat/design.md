# Design: Startup Healthcheck Compatibility

## Technical Approach

Keep the startup flow exactly as it is today and only replace the timeout mechanism inside `esperarBackend()` with a manual `AbortController` + `setTimeout` pattern. The backend probe remains `http://localhost:5196/api/sucursales`, `res.ok` remains the success condition, and the retry loop, loading screen, and error UI stay unchanged.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Fetch timeout implementation | Create one `AbortController` per retry attempt and abort it from `setTimeout` after 2000 ms | `AbortSignal.timeout(2000)` | Manual controller/timer logic works in broader browser/WebView runtimes and matches the proposal goal without changing control flow. |
| Timeout cleanup | Clear the timeout in a `finally` block for every attempt | Clear only after successful `fetch()` resolution | `finally` guarantees cleanup on success, timeout abort, or network failure and avoids stray timers affecting later retries. |
| Startup UX scope | Leave `App.tsx` unchanged | Refactor loading/error handling during this change | The proposal explicitly keeps API base, loading screen, retry count, and error UI unchanged, so the safest design is to isolate the change to `client.ts`. |

## Data Flow

```text
App useEffect
  -> esperarBackend()
     -> start 2s timer
     -> fetch(`${BASE}/sucursales`, { signal })
     -> success with res.ok => resolve startup
     -> failure/abort => clear timer, wait 500 ms, retry
  -> after max retries => throw "El backend no está disponible"
```

## File Changes

| File | Action | Description |
|---|---|---|
| `frontend/src/api/client.ts` | Modify | Replace startup timeout plumbing with compatible `AbortController` + `setTimeout`; preserve retry count, delay, URL, and thrown error. |
| `frontend/src/App.tsx` | No code change | Confirm current loading and error rendering still depends only on `esperarBackend()` resolve/reject behavior. |
| `openspec/changes/startup-healthcheck-compat/design.md` | Create | Record implementation approach and risks. |

## Interfaces / Contracts

No API or type contract changes. `esperarBackend(maxRetries = 30, delayMs = 500): Promise<void>` remains unchanged.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Frontend static verification | Startup code still type-checks/lints | Run existing frontend checks (`npx tsc -b`, `npm run lint`) if this change moves to implementation. |
| Manual startup check | App leaves loading screen when backend is reachable | Start backend, launch frontend, verify the app transitions without changing loading or error copy. |
| Manual failure check | Error UI still appears after retries are exhausted | Run frontend without backend and confirm the existing retry loop ends with the same error screen/message. |

## Migration / Rollout

No migration required.

## Open Questions

- [ ] None.
