# Tasks: Startup Healthcheck Compatibility

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~10-30 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

Expected review workload: Low; frontend-only timeout compatibility fix in one file plus quick verification.

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Ship the timeout compatibility bugfix and verify startup behavior | PR 1 | Single focused frontend PR |

## Phase 1: Implementation

- [x] 1.1 Update `frontend/src/api/client.ts` `esperarBackend()` to use explicit `AbortController` timeout cleanup compatible with target browser/WebView runtimes.
- [x] 1.2 Keep the existing probe target, retry loop, `res.ok` success condition, and thrown error text unchanged in `frontend/src/api/client.ts`.
- [x] 1.3 Review `frontend/src/App.tsx` startup flow and confirm no UI or retry-behavior changes are introduced.

## Phase 2: Verification

- [ ] 2.1 Verify `npm run lint` passes for the frontend after the timeout change.
- [x] 2.2 Verify the frontend build/type check completes successfully with the project build command so the startup path still compiles.
- [ ] 2.3 Run the app with the backend available and confirm the loading screen exits once `http://localhost:5196/api/sucursales` responds successfully.
- [ ] 2.4 Run the app with the backend unavailable briefly and confirm retry behavior and the existing connection error UX remain unchanged.
