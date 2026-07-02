# Layout Template

> Template para Knowledge Items de tipo `Layout`.
> Prefijo: `LAYOUT-`

---

## Metadata

```yaml
ID: LAYOUT-{nombre}
Type: Layout
Name: {nombre descriptivo}
Status: Draft | Active | Canonical | Deprecated
Priority: Critical | High | Medium | Low
Level: Core | Domain | Project
Sources:
  - path/to/layout.tsx
Created: YYYY-MM-DD
Updated: YYYY-MM-DD
```

### Opcionales

```yaml
Confidence: High | Medium | Low
Review Required: true | false
Owner: UX | Core
Deprecates: LAYOUT-{layout-anterior}
Deprecated By: LAYOUT-{reemplazo}
Tags:
  - UX
```

---

## Descripción

<!-- Qué layout describe este item. -->

---

## Estructura

```
┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│ Content                             │
├─────────────────────────────────────┤
│ Footer                              │
└─────────────────────────────────────┘
```

---

## Cuándo usar

<!-- Escenarios donde este layout debe utilizarse. -->

---

## Reglas de uso

<!-- Obligaciones al utilizar este layout. -->

- Todas las páginas deben usar este layout.
- El slot `children` debe contener el contenido principal.

---

## Inconsistencias conocidas

<!-- Páginas o componentes que NO respetan este layout. -->

| Ubicación | Problema |
|-----------|----------|

---

## Relaciones

```yaml
RELATIONS:
  - type: USES
    target: COMP-{componente}
  - type: RELATED
    target: DS-{design-system}
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| YYYY-MM-DD | Creación |
