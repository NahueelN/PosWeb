# Design System Template

> Template para Knowledge Items de tipo `Design System`.
> Prefijo: `DS-`

---

## Metadata

```yaml
ID: DS-{nombre}
Type: Design System
Name: {nombre descriptivo}
Status: Draft | Active | Canonical | Deprecated
Priority: Critical | High | Medium | Low
Level: Core | Domain | Project
Sources:
  - path/to/index.css
  - path/to/component.tsx
Created: YYYY-MM-DD
Updated: YYYY-MM-DD
```

### Opcionales

```yaml
Confidence: High | Medium | Low
Review Required: true | false
Owner: UX | Core
Deprecates: DS-{item-anterior}
Deprecated By: DS-{reemplazo}
Tags:
  - UX
  - tag-controlado-2
```

---

## Descripción

<!-- Qué aspecto del Design System documenta este item. -->

---

## Tokens / Valores

<!-- Si define tokens, listarlos. -->

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `oklch(...)` | Color principal de la marca |

---

## Reglas de uso

<!-- Cuándo y cómo deben usarse estos tokens o componentes. -->

---

## Inconsistencias conocidas

<!-- Lugares donde el estándar NO se está cumpliendo actualmente. -->

| Ubicación | Problema |
|-----------|----------|
| `ComponenteX` | Usa `indigo-500` en vez del token `--color-primary` |

---

## Relaciones

```yaml
RELATIONS:
  - type: USES
    target: COMP-{componente}
  - type: RELATED
    target: LAYOUT-{layout}
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| YYYY-MM-DD | Creación |
