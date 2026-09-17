# COMP-Checkbox — Control Checkbox Reutilizable

## Metadata

```yaml
ID: COMP-Checkbox
Type: Component
Name: Control Checkbox Reutilizable
Status: Active
Priority: Medium
Level: Project
Owner: UX
Sources:
  - frontend/src/components/ui/Checkbox.tsx
  - frontend/src/components/StockTab.tsx
  - frontend/src/components/VencimientosTab.tsx
Template: component-v1
Created: 2026-09-13
Updated: 2026-09-13
Tags:
  - UX
  - Keyboard
```

---

## Descripción

Control de checkbox controlado y accesible que asocia el label al input mediante `htmlFor` + `useId`, de modo que hacer click (o tocar con teclado) sobre el label alterna el valor. Unifica el markup de checkbox que estaba duplicado a mano en varias pantallas.

---

## Problema que resuelve

El checkbox se escribía a mano en cada lugar (label, input, descripción, estilos de foco), lo que generaba dos problemas: inconsistencia visual entre pantallas y labels que no alternaban el check al hacerles click. Centraliza el comportamiento y la apariencia en un solo control.

---

## Ubicación

```
frontend/src/components/ui/Checkbox.tsx
```

---

## Props

```ts
type CheckboxLabelPosition = 'left' | 'right'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  description?: ReactNode
  labelPosition?: CheckboxLabelPosition
  disabled?: boolean
  className?: string
}
```

| Prop | Descripción |
|------|-------------|
| `checked` | Estado controlado del check |
| `onChange` | Callback con el nuevo estado al alternar (por click o teclado) |
| `label` | Texto del label. Al hacer click sobre él también alterna el check |
| `description` | Texto secundario debajo del label. No alterna el check |
| `labelPosition` | Posición del label respecto del check. Default: `right` |
| `disabled` | Deshabilita el control completo (opacidad reducida y `cursor-not-allowed`) |
| `className` | Clases adicionales para el contenedor |

---

## Cuándo usar

- Cualquier opción booleana con texto asociado, especialmente cuando el texto debe ser clickeable para alternar.
- Controles de activación/desactivación de una funcionalidad (stock, vencimientos).

## Cuándo NO usar

- Listas de selección múltiple donde el checkbox no lleva label propio.
- Estados que requieran la semántica de `role="switch"` por accesibilidad explícita.

---

## Dónde se usa actualmente

- `frontend/src/components/StockTab.tsx` — Seguimiento de stock global y control individual por producto
- `frontend/src/components/VencimientosTab.tsx` — Aviso en la barra superior

---

## Ejemplo de uso

```tsx
<Checkbox
  checked={avisoHabilitado}
  onChange={habilitado => void guardarConfiguracion(dias, habilitado)}
  label="Aviso en la barra superior"
  description="Muestra un acceso directo cuando haya productos para revisar."
/>
```

---

## Variantes / Estados

| Variante | Descripción |
|----------|-------------|
| Default | Check a la izquierda y label a la derecha |
| `labelPosition="left"` | Label a la izquierda y check a la derecha |
| Disabled | Opacidad reducida, sin interacción, `cursor-not-allowed` |
| Con descripción | Agrega una línea secundaria debajo del label |

---

## Consideraciones técnicas

- El `useId` genera un id estable y único por instancia para asociar el `<label htmlFor>`, evitando ids colisionados.
- Al ser un `<label>` nativo envolviendo el contenido, el click en el texto alterna el check sin handlers adicionales.
- El estilo de foco usa los tokens del Design System (`--color-primary`, `--color-primary-ring`).
- Es controlado: no mantiene estado interno, el consumidor decide cuándo persiste el cambio.

---

## Relaciones

```yaml
RELATIONS:
  # Sin relaciones registradas por ahora.
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-09-13 | Creación |
