# Business Rule Template

> Template para Knowledge Items de tipo `Business Rule`.
> Prefijo: `BUS-`

---

## Metadata

```yaml
ID: BUS-{nombre}
Type: Business Rule
Name: {nombre descriptivo}
Status: Draft | Active | Canonical | Deprecated
Priority: Critical | High | Medium | Low
Level: Core | Domain | Project
Sources:
  - path/to/file.tsx
Created: YYYY-MM-DD
Updated: YYYY-MM-DD
```

### Opcionales

```yaml
Confidence: High | Medium | Low
Review Required: true | false
Deprecates: BUS-{regla-anterior}
Deprecated By: BUS-{nueva-regla}
Tags:
  - tag-controlado-1
```

---

## Descripción

<!-- Qué regla de negocio representa. Una o dos frases. -->

---

## Reglas

<!-- Lista de invariantes que deben respetarse. -->

1. **{Nombre de la regla}**: {descripción}
2. **{Nombre de la regla}**: {descripción}

---

## Relaciones

```yaml
RELATIONS:
  - type: EXTENDS
    target: BUS-{concepto-base}
  - type: RELATED
    target: PAT-{patron}
```
