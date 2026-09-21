# HOOK-use-media-query — Responsive Breakpoint Hook

## Metadata

```yaml
ID: HOOK-use-media-query
Type: Hook
Name: useMediaQuery
Status: Active
Priority: Medium
Level: Project
Sources:
  - frontend/src/hooks/useMediaQuery.ts
  - frontend/src/pages/MesasPage.tsx
Created: 2026-09-21
Updated: 2026-09-21
Tags:
  - UX
```

---

## Overview

Hook React que expone el resultado de una media query CSS (`window.matchMedia`) como estado reactivo. Se actualiza automáticamente cuando el viewport cruza el breakpoint. Permite decidir layout/UX según el tamaño de pantalla sin duplicar CSS.

---

## Why it exists

MesasPage necesitaba distinguir pantallas grandes (mapa + panel lateral en dos columnas) de pantallas compactas (mapa a pantalla completa + popup al seleccionar mesa). El umbral se fijó en el breakpoint `xl` de Tailwind (1280px).

---

## API

```ts
useMediaQuery(query: string): boolean
```

- `query`: media query CSS (ej. `'(max-width: 1279px)'`).
- Devuelve `true` si el query matchea el viewport actual.
- Escucha el evento `change` de `matchMedia` para re-renderizar al cruzar el breakpoint.
- Inicializa el estado con `window.matchMedia(query).matches` en el primer render.

---

## When to Use

- Cualquier pantalla que deba cambiar su layout, panel o comportamiento según el tamaño del viewport.
- Componentes que necesitan saber si están en modo "compacto" sin escribir clases CSS duplicadas.

## When NOT to Use

- Diferencias puramente visuales que ya resuelve Tailwind con breakpoints (`sm:`, `xl:`, etc.).
- Lógica que solo se decide una vez al montar y no necesita reaccionar a resize.

---

## Cómo implementarlo

1. Importar `useMediaQuery` desde `../hooks/useMediaQuery`.
2. `const esCompacto = useMediaQuery('(max-width: 1279px)')`.
3. Usar `esCompacto` en el render para elegir el layout condicionalmente.

---

## Relaciones

```yaml
RELATIONS:
  - type: USES
    target: PAT-mapa-responsive-popup
```