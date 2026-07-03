# Standard Template

> Template para Knowledge Items de tipo `Standard`.
> Prefijo: `STAND-`
>
> Los Standards representan acuerdos globales del proyecto:
> coding standards, naming conventions, UX guidelines, testing guidelines, etc.

---

## Metadata

```yaml
ID: STAND-{nombre}
Type: Standard
Name: {nombre descriptivo}
Status: Draft | Active | Canonical | Deprecated
Priority: Critical | High | Medium | Low
Level: Core | Domain | Project
Sources:
  - path/to/relevant-file.ts
Created: YYYY-MM-DD
Updated: YYYY-MM-DD
```

### Opcionales

```yaml
Confidence: High | Medium | Low
Review Required: true | false
Owner: Core | UX | Business | Shared | Infrastructure
Deprecates: STAND-{standard-anterior}
Deprecated By: STAND-{reemplazo}
Tags:
  - tag-controlado-1
```

---

## Descripción

<!-- Qué estándar define este item. -->

---

## Reglas

<!-- Lista de reglas que deben seguirse. -->

1. **{Regla 1}**: {descripción}
2. **{Regla 2}**: {descripción}

---

## Ejemplos

### Correcto ✅

```tsx
// Ejemplo de código que sigue el estándar
```

### Incorrecto ❌

```tsx
// Ejemplo de código que rompe el estándar
```

---

## Excepciones

<!-- Casos donde está justificado no seguir el estándar. -->

---

## Relaciones

```yaml
RELATIONS:
  - type: RELATED
    target: STAND-{otro-standard}
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| YYYY-MM-DD | Creación |
