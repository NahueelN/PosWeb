# ADR-ticket-resultado-landing — El resultado de venta es una landing, no un popup

## Metadata

```yaml
ID: ADR-ticket-resultado-landing
Type: ADR
Name: Ticket result is a landing page, not a popup
Status: Active
Priority: High
Level: Project
Sources:
  - frontend/src/pages/venta/TicketResultado.tsx
  - frontend/src/components/ticket/TicketModal.tsx
  - frontend/src/pages/VentasPage.tsx
  - frontend/src/pages/MesasPage.tsx
Template: adr-v1
Created: 2026-09-18
Updated: 2026-09-18
Tags:
  - Ventas
  - UX
  - Keyboard
  - Combo
```

---

## Context

Tras concretar una venta, el usuario debe ver una confirmación clara del resultado. Históricamente `TicketResultado` era una **landing** a página completa: badge "VENTA REGISTRADA", selector de ancho (58/80mm) y letra (chica/mediana/grande), botones **Imprimir** / **Nueva venta** con navegación por teclado (←/→), y el preview del ticket inline.

El commit `32b228b` ("fix ticket venta") intentó un refactor: centralizar la lógica del ticket en `TicketModal` (que ya se usaba en CajaPage para cierre de caja e HistorialPage para reimpresión) y hacer que `TicketResultado` fuera un simple wrapper que abría el modal. Además, `VentasPage` pasó de `return <TicketResultado/>` (reemplazaba la página) a renderizarlo como overlay junto al layout de venta.

El resultado fue una **UX degradada**: al concretar la venta se abría un popup de ticket encima de la pantalla de venta vacía, perdiendo el badge, los botones de acción con navegación por teclado y el preview inline. El refactor quedó **a medio implementar**: la idea de reuso era válida, pero no se preservó la landing.

---

## Decisión

**El resultado de una venta se muestra como una landing a página completa (`TicketResultado`), no como un popup. `TicketModal` se usa únicamente para reimpresión y cierre de caja (CajaPage, HistorialPage), donde el popup es el patrón correcto.**

`TicketResultado` vuelve a ser la landing completa: badge "VENTA REGISTRADA", selector 58/80mm y letra, botones Imprimir / Nueva venta con navegación por teclado (←/→), y preview del ticket inline con el fix del ancho (`TICKET_COLS_LG` + `fitTicketToWidth`).

---

## Alternativas consideradas

| Alternativa | Descarte |
|-------------|----------|
| Delegar en `TicketModal` (popup) como única vía | Se descartó: degrada la UX de confirmación de venta (badge, botones con teclado, preview inline) y deja la pantalla de venta vacía detrás. Sirve para reimpresión/cierre, no para el flujo de venta. |
| Duplicar la lógica de ticket en la landing y en el modal | Se descartó: duplicación de la construcción de líneas y del print. `buildTicketLines` es el único generador de líneas; la landing y el modal lo comparten. |

---

## Consecuencias

### Qué habilita

- Confirmación de venta clara y consistente con el resto del flujo: el usuario ve el ticket completo, elige ancho/letra y decide imprimir o iniciar nueva venta.
- Reuso de `TicketModal` donde el popup es correcto (reimpresión en HistorialPage, cierre de caja en CajaPage).
- El preview inline permite aplicar el fix del ancho del total (`fitTicketToWidth`) directamente sobre las líneas que desbordan, sin tocar el modal.

### Qué limita

- La landing y el modal comparten `buildTicketLines` pero tienen layouts de impresión propios (cada uno aplica su propio fit al ancho). Un cambio de print debe replicarse en ambos puntos (o abstraerse).
- `MesasPage` renderiza `TicketResultado` dentro de un `Dialog` ("Cuenta cobrada"). La landing vive tanto a página completa (VentasPage) como dentro de un Dialog (MesasPage). Ambos usos son válidos; el Dialog debe ser ancho (`xl`) para que la landing respire.

### Qué obliga

- `TicketResultado` siempre debe aceptar `mesa?: string` y pasarla a `buildTicketLines` (flujo de mesas imprime `MESA X`).
- Cualquier futura mejora de UX del resultado de venta se implementa en `TicketResultado` (la landing), no convirtiéndola en popup.

---

## Cuándo reconsiderar

- Si el resultado de venta migra a un flujo donde la confirmación deba ser modal por decisión de producto (ej. venta en pantalla táctil compacta), el ADR debe revisarse.
- Si la lógica de print se abstrae en un helper compartido único entre landing y modal, se elimina la duplicación que hoy obliga a tocar ambos puntos.

---

## Relaciones

```yaml
RELATIONS:
  - type: RELATED
    target: PAT-usuario-preferencias
  - type: USES
    target: COMP-LabelPrintDialog
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-09-18 | Decisión tomada tras el merge que degradó la landing a popup a medio implementar. |