# ADR-error-handling-dialogs — Manejo de errores en popups

## Metadata

```yaml
ID: ADR-error-handling-dialogs
Type: ADR
Name: Manejo de errores en popups
Status: Canonical
Priority: High
Level: Project
Sources:
  - frontend/src/components/ui/ErrorBoundary.tsx
  - frontend/src/components/ui/Dialog.tsx
  - frontend/src/components/ProductFormModal.tsx
  - frontend/src/context/NotificationContext.tsx
  - docs/PROJECT_COMPANION.md
  - docs/knowledge/projects/posweb/DS-dialog-popup.md
Created: 2026-07-09
Updated: 2026-07-09
Tags:
  - UX
  - Dialog
  - Error
  - Architecture
```

---

## Contexto

Hasta julio 2026, cada popup del sistema manejaba los errores de manera distinta:

- **ProductFormModal** usaba un banner rojo inline (`setError` + div con fondo rojo).
- **ClientesPage** y **ProveedoresPage** no tenían manejo de errores visible.
- **CombosPage** mostraba errores mediante el `notifyError()` del NotificationContext.
- No existía un comportamiento consistente para errores de render (React exceptions).
- Algunos popups cerraban al recibir un error de backend; otros permanecían abiertos.

Esta fragmentación hacía imposible:

1. Agregar logging o Sentry de forma centralizada.
2. Garantizar una experiencia de usuario predecible.
3. Reutilizar el mismo patrón en popups nuevos.

Además, el componente `ErrorBoundary` (cuando se creó) estaba acoplado a `notifyError()` y `onClose()`, lo que impedía reutilizarlo en contextos donde se necesitara otro comportamiento (ej: logging, retry, telemetry).

---

## Decisión

Se diseñó una arquitectura de manejo de errores con **cuatro categorías** y **responsabilidades desacopladas**.

### Categorías de error

| # | Categoría | Ejemplos | Cómo se maneja |
|---|-----------|----------|----------------|
| 1 | **Error de render** | React exception en el body del popup | ErrorBounday lo captura. COMP-Dialog decide: `notifyError()` + cierra el popup. |
| 2 | **Error inesperado** | Network timeout, excepción no controlada en catch | El popup llama a `notifyError()`. Decide si cierra o no según contexto. |
| 3 | **Error de negocio esperado** | Cliente duplicado, stock insuficiente, CUIT repetido | El popup llama a `notifyError()`. Cada popup decide si permanece abierto. |
| 4 | **Validación de formulario** | Campo obligatorio vacío, precio inválido | El popup llama a `notifyError()` (nunca banners inline). |

### Responsabilidades

```
ErrorBoundary
  └── Solo detecta errores de render.
  └── Expone onUnexpectedError?: (error: Error) => void (opcional).
  └── NO conoce: notifyError, dialogs, cerrar popups, logging, Sentry.
  └── El callback es opcional — si no se provee, el error se traga silenciosamente.

COMP-Dialog
  └── Consume ErrorBoundary envuelve el body del popup.
  └── Decide la UX para errores de render: notifyError + onClose.
  └── Puede cambiarse sin modificar ErrorBoundary.

NotificationContext (DialogContainer)
  └── Muestra el popup de error genérico.
  └── No sabe si el error vino de render, backend, o validación.

Cada popup específico (ProductFormModal, etc.)
  └── Decide autónomamente para errores de backend y validación:
      - ¿notifico y cierro?
      - ¿notifico y dejo abierto?
      - ¿solo notifico?
```

### Eliminación de banners inline

Queda prohibido el uso de `setError` local con banners rojos inline. Todos los errores visibles al usuario deben pasar por `notifyError()` del NotificationContext.

---

## Alternativas consideradas

| Alternativa | Descarte |
|-------------|----------|
| **Todo error cierra el popup** | Se descartó porque no todos los flujos de negocio se benefician de ese comportamiento. Editar un cliente con error de validación debe dejar el popup abierto para corregir el dato. |
| **Todo error deja el popup abierto** | Se descartó porque los errores de render no tienen sentido mostrarse dentro del popup — el contenido ya falló. |
| **ErrorBoundary conoce NotificationContext** | Se descartó porque acopla el ErrorBoundary a una implementación concreta de notificación. Impide agregar Sentry, logging, o retry sin modificar el ErrorBoundary. |
| **Cada popup implementa su propio ErrorBoundary** | Se descartó porque duplica lógica y cada popup podría olvidarse de capturar errores de render. |
| **Manejo centralizado vía evento global (window.onerror)** | Se descartó porque no captura errores específicos del árbol de React ni permite fallback UI local. |

---

## Consecuencias

### Qué habilita

- **Agregar nuevos mecanismos** (Sentry, logging, telemetry, retry) sin modificar ErrorBoundary — solo hay que cambiar el callback en COMP-Dialog.
- **Experiencia de usuario predecible** para los casos de render y errores inesperados.
- **Autonomía por popup** para errores de negocio — cada flujo elige su UX.
- **Migración progresiva** — los popups existentes pueden migrarse uno por uno sin cambiar la infraestructura.

### Qué obliga

- Todo popup nuevo debe usar `notifyError()` para errores visibles al usuario. Prohibido banners inline.
- El catch de backend en cada popup debe decidir explícitamente si cierra o no — no hay comportamiento default global.

### Qué limita

- No hay un mecanismo automático para logging de errores de negocio — cada popup debe llamar a `notifyError()` explícitamente.
- El ErrorBoundary no puede reintentar la renderización por sí mismo — requeriría un wrapper con estado externo.

---

## Cuándo reconsiderar

- Cuando aparezca un patrón de error que requiera comportamiento uniforme en TODOS los popups (ej: "ante cualquier error de backend, mostrar un botón de reintentar"). En ese caso, el comportamiento podría subirse a COMP-Dialog.
- Cuando se adopte Sentry o similar — en ese caso, el callback de ErrorBoundary en COMP-Dialog puede extenderse sin cambiar la arquitectura.

---

## Relaciones

```yaml
RELATIONS:
  - type: IMPLEMENTS
    target: DS-dialog-popup
  - type: RELATED
    target: STAND-pr-narrative
  - type: USES
    target: COMP-Dialog
  - type: USES
    target: COMP-ErrorBoundary
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-07-09 | Decisión tomada. Definición de 4 categorías de error, responsabilidades desacopladas, prohibición de banners inline. |
