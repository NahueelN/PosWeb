# PAT-mapa-responsive-popup — Mapa full-screen con popup en pantallas chicas

## Metadata

```yaml
ID: PAT-mapa-responsive-popup
Type: Pattern
Name: Mapa responsive con popup de detalle
Status: Active
Priority: High
Level: Project
Sources:
  - frontend/src/pages/MesasPage.tsx
  - frontend/src/hooks/useMediaQuery.ts
Template: pattern-v1
Created: 2026-09-21
Updated: 2026-09-21
Tags:
  - POS
  - UX
```

---

## Descripción

En pantallas grandes (≥1280px) se muestra un layout de dos paneles: mapa + panel de detalle lateral. Por debajo del umbral `xl` el mapa ocupa todo el alto disponible y el panel de detalle se abre como un `Dialog` (popup) al seleccionar una mesa. Mantiene la misma funcionalidad en ambos modos reutilizando el mismo JSX de panel.

---

## Problema que resuelve

En pantallas pequeñas, el layout de dos columnas dejaba el mapa y el panel muy angostos y el panel lateral robaba espacio valioso al mapa. El patrón convierte el mapa en pantalla completa y mueve el detalle a un popup, sin duplicar la lógica ni el JSX del panel.

---

## Estructura

```
Pagina (MesasPage)
├── mapa            ← JSX reutilizable (grid de mesas)
├── comandaPanel(compacto)  ← misma función de render para ambos modos
│
├── esCompacto (useMediaQuery max-width:1279px)
│   ├── true  → mapa full-height + <Dialog>{comandaPanel(true)}</Dialog>
│   └── false → grid 2fr/1fr: {mapa} + {comandaPanel(false)}
```

---

## Cuándo usar

- Pantallas con un área principal (mapa, grid, canvas) + un panel de detalle/lateral.
- Cuando el panel lateral no es viable en viewports angostos y el detalle puede vivir en un popup.
- Cuando se quiere mantener exactamente el mismo contenido de detalle en ambos modos.

## Cuándo NO usar

- Cuando el panel lateral funciona bien en pantallas chicas (contenido corto o crítico siempre visible).
- Cuando el popup perjudica el flujo (ej. tareas que requieren ver el mapa y el detalle simultáneamente).

---

## Cómo implementarlo

1. Extraer el panel de detalle a una función `comandaPanel(compacto: boolean)` que devuelva el JSX.
2. Extraer el área principal a una variable `mapa`.
3. `const esCompacto = useMediaQuery('(max-width: 1279px)')`.
4. En el render, elegir entre: mapa full + `Dialog` (compacto) o grid de dos columnas (grande).
5. El `Dialog` se abre con `open={!!mesaSeleccionada}` y al cerrar se deselecciona la mesa.
6. En modo edición del mapa, no abrir el popup al arrastrar (guardar `onClick` cuando `esCompacto && editarMapa`).

---

## Errores comunes

- ❌ Duplicar el JSX del panel en dos ramas — se desincronizan.
- ✅ Reutilizar la misma función de render con un parámetro `compacto`.
- ❌ Abrir el popup al arrastrar mesas en modo edición sobre pantallas compactas.
- ✅ Bloquear la selección durante el arrastre en modo compacto.
- ❌ Usar `window.innerWidth` sin escuchar resize — no reacciona al redimensionar.
- ✅ Usar `useMediaQuery` que escucha el evento `change`.

---

## Reglas de negocio relacionadas

- `BUS-mesa-numero-titulo` — la tarjeta muestra solo el número, el título es opcional.

---

## Relaciones

```yaml
RELATIONS:
  - type: USES
    target: HOOK-use-media-query
  - type: RESPECTS
    target: BUS-mesa-numero-titulo
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-09-21 | Creación |