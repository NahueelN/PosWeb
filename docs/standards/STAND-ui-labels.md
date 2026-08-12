# STAND-ui-labels — Consistencia de Labels de Controles

## Metadata

```yaml
ID: STAND-ui-labels
Type: Standard
Name: Consistencia de Labels de Controles
Status: Active
Priority: Medium
Level: Project
Owner: UX
Sources:
  - frontend/src/components/ProductFormModal.tsx
Created: 2026-08-04
Updated: 2026-08-04
Tags:
  - UI
  - UX
  - Design System
```

---

## Descripción

Todos los labels de controles de la interfaz deben ser visualmente iguales entre sí: mismo tamaño, mismo peso, mismo color y mismo estilo de tipografía, sin importar dónde estén ubicados. La consistencia hace que el operador lea los campos de un vistazo y que la UI se perciba como un sistema único, no como un conjunto de formularios sueltos.

---

## Reglas

1. **Un solo estilo de label**: todos los labels usan el mismo tamaño de fuente, peso, color y `letter-spacing`. El estilo actual de referencia es `text-xs font-semibold text-gray-700 uppercase tracking-wider` (con `mb-1`).
2. **Mismo estilo en todos los formularios**: la uniformidad aplica a todos los controles del proyecto — modales, páginas, paneles — no solo a un componente. Si un label nuevo no coincide con el estándar, se ajusta al estándar (no se crea una variante nueva).
3. **Contraste mínimo**: el color del label debe contrastar claramente con el fondo (`gray-700` como mínimo). No se usan grises muy claros en labels activos.
4. **Estados deshabilitados**: un label de un control deshabilitado puede aclararse (`gray-400`) para reflejar el estado, pero conserva tamaño, peso y estilo.

---

## Ejemplos

### Correcto ✅

```tsx
<label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
  Código de barras
</label>
```

### Incorrecto ❌

```tsx
<label className="block text-[11px] font-medium text-gray-400">Código de barras</label>
<label className="text-sm text-gray-600">Precio de venta</label>
```

---

## Excepciones

- El label del campo primario de un Dialog (`DialogPrimaryField`) mantiene su propio estilo de mayor jerarquía.
- Títulos de sección dentro de formularios pueden usar un estilo distinto al label de campo, pero deben ser consistentes entre sí.

---

## Relaciones

```yaml
RELATIONS:
  - type: RELATED
    target: DS-dialog-popup
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-08-04 | Creación |
