# Proposal: Startup Server Connection and Strategic Logging

## Intent

Fix the frontend/backend startup connection issue by aligning with the existing Vite proxy design and adding strategic logging across frontend, Tauri sidecar, and backend to improve startup diagnostics and reliability.

## Scope

### In Scope
- Make frontend API client resolve API base by runtime context (use relative `/api` in web/dev, explicit localhost for desktop)
- Add CORS middleware to backend for Tauri/web origins
- Add structured logging around startup attempts, failures, and backend exceptions
- Log Tauri sidecar spawn/termination and backend startup milestones
- Instrument frontend request/startup logs in shared fetch wrapper

### Out of Scope
- Backend URL configuration via environment variables (future enhancement)
- Detailed performance metrics collection
- UI redesign of startup screen beyond logging improvements

## Capabilities

### New Capabilities
- `startup-diagnostics`: Logging and observability for frontend/backend startup connection process
- `api-origin-resolution`: Runtime determination of API base URL based on deployment context

### Modified Capabilities
- `frontend-api-client`: Changes to how API base URL is determined and request logging
- `backend-cors-policy`: Addition of CORS middleware for frontend origins
- `backend-exception-handling`: Enhanced logging in exception middleware

## Approach

Following Approach 1 from exploration: resolve frontend API base by runtime context to align with Vite proxy, add backend CORS for required origins, and implement strategic logging at key startup milestones and failure points across frontend, Tauri sidecar, and backend.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/api/client.ts` | Modified | Runtime API base resolution, request/startup logging |
| `frontend/src/App.tsx` | Modified | Improved startup state transitions with logging |
| `frontend/vite.config.ts` | Unchanged | Existing `/api` proxy validated |
| `PosWeb/Program.cs` | Modified | Add CORS middleware and startup logging |
| `PosWeb/Middlewares/ExceptionMiddleware.cs` | Modified | Add exception logging |
| `frontend/src-tauri/src/lib.rs` | Modified | Add sidecar spawn/logging milestones |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Different origins/ports in packaged vs dev environments | Medium | Test in both web dev and packaged Tauri modes |
| Startup diagnostics not showing clear progress | Low | Ensure logs mark clear attempt/failure/success transitions |
| Excessive logging in release builds | Medium | Scope logging appropriately, consider build-time filtering |

## Rollback Plan

Revert changes to:
- `frontend/src/api/client.ts`: Restore hard-coded localhost base URL
- `frontend/src/App.tsx`: Remove additional logging
- `PosWeb/Program.cs`: Remove CORS and startup logging additions
- `PosWeb/Middlewares/ExceptionMiddleware.cs`: Remove exception logging
- `frontend/src-tauri/src/lib.rs`: Remove added logging

## Dependencies

- None (uses existing Vite proxy and Tauri sidecar infrastructure)

## Success Criteria

- [ ] Startup succeeds in both web dev and packaged Tauri modes
- [ ] Backend responds with appropriate CORS headers for frontend origins
- [ ] Strategic logs show clear startup progress and failure diagnostics
- [ ] No regression in existing functionality