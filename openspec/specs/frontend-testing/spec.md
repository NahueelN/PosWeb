# Frontend Testing Specification

## Purpose

Infraestructura de testing para el frontend PosWeb usando vitest + testing-library, con mocks reutilizables para `useOutletContext`, `api`, `useNotification`, y storage.

## Requirements

### Requirement: Vitest Configuration

El proyecto DEBE tener vitest configurado en `vite.config.ts` con `environment: 'jsdom'`, `globals: true`, y `setupFiles: ['./src/test-setup.ts']`.

#### Scenario: Tests execute with vitest
- GIVEN configuración aplicada
- WHEN `npx vitest run`
- THEN tests en `*.test.tsx` y `*.test.ts` se ejecutan

### Requirement: Test Setup

`src/test-setup.ts` DEBE importar `@testing-library/jest-dom` para matchers extendidos.

#### Scenario: jest-dom matchers available
- GIVEN test-setup cargado
- WHEN test usa `expect(element).toBeInTheDocument()`
- THEN matcher funciona sin error

### Requirement: Test Utils

`src/test-utils.tsx` DEBE exportar:
- `mockUseOutletContext(value)` — mock de `useOutletContext` de react-router-dom
- `mockApi(overrides)` — mock tipado del cliente API
- `mockUseNotification()` — mock de `useNotification` con `notifyError` y `notifySuccess`
- `mockStorage()` — mock de Storage API (getItem, setItem, removeItem, clear)
- `renderWithProviders(ui, options)` — wrapper con providers comunes

#### Scenario: Mock useOutletContext
- GIVEN `mockUseOutletContext({ sucursal: mockSucursal })`
- WHEN componente llama `useOutletContext()`
- THEN retorna `{ sucursal: mockSucursal }`

#### Scenario: Mock api client
- GIVEN `mockApi({ productos: { listar: vi.fn().mockResolvedValue([]) } })`
- WHEN componente llama `api.productos.listar()`
- THEN retorna `[]`

### Requirement: Dev Dependencies

`package.json` DEBE incluir: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`.

#### Scenario: Dependencies installed
- GIVEN `npm install` ejecutado
- WHEN `npx vitest --version`
- THEN muestra versión de vitest
