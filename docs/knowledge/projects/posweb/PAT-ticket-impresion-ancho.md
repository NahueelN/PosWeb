# PAT-ticket-impresion-ancho — Impresión de ticket térmico respetando ancho y fuente

## Metadata

```yaml
ID: PAT-ticket-impresion-ancho
Type: Pattern
Name: Ticket térmico que respeta ancho del papel y fuente elegida por el cliente
Status: Active
Priority: High
Level: Project
Sources:
  - frontend/src/lib/ticket.ts
  - frontend/src/components/ticket/TicketModal.tsx
  - frontend/src/pages/venta/TicketResultado.tsx
  - frontend/public/ticket-print.html
Template: pattern-v1
Created: 2026-09-18
Updated: 2026-09-18
Tags:
  - Ventas
  - UX
  - Scanner
```

---

## Descripción

Patrón de impresión de tickets térmicos (58/80mm) que garantiza que **ninguna línea se corte en el margen derecho**, respetando el tamaño (58/80mm), la letra (chica/mediana/grande) y la fuente (Consolas/Courier New) elegidos por el cliente. El ticket se construye como líneas de texto monoespaciadas y se renderiza con `white-space: pre` (sin envolver).

---

## Problema que resuelve

Las líneas del ticket se generan con un ancho fijo de columnas (`TICKET_COLS`: 80mm→40, 58mm→32). Con `white-space: pre` + `overflow-x: hidden`, una línea más ancha que el papel **se recorta en el margen derecho**: un total de `$4.600,00` podía imprimirse como `$4` con el resto oculto. Esto ocurrió por usar el mismo ancho de columnas para las líneas de fuente grande (`lg`) que para la fuente base: a `lg` cada carácter ocupa más ancho físico.

El patrón resuelve dos causas:
1. **Líneas `lg` pre-ajustadas**: se les reserva un ancho reducido (`TICKET_COLS_LG`: 80mm→29, 58mm→23) para que a fuente grande entren en el papel.
2. **Fallback de impresión**: se mide cada línea renderizada y se escala **solo la que desborda**, respetando el tamaño/fuente del resto.

---

## Estructura

```
ticket.ts (buildTicketLines / buildCierreTicketLines)
├── TICKET_COLS        → ancho base (40 / 32)
├── TICKET_PRICE_W     → ancho del monto (14 / 12)
├── TICKET_NAME_MAX    → ancho del nombre (26 / 20)
└── TICKET_COLS_LG     → ancho para líneas lg (29 / 23)

buildTicketLines produce TicketLine[] con { text, size, center, space, bold }
  ├── líneas lg: TOTAL (venta), GANANCIA (cierre)
  └── líneas base: items, pagos, etc.

fitTicketToWidth(container) → fallback de print
  └── por cada fila: si scrollWidth > ancho disponible → escala font-size de esa fila
```

---

## Cuándo usar

- Toda impresión térmica de ticket de venta, cierre de caja o reimpresión.
- Cualquier nuevo ticket que use `buildTicketLines`/`buildCierreTicketLines` como generador de líneas.
- El preview inline (landing `TicketResultado`) y los popups (`TicketModal`) aplican el mismo patrón.

---

## Cuándo NO usar

- Impresión de etiquetas de producto con layout libre (`COMP-LabelPrintDialog`): usa su propio render, no el generador de líneas de ticket.
- Tickets de ancho no estándar (ej. recibos A4): el patrón asume rollo térmico 58/80mm.

---

## Dónde se implementa actualmente

- `frontend/src/lib/ticket.ts` — generador de líneas + `TICKET_COLS_LG` + `fitTicketToWidth`
- `frontend/src/components/ticket/TicketModal.tsx` — print por `window.print()` y `window.open`
- `frontend/src/pages/venta/TicketResultado.tsx` — landing con preview inline y print
- `frontend/public/ticket-print.html` — ventana de impresión Tauri (fit por línea en `setTimeout`)

---

## Cómo implementarlo

1. **Generar líneas**: usar `buildTicketLines(data, ancho)` con `TicketData` (empresa, ventaId, items, total, pagos, cambio, `mesa?`).
2. **Ancho `lg`**: las líneas grandes (TOTAL/GANANCIA) usan `TICKET_COLS_LG` en `LR(...)`, no el ancho base.
3. **Render del preview**: mapear cada línea a un `div` con clase por tamaño (`TXT[px.*]`), `font-weight: bold`, `white-space: pre`.
4. **Print en ventana emergente**: escribir el HTML del preview dentro de una página con `@page { size: Xmm auto; margin: 0 }` y `.receipt div { white-space: pre }`.
5. **Print por `window.print()`**: inyectar estilo `--ticket-width: Xmm`, setear `whiteSpace = 'pre'` en el contenedor y llamar `fitTicketToWidth(container)`.
6. **Print Tauri**: guardar `{ ancho, letra, lines }` en `localStorage`, abrir `ticket-print.html` que reconstruye las filas y aplica el fit por línea antes de imprimir.
7. **Fallback por línea**: medir `scrollWidth` vs ancho disponible; si desborda, escalar el `font-size` de esa fila (`fs * avail / scrollWidth`).

---

## Errores comunes

- ❌ Aplicar el ancho base (`TICKET_COLS`) a las líneas `lg` → el total se corta en el margen derecho.
- ❌ Escalar **todo el ticket** cuando desborda una sola línea → cambia el tamaño/fuente que el cliente eligió. En su lugar, escalar solo la línea que desborda.
- ❌ Olvidar `white-space: pre` en el CSS del preview → los espacios no se respetan y las columnas se descuadran.
- ❌ No pasar `mesa` en `TicketData` → el flujo de mesas pierde la línea `MESA X`.
- ✅ En todos los paths de print (Tauri, `window.open`, `window.print`) aplicar el mismo ajuste; uno solo no alcanza.

---

## Relaciones

```yaml
RELATIONS:
  - type: RESPECTS
    target: PAT-usuario-preferencias
  - type: RELATED
    target: ADR-ticket-resultado-landing
  - type: RELATED
    target: COMP-LabelPrintDialog
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-09-18 | Creación (fix del total cortado: `TICKET_COLS_LG` + `fitTicketToWidth`). |