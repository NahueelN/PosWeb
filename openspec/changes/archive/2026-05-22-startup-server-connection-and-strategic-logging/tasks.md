# Tasks: Startup Server Connection and Strategic Logging

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 250 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Delivery strategy | auto-chain |
| Decision needed before apply | No |
| Suggested work-unit PR split | Not needed |
| Chain strategy | pending |

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Implement all changes | PR 1 | Base branch; includes all file modifications and basic verification |

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Add CORS middleware configuration in `PosWeb/Program.cs` to allow frontend origins (http://localhost:5173 for web dev and Tauri)
- [x] 1.2 Add application startup and shutdown logging in `PosWeb/Program.cs`

## Phase 2: Core Implementation (Frontend)

- [x] 2.1 Modify `frontend/src/api/client.ts` to resolve API base URL at runtime using window.location.protocol and hostname
- [x] 2.2 Add request/startup logging in the `request` function in `frontend/src/api/client.ts`
- [x] 2.3 Enhance `esperarBackend` function in `frontend/src/api/client.ts` to log startup connection attempts and failures
- [x] 2.4 Modify `frontend/src/App.tsx` to add logging in useEffect for esperarBackend outcome (startup success/failure)

## Phase 3: Integration / Wiring (Backend and Tauri)

- [x] 3.1 Enhance `PosWeb/Middlewares/ExceptionMiddleware.cs` to log exceptions with context (startup/runtime) and appropriate log levels
- [x] 3.2 Modify `frontend/src-tauri/src/lib.rs` to add logging for sidecar spawn and termination events

## Phase 4: Testing and Verification

- [ ] 4.1 Write unit tests for frontend API client base URL resolution (Jest) simulating different window.location protocols
- [ ] 4.2 Write unit tests for request logging in fetch wrapper (spy on console.log)
- [ ] 4.3 Perform integration test: start vite dev server and backend, verify frontend loads and makes successful API requests
- [ ] 4.4 Perform integration test: build Tauri app, verify it connects to backend and logs show successful startup
- [ ] 4.5 Perform integration test: send requests from http://localhost:5173 and unauthorized origin, verify appropriate CORS headers and blocking
- [ ] 4.6 Perform integration test: trigger exceptions in backend, verify logs contain expected context and log levels
- [ ] 4.7 Perform end-to-end test: test both web dev and Tauri packaged modes, verify logs show clear startup progress and failure recovery
