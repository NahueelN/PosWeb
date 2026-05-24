# Design: Startup Server Connection and Strategic Logging

## Technical Approach

The approach resolves the frontend/backend startup connection issue by:
1. Making the frontend API client resolve the API base URL at runtime based on deployment context (relative `/api` for web/dev, explicit `http://localhost:5196/api` for desktop/Tauri)
2. Adding CORS middleware to the backend to allow requests from frontend origins
3. Implementing strategic logging across frontend, Tauri sidecar, and backend to improve startup diagnostics and reliability
This aligns with the existing Vite proxy design and follows Approach 1 from exploration.

## Architecture Decisions

### Decision: Frontend API Base URL Resolution

**Choice**: Use runtime detection of `window.location.protocol` and `window.location.hostname` to determine if running in web/dev (uses relative `/api`) or desktop/Tauri (uses explicit `http://localhost:5196/api`)
**Alternatives considered**:
- Environment variables at build time: Requires rebuild for different environments, doesn't handle hybrid cases
- User-configurable settings: Overcomplicates for this use case
- Detecting Tauri via `window.__TAURI__`: More specific but less portable than protocol/hostname check
**Rationale**: The runtime protocol/hostname check is simple, works for both web/dev and Tauri without build changes, and aligns with the existing Vite proxy (`/api` → `http://localhost:5196`) in web/dev.

### Decision: Backend CORS Configuration

**Choice**: Configure CORS middleware with explicit origins for web dev server (`http://localhost:5173`) and Tauri desktop (`http://localhost:5173` and custom Tauri protocol)
**Alternatives considered**:
- Allow all origins (`*`): Security risk, not acceptable for production
- Allow based on origin header validation: More complex, requires origin parsing
**Rationale**: Explicitly listing known frontend origins is secure, simple, and matches the deployment contexts defined in the spec. The Tauri custom protocol is handled by allowing the same port as web dev since Tauri uses `http://localhost:5173` for local frontend resources.

### Decision: Logging Granularity

**Choice**: Log at key milestones (startup attempts, success, failure) and error boundaries (exceptions) with contextual information, but avoid verbose request/response logging in release builds
**Alternatives considered**:
- Log all requests/responses: Too verbose, impacts performance
- Only log errors: Insufficient for diagnostics
**Rationale**: Strategic logging at startup connection attempts, backend startup, and exception points provides clear diagnostics without excessive overhead. Using appropriate log levels (Info for milestones, Error for exceptions) ensures production safety.

## Data Flow

Frontend Startup:
    Browser/Tauri ──→ Frontend Init ──→ API Client (resolve base URL) 
          │                        │
          │                        └─→ esperarBackend() (logs attempt) 
          │                                 │
          │                                 ├─ Success → log success → render app
          │                                 └─ Failure → log error → show retry
          │
          └─→ App.tsx useEffect (logs startup attempt via esperarBackend outcome)

Backend Startup:
    Host ──→ Program.cs (log startup begin) ──→ Configure CORS ──→ Configure middleware ──→ log startup complete

Request Flow:
    Frontend ──→ fetch (logs request) ──→ [Vite proxy in dev / direct in prod] ──→ Backend 
          │                                 │
          │                                 └─→ Exception middleware (logs exceptions with context) 
          │
          └─← fetch (logs response/duration/error)

Tauri Sidecar:
    Tauri Runtime ──→ lib.rs (log spawn) ──→ Backend process ──→ lib.rs (log termination on exit)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/api/client.ts` | Modify | Replace hard-coded BASE with runtime resolution; add request/startup logging in request function and esperarBackend |
| `frontend/src/App.tsx` | Modify | Add logging in useEffect for esperarBackend outcome (startup success/failure) |
| `PosWeb/Program.cs` | Modify | Add CORS middleware configuration; add logging at application startup and shutdown |
| `PosWeb/Middlewares/ExceptionMiddleware.cs` | Modify | Enhance exception logging to include context (startup/runtime) and appropriate log levels |
| `frontend/src-tauri/src/lib.rs` | Modify | Add logging for sidecar spawn and termination events |

## Interfaces / Contracts

No new interfaces or contracts are required. The changes are internal to existing modules.

### Frontend API Client Runtime Resolution (TypeScript)
```typescript
// Determine API base URL at runtime
let BASE: string;
if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
  // Running in web browser (dev or prod)
  BASE = '/api'; // Relies on Vite proxy in dev, direct in prod if served from same origin
} else {
  // Running in Tauri (custom protocol like asset: or tauri:)
  BASE = 'http://localhost:5196/api';
}
```

### Backend CORS Configuration (C#)
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendOrigins", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",          // Vite dev server
                "http://localhost:5173")          // Tauri frontend (same port)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | API client base URL resolution | Jest tests simulating different window.location protocols |
| Unit | Request logging in fetch wrapper | Spy on console.log to verify logs contain method, endpoint, status, duration |
| Integration | Frontend-to-backend connection in dev | Start vite dev server and backend, verify frontend loads and makes successful API requests |
| Integration | Frontend-to-backend connection in Tauri | Build Tauri app, verify it connects to backend and logs show successful startup |
| Integration | CORS middleware | Send requests from http://localhost:5173 and unauthorized origin, verify appropriate headers and blocking |
| Integration | Exception logging | Trigger exceptions in backend, verify logs contain expected context and log levels |
| E2E | Full startup sequence | Test both web dev and Tauri packaged modes: verify logs show clear startup progress and failure recovery |

## Migration / Rollout

No migration required. The changes are additive and backward-compatible:
- Frontend API client change maintains same behavior when served from same origin (due to Vite proxy)
- CORS addition only affects incoming requests, doesn't change existing endpoints
- Logging additions don't alter functional behavior

Rollback plan is defined in the proposal: revert each file to its previous state.

## Open Questions

- [ ] Should we consider using environment variables for the backend URL in Tauri for future flexibility? (Deemed out of scope per proposal)
- [ ] Is the port 5196 hardcoded in the frontend acceptable, or should it be made configurable? (Currently matches backend port, acceptable for now)
- [ ] Should we differentiate logging between development and production builds? (Using appropriate log levels helps, but we may want to suppress Info logs in release - to be considered in implementation)

### Next Step
Ready for tasks (sdd-tasks).