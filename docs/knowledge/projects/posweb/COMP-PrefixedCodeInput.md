# COMP-PrefixedCodeInput — Input de Código con Prefijo

## Metadata

```yaml
ID: COMP-PrefixedCodeInput
Type: Component
Name: Input de Código con Prefijo
Status: Active
Priority: Medium
Level: Project
Owner: UX
Sources:
  - frontend/src/components/ui/PrefixedCodeInput.tsx
  - frontend/src/components/ProductFormModal.tsx
  - frontend/src/pages/CombosPage.tsx
Template: component-v1
Created: 2026-09-13
Updated: 2026-09-13
Tags:
  - UX
  - Keyboard
```

---

## Descripción

Input de texto para códigos internos con un prefijo fijo visible dentro del campo (ej: `PROD`, `COMB`). El usuario solo edita la parte numérica; el componente antepone el prefijo al valor completo.

---

## Problema que resuelve

El código interno de producto y el número de combo tenían dos implementaciones distintas del mismo concepto (prefijo + número), con estilos y paddings diferentes. Esto rompía la consistencia visual entre popups y duplicaba la lógica de "mostrar sin prefijo / guardar con prefijo". Centraliza el control y garantiza que ambos códigos se vean y se comporten igual.

---

## Ubicación

```
frontend/src/components/ui/PrefixedCodeInput.tsx
```

---

## Props

```ts
type PrefixedCodeInputSize = 'sm' | 'lg'

interface PrefixedCodeInputProps {
  prefix: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  size?: PrefixedCodeInputSize
  dataField?: string
  trailing?: ReactNode
  className?: string
}
```

| Prop | Descripción |
|------|-------------|
| `prefix` | Prefijo fijo mostrado dentro del input (ej: `PROD`, `COMB`) |
| `value` | Valor completo, incluyendo el prefijo |
| `onChange` | Recibe el valor completo con el prefijo aplicado. Devuelve `''` si se borra todo |
| `placeholder` | Texto de ayuda del input (`Auto-generado`) |
| `disabled` | Deshabilita el input |
| `size` | Altura del control: `sm` (`h-7`, default) o `lg` (`h-9`) |
| `dataField` | Identificador para la navegación por teclado del formulario padre |
| `trailing` | Contenido a la derecha dentro del input (ej: botón imprimir) |
| `className` | Clases adicionales para el contenedor relativo |

---

## Cuándo usar

- Códigos internos con prefijo fijo definido por el sistema (producto, combo, y futuros códigos internos).
- Cuando el usuario no debe poder editar el prefijo.

## Cuándo NO usar

- Códigos libres sin prefijo (ej: código de barras EAN).
- Campos donde el prefijo también debe ser editable.

---

## Dónde se usa actualmente

- `frontend/src/components/ProductFormModal.tsx` — Código interno (`PROD`)
- `frontend/src/pages/CombosPage.tsx` — Número de combo (`COMB`)

---

## Ejemplo de uso

```tsx
<PrefixedCodeInput
  prefix="PROD"
  value={codigoProducto}
  onChange={setCodigoProducto}
  dataField="codigoProducto"
  placeholder="Auto-generado"
  trailing={codigoProducto ? (
    <button type="button" onClick={() => imprimir(codigoProducto)}>
      <Printer size={13} />
    </button>
  ) : undefined}
/>
```

---

## Variantes / Estados

| Variante | Descripción |
|----------|-------------|
| `size="sm"` | Compacto (`h-7`), default. Usado en el popup de producto |
| `size="lg"` | Más alto (`h-9`), para popups con inputs más grandes. Usado en el popup de combo |
| Con `trailing` | Agrega una acción a la derecha (ej: imprimir etiqueta) |
| Disabled | Fondo gris, texto atenuado, sin foco |

---

## Consideraciones técnicas

- El padding izquierdo se calcula en línea a partir del largo del prefijo (`6 + prefix.length * 6.25px`), de modo que el prefijo nunca se superpone con el texto.
- El valor se guarda completo (prefijo + número); para mostrarlo se recorta el prefijo.
- Usa los tokens del Design System (`--color-primary`, `--color-primary-ring`).
- La altura (`h-7`), el borde y el radio son los del input compacto del estándar de diálogos.

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
| 2026-09-13 | Creación. Extraído de ProductFormModal (código interno) y aplicado a CombosPage. |
