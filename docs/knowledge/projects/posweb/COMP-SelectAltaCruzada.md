# COMP-SelectAltaCruzada — Lookup Select con Alta Cruzada

## Metadata

```yaml
ID: COMP-SelectAltaCruzada
Type: Component
Name: Lookup Select con Alta Cruzada
Status: Active
Priority: High
Level: Project
Owner: UX
Sources:
  - frontend/src/components/ui/SelectAltaCruzada.tsx
Created: 2026-08-04
Updated: 2026-08-04
Tags:
  - Select
  - Alta Cruzada
  - Lookup
  - Keyboard
```

---

## Descripción

Control genérico de selección que combina un `<select>` nativo con el botón de **Alta Cruzada** (`+`). Reemplaza la flecha nativa del browser por un `ChevronDown` propio para que el `+` no se superponga con ella.

---

## Problema que resuelve

Antes existían dos implementaciones duplicadas (Categoría y Unidad de medida en `ProductFormModal`) donde el botón `+` se posicionaba sobre la flecha nativa del `<select>`, provocando que el `+` y la flecha se superpusieran visualmente. Centraliza el patrón visual y de comportamiento en un solo control reutilizable.

---

## Ubicación

```
frontend/src/components/ui/SelectAltaCruzada.tsx
```

---

## Props

```ts
export interface SelectAltaCruzadaOption {
  value: string
  label: string
}

interface SelectAltaCruzadaProps {
  value: string
  onChange: (value: string) => void
  options: SelectAltaCruzadaOption[]
  placeholder?: string
  disabled?: boolean
  showCreate?: boolean
  onCreate?: () => void
  createTitle?: string
  dataField?: string
}
```

| Prop | Descripción |
|------|-------------|
| `value` | Valor seleccionado (string) |
| `onChange` | Callback al cambiar la selección |
| `options` | Lista de opciones `{ value, label }` |
| `placeholder` | Texto de la opción vacía (`Sin categoría`, `Sin unidad`). Si se omite, no hay opción vacía |
| `disabled` | Deshabilita el select (estilo gris + `cursor-not-allowed`) |
| `showCreate` | Muestra el botón `+` (default `true`). Útil cuando el select está fijo (ej: pesable) |
| `onCreate` | Abre el modal de Alta Cruzada |
| `createTitle` | Tooltip del botón `+` |
| `dataField` | Identificador para la navegación por teclado del formulario padre |

---

## Cuándo usar

- Todo lookup que admita crear la entidad sobre la marcha (Alta Cruzada).
- Cuando el select deba mostrar su propia flecha sin superponerla con el `+`.

## Cuándo NO usar

- Cuando el lookup necesita búsqueda por texto con dropdown (ej: proveedor en CompraPage) — usar el patrón de input + dropdown de `PAT-alta-cruzada`.
- Cuando la entidad es un valor fijo del sistema (lista cerrada).

---

## Dónde se usa actualmente

- `frontend/src/components/ProductFormModal.tsx` — Categoría y Unidad de medida

---

## Ejemplo de uso

```tsx
<SelectAltaCruzada
  value={categoriaId}
  onChange={setCategoriaId}
  options={categorias.map(c => ({ value: String(c.id), label: c.descripcion }))}
  placeholder="Sin categoría"
  onCreate={() => setShowNuevaCategoria(true)}
  createTitle="Nueva categoría"
  dataField="categoria"
/>
```

---

## Variantes / Estados

| Variante | Descripción |
|----------|-------------|
| Default | Select activo con `+` y chevron a `right-6` |
| Disabled | Fondo gris, `cursor-not-allowed`, sin foco; puede ocultar el `+` con `showCreate={false}` |
| Sin placeholder | Cuando el valor es fijo (pesable/bulto), no se renderiza opción vacía |

---

## Consideraciones técnicas

- El select usa `appearance-none` para eliminar la flecha nativa del browser.
- El `ChevronDown` (13px) se posiciona a `right-6` y el botón `+` (ancho `w-6`) a `right-0`, evitando superposición.
- El `select` tiene `pr-9` para que el texto no quede debajo de los dos iconos.
- Mantiene la navegación por teclado del formulario padre: `data-field` se aplica al `<select>`, y el `+` tiene `tabIndex={-1}` para no interferir.

---

## Relaciones

```yaml
RELATIONS:
  - type: IMPLEMENTS
    target: PAT-alta-cruzada
  - type: USES
    target: COMP-Dialog
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-08-04 | Creación |
