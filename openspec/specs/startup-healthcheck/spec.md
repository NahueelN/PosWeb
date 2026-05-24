# Startup Healthcheck Specification

## Purpose

Ensure startup health checks do not block app startup on platforms with partial or missing request-cancellation API support.

## Requirements

### Requirement: Compatible startup health check

The system MUST perform the startup backend health check in a way that remains compatible with environments where timeout or cancellation browser APIs are unavailable or unsupported.

#### Scenario: Backend reachable without hanging

- GIVEN the startup screen is visible
- AND the backend is reachable
- WHEN the startup health check runs in an environment with unsupported cancellation-related browser APIs
- THEN the health check MUST still complete successfully
- AND the app MUST transition from the startup screen into the main application without hanging

#### Scenario: Backend unavailable still reaches existing error state

- GIVEN the startup screen is visible
- AND the backend is unavailable
- WHEN the startup health check runs
- THEN the system MUST continue retrying according to the existing startup retry behavior
- AND after retries are exhausted the system MUST show the existing startup connection error state

#### Scenario: Timeout or cancellation incompatibility degrades safely

- GIVEN the startup screen is visible
- AND the runtime does not support the timeout or cancellation mechanism used by the health check
- WHEN the health check starts or a retry cycle executes
- THEN the system MUST degrade to a compatible request path instead of stalling startup
- AND the outcome MUST still be either successful app entry or the existing connection error state
