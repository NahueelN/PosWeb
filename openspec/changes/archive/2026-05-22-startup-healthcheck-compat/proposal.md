# Proposal: Startup Healthcheck Compatibility

## Intent

Fix the startup health-check so the frontend stops getting stuck on "Conectando con el servidor" when the backend is already reachable. The current timeout mechanism is not compatibility-safe across all target runtimes.

## Scope

### In Scope
- Replace the unsupported timeout mechanism in `frontend/src/api/client.ts` with broadly compatible fetch timeout logic.
- Keep the existing startup flow and UX in `frontend/src/App.tsx` unchanged.
- Preserve the current backend probe target: `http://localhost:5196/api/sucursales`.

### Out of Scope
- Changing startup copy, loading states, or retry behavior.
- Changing backend endpoints, server health APIs, or general API client behavior outside startup wait logic.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- None.

## Approach

Use explicit `AbortController`-based timeout handling that works in broader browser/WebView environments instead of relying on `AbortSignal.timeout(2000)`. Keep the retry loop, success condition (`res.ok`), and user-facing startup behavior as-is.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/api/client.ts` | Modified | Replace timeout implementation inside `esperarBackend()` |
| `frontend/src/App.tsx` | Reviewed | Startup UX remains unchanged; no functional UI change expected |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Timeout cleanup causes false failures or leaks | Low | Clear timers reliably and preserve existing retry semantics |
| Startup behavior changes unintentionally | Low | Limit change to timeout plumbing only |

## Rollback Plan

Revert the `esperarBackend()` timeout change in `frontend/src/api/client.ts` to restore the previous implementation.

## Dependencies

- Existing frontend fetch support and backend endpoint availability at `/api/sucursales`

## Success Criteria

- [ ] App leaves the startup screen when the backend is reachable at `http://localhost:5196/api/sucursales`.
- [ ] Startup screen, retry behavior, and error UX remain unchanged.
- [ ] Health-check timeout logic avoids runtime support issues with `AbortSignal.timeout`.
