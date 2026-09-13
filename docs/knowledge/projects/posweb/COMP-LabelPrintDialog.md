# COMP-LabelPrintDialog — Diálogo de Impresión de Etiquetas

## Metadata

```yaml
ID: COMP-LabelPrintDialog
Type: Component
Name: Diálogo de Impresión de Etiquetas
Status: Active
Priority: High
Level: Project
Owner: UX
Sources:
  - frontend/src/components/LabelPrintDialog.tsx
  - frontend/src/components/ProductFormModal.tsx
  - frontend/src/pages/CombosPage.tsx
Template: component-v1
Created: 2026-09-13
Updated: 2026-09-13
Tags:
  - UX
  - Impresion
```

---

## Descripción

Diálogo de impresión térmica de etiquetas. Muestra una vista previa con nombre, precio y código de barras opcional, permite elegir cantidad, ancho de rollo (58/80 mm) y tipo de código a imprimir.

---

## Problema que resuelve

La lógica de impresión de etiquetas (estado de cantidad, ancho, inclusión de código, vista previa, renderizado del SVG y apertura de la ventana de impresión) estaba embebida dentro de `ProductFormModal`. Al necesitar la misma impresión en el popup de Combo, se extrajo a un componente reutilizable para evitar duplicar ~90 líneas y mantener un único comportamiento de impresión.

---

## Ubicación

```
frontend/src/components/LabelPrintDialog.tsx
```

---

## Props

```ts
interface LabelPrintDialogProps {
  nombre: string
  precio: number
  codigoBarra?: string
  codigoInterno?: string
  onClose: () => void
}
```

| Prop | Descripción |
|------|-------------|
| `nombre` | Texto principal de la etiqueta (producto o combo) |
| `precio` | Precio a imprimir. Debe ser mayor a 0 para imprimir |
| `codigoBarra` | Código EAN. Opcional |
| `codigoInterno` | Código interno. Opcional |
| `onClose` | Cierra el diálogo |

---

## Cuándo usar

- Todo popup que necesite imprimir una etiqueta térmica (producto, combo, y futuros ítems vendibles).
- Cuando se disponga de al menos un código (EAN o interno).

## Cuándo NO usar

- Impresión de tickets de venta (usar `TicketModal` / `TicketResultado`).
- Impresión de solo el código de barras sin nombre ni precio (usar `COMP` equivalente a `BarcodePrintDialog`).

---

## Dónde se usa actualmente

- `frontend/src/components/ProductFormModal.tsx` — botón "Imprimir etiqueta" del footer
- `frontend/src/pages/CombosPage.tsx` — botón "Imprimir etiqueta" del footer del combo

---

## Ejemplo de uso

```tsx
{showLabelPrint && (
  <LabelPrintDialog
    nombre={nombre}
    precio={Number(precio) || 0}
    codigoBarra={codigoBarra}
    codigoInterno={codigoProducto}
    onClose={() => setShowLabelPrint(false)}
  />
)}
```

---

## Variantes / Estados

| Estado | Descripción |
|--------|-------------|
| Ambos códigos | El selector EAN / código interno queda habilitado |
| Un solo código | El selector queda bloqueado y fijo en el único tipo disponible (ej: combo, que solo tiene código interno) |
| Sin código | El check "Incluir código" queda deshabilitado |
| Disabled | Fondo gris, texto atenuado, sin foco |

---

## Consideraciones técnicas

- Las preferencias de ancho, incluir código y tipo de código se persisten en la sección `etiquetaProducto` de preferencias de usuario, compartida por ambos popups.
- `tipoEfectivo` corrige el tipo guardado si el código correspondiente no existe, evitando vistas previas vacías.
- `bloqueoSinAlternativa` desactiva el selector cuando falta uno de los dos códigos.
- Usa los tokens del Design System (`--color-primary`, `--color-primary-ring`).
- En Tauri abre una `WebviewWindow` con `label-print.html`; en navegador abre una ventana e imprime.

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
| 2026-09-13 | Creación. Extraído de ProductFormModal y aplicado a CombosPage. Selector de código bloqueado cuando hay un solo tipo. |
