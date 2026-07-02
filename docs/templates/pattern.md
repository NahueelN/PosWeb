# Pattern Template

> Template para Knowledge Items de tipo `Pattern`.
> Prefijo: `PAT-`

---

## Metadata

```yaml
ID: PAT-{nombre}
Type: Pattern
Name: {nombre descriptivo}
Status: Draft | Active | Canonical | Deprecated
Priority: Critical | High | Medium | Low
Level: Core | Domain | Project
Sources:
  - path/to/implementation-1.tsx
  - path/to/implementation-2.tsx
Created: YYYY-MM-DD
Updated: YYYY-MM-DD
```

### Opcionales (agregar solo si aportan valor)

```yaml
Confidence: High | Medium | Low
Review Required: true | false
Owner: Core | UX | Business | Shared | Infrastructure
Deprecates: PAT-{otro-patron}
Deprecated By: PAT-{reemplazo}
Tags:
  - tag-controlado-1
Version: 1.0.0
```

---

## Descripción

<!-- Qué es este patrón. Una o dos frases. -->

---

## Problema que resuelve

<!-- ¿Por qué existe? ¿Qué pasaría si no se siguiera este patrón? -->

---

## Estructura

<!-- Si es un patrón de composición, mostrar la estructura de componentes. -->

```
ComponentePadre
├── Slot1
├── Slot2
└── Slot3
```

---

## Cuándo usar

<!-- Escenarios donde este patrón debe aplicarse. -->

---

## Cuándo NO usar

<!-- Escenarios donde este patrón NO debe aplicarse. -->

---

## Dónde se implementa actualmente

<!-- Lista de lugares donde el patrón está aplicado. -->

- `pages/VentasPage.tsx`
- `pages/CompraPage.tsx`

---

## Cómo implementarlo

<!-- Guía paso a paso para aplicar el patrón en un nuevo contexto. -->

1. ...
2. ...
3. ...

---

## Componentes involucrados

<!-- Componentes que forman parte del patrón. -->

| Componente | Rol |
|------------|-----|
| `CartHost` | Orquestador |
| `CartPanel` | Panel visual |

---

## Reglas de negocio relacionadas

<!-- Reglas de negocio que el patrón debe respetar. -->

---

## Flujo de teclado

<!-- Si el patrón incluye navegación por teclado, documentarla. -->

```
Search → Grid → Item → Monto → Verify → Confirm
```

---

## Errores comunes

<!-- Implementaciones incorrectas frecuentes. -->

- ❌ No hacer X
- ✅ En su lugar, hacer Y

---

## Relaciones

```yaml
RELATIONS:
  - type: USES
    target: COMP-{componente}
  - type: RESPECTS
    target: BUS-{regla}
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| YYYY-MM-DD | Creación |
