# BUS-mp-verificacion — Verificación de pagos MercadoPago

## Metadata

```yaml
ID: BUS-mp-verificacion
Type: Business Rule
Name: Verificación de pagos MercadoPago (QR automática, transferencia manual)
Status: Active
Priority: High
Level: Project
Sources:
  - PosWeb/Application/MercadoPago/MercadoPagoService.cs
  - PosWeb/Application/MercadoPago/TransferenciaPollingService.cs
  - frontend/src/pages/VentasPage.tsx
Template Version: 1.0
Created: 2026-10-02
Updated: 2026-10-02
Tags:
  - Ventas
```

---

## Descripción

Define cómo se verifica un pago pendiente de MercadoPago (QR o transferencia). La diferencia clave: el cobro **QR** lleva `external_reference` y se puede atar al pago; la **transferencia** no tiene referencia y el matching por monto no ata el pago a una venta concreta.

---

## Reglas

1. **El cobro QR se confirma automáticamente (plan Máxima).** Solo las ventas pendientes con `REFERENCIA_MP` (orden QR) se auto-confirman en el `TransferenciaPollingService`, buscando el pago por `external_reference`. Si el plan no es Máxima, todas las ventas pendientes esperan confirmación manual.

2. **La transferencia se confirma solo manualmente.** Las ventas pendientes sin `REFERENCIA_MP` (medio Transferencia) **nunca** se auto-confirman por monto. El cajero confirma cuando el cliente avisa que transfirió. Motivo: el token OAuth no expone balance ni transferencias de la cuenta, y el matching por monto (últimos 10 min, ±1%) puede confirmar una venta con el pago equivocado.

3. **El "Verificar pago" es una herramienta manual por monto.** El botón del cajero (plan Máxima) consulta pagos aprobados recientes y matchea por monto; es orientativo y solo lo dispara una persona.

4. **Tiempos alineados a 10 minutos.** La espera del frontend (mostrador y mesa), la expiración de la orden QR (`PT10M`) y la ventana de búsqueda de pagos son de 10 minutos. Un pago recibido fuera de esa ventana no se verifica y la venta pendiente se cancela por timeout.

5. **Una sola cuenta vinculada.** Cada nueva autorización OAuth reemplaza a la anterior; solo queda activa la última cuenta vinculada.

---

## Relaciones

```yaml
RELATIONS:
  - type: RESPECTS
    target: BUS-vencimiento-licencia
  - type: RELATED
    target: SERVICE-mercadopago
```