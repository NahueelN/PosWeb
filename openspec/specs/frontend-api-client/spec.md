# Frontend API Client Specification

## Purpose

Manage API client configuration and request handling for the frontend application, including runtime API base resolution and request/startup logging.

## Requirements

### Requirement: Proveedores API Methods

The API client MUST expose `getProveedores(search?)`, `createProveedor(data)`, and `getProveedor(id)` matching the proveedor endpoints.

#### Scenario: Type definitions align

- GIVEN the frontend types are updated
- WHEN TypeScript compiles
- THEN no type errors exist for the new DTOs

### Requirement: Runtime API Base URL Resolution

### Requirement: Runtime API Base URL Resolution

The system MUST resolve the API base URL at runtime based on the deployment context (web/dev vs desktop/Tauri).

#### Scenario: Web/Development Environment API Resolution

- GIVEN the application is running in a web browser during development
- WHEN the frontend initializes
- THEN the API client SHALL use a relative `/api` base URL
- AND this SHALL align with the existing Vite proxy configuration (`/api` → `http://localhost:5196`)

#### Scenario: Desktop/Tauri Production Environment API Resolution

- GIVEN the application is running as a packaged Tauri desktop application
- WHEN the frontend initializes
- THEN the API client SHALL use an explicit `http://localhost:5196/api` base URL
- AND this SHALL bypass the need for Vite proxy in production desktop builds

#### Scenario: API Request Construction

- GIVEN the API base URL has been resolved according to runtime context
- WHEN constructing an API endpoint URL
- THEN the system SHALL concatenate the resolved base URL with the endpoint path
- AND the resulting URL SHALL be valid and reachable by the frontend

### Requirement: Request/Startup Instrumentation Logging

The system SHALL log request/startup events in the shared fetch wrapper to improve startup diagnostics.

#### Scenario: Request Initiation Logging

- GIVEN the frontend is about to make an API request
- WHEN the request is initiated through the shared fetch wrapper
- THEN the system SHALL log the request initiation with method and endpoint

#### Scenario: Request Completion Logging

- GIVEN the frontend has made an API request
- WHEN the request completes successfully or with error
- THEN the system SHALL log the request completion with status and duration

#### Scenario: Startup Connection Attempt Logging

- GIVEN the application is starting up
- WHEN the frontend attempts to connect to the backend
- THEN the system SHALL log the startup connection attempt
- AND if the attempt fails, the system SHALL log the failure with error details