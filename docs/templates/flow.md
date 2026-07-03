# Flow Template

> Template para Knowledge Items de tipo `Flow`.
> Prefijo: `FLOW-`

---

## Metadata

```yaml
ID: FLOW-{nombre}
Type: Flow
Name: {nombre descriptivo}
Status: Draft | Active | Canonical | Deprecated
Priority: Critical | High | Medium | Low
Level: Core | Domain | Project
Sources:
  - path/to/page.tsx
Created: YYYY-MM-DD
Updated: YYYY-MM-DD
```

### Opcionales

```yaml
Confidence: High | Medium | Low
Review Required: true | false
Deprecates: FLOW-{flujo-anterior}
Deprecated By: FLOW-{reemplazo}
Tags:
  - tag-controlado-1
```

---

## Descripción

<!-- Qué flujo describe este item. Una o dos frases. -->

---

## Diagrama de estados

```
┌──────────┐    acción    ┌──────────┐
│ Estado A │ ───────────► │ Estado B │
└──────────┘              └──────────┘
```

---

## Pasos del flujo

1. **{Paso 1}**: {descripción}
2. **{Paso 2}**: {descripción}
3. **{Paso 3}**: {descripción}

---

## Páginas involucradas

<!-- Archivos donde se implementa el flujo. -->

- `pages/EjemploPage.tsx`

---

## Reglas de negocio aplicables

<!-- Reglas de negocio que el flujo debe respetar. -->

---

## Flujo de teclado

<!-- Si aplica, secuencia de navegación por teclado. -->

---

## Relaciones

```yaml
RELATIONS:
  - type: RESPECTS
    target: BUS-{regla}
  - type: USES
    target: COMP-{componente}
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| YYYY-MM-DD | Creación |
