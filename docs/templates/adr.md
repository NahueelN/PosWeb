# ADR Template

> Template para Knowledge Items de tipo `ADR` (Architecture Decision Record).
> Prefijo: `ADR-`
>
> Un ADR nunca debe explicar cómo funciona una implementación.
> Debe explicar por qué existe, qué alternativas fueron evaluadas, qué trade-offs se aceptaron
> y bajo qué condiciones debería reconsiderarse.

---

## Metadata

```yaml
ID: ADR-{nombre}
Type: ADR
Name: {título de la decisión}
Status: Draft | Active | Canonical | Deprecated
Priority: Critical | High | Medium | Low
Level: Core | Domain | Project
Sources:
  - path/to/file.tsx
  - docs/dev-context.md
Created: YYYY-MM-DD
Updated: YYYY-MM-DD
```

### Opcionales

```yaml
Confidence: High | Medium | Low
Deprecates: ADR-{decision-anterior}
Deprecated By: ADR-{nueva-decision}
Tags:
  - tag-controlado-1
```

---

## Contexto

<!-- ¿Qué situación llevó a necesitar esta decisión? -->

---

## Decisión

<!-- ¿Qué se decidió? En una o dos oraciones. -->

---

## Alternativas consideradas

<!-- ¿Qué otras opciones se evaluaron y por qué se descartaron? -->

| Alternativa | Descarte |
|-------------|----------|
| Opción A | ... |
| Opción B | ... |

---

## Consecuencias

<!-- ¿Qué implicancias tiene esta decisión para el resto del proyecto? -->

### Qué habilita

- ...

### Qué limita

- ...

### Qué obliga

- ...

---

## Cuándo reconsiderar

<!-- Bajo qué condiciones este ADR debería revisarse. -->

- ...

---

## Relaciones

```yaml
RELATIONS:
  - type: RELATED
    target: ADR-{otra-decision}
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| YYYY-MM-DD | Decisión tomada |
