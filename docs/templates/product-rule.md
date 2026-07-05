# Product Rule Template

> Template para Knowledge Items de tipo `Product Rule`.
> Prefijo: `PRD-`

---

## Metadata

```yaml
ID: PRD-{nombre}
Type: Product Rule
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
Deprecates: PRD-{regla-anterior}
Deprecated By: PRD-{nueva-regla}
Tags:
  - tag-controlado-1
```

---

## Descripción

<!-- Qué decisión de producto representa. Una o dos frases. -->

---

## Problema del operador

<!-- Qué problema del uso diario resuelve esta regla. -->
<!-- Debe responder: ¿cuándo el operador se encuentra con este problema? -->

---

## Reglas

<!-- Comportamiento obligatorio que toda implementación debe respetar. -->

1. **{Regla 1}**: {descripción}
2. **{Regla 2}**: {descripción}

---

## Entidades que deben cumplirla

<!-- Lista de entidades comerciales afectadas y su estado de cumplimiento. -->

| Entidad | Administración | Contexto consumidor | Alta cruzada |
|---------|---------------|-------------------|--------------|
| Cliente | ClientesPage | VentasPage | ✅ |
| Proveedor | ProveedoresPage | CompraPage | ✅ |
| {nueva} | {pending} | {pending} | ❌ Pendiente |

---

## Comportamiento esperado

<!-- Flujo que debe repetirse para cualquier entidad que implemente esta regla. -->

```

Buscar entidad
    ↓
¿Existe?
├── Sí → Seleccionar
└── No → + Nueva entidad
        ↓
    Completar datos
        ↓
    Guardar
        ↓
    Seleccionar automáticamente
        ↓
    Continuar con el proceso
```

---

## Relaciones

```yaml
RELATIONS:
  - type: RELATED
    target: BUS-{regla-de-negocio-asociada}
```
