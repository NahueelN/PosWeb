# BUS-mesa-cobro — Cobro de cuenta de mesa

## Metadata

```yaml
ID: BUS-mesa-cobro
Type: Business Rule
Name: Reglas del cobro de cuenta de mesa (restaurante)
Status: Active
Priority: High
Level: Project
Sources:
  - PosWeb/Application/Restaurante/RestauranteService.cs
  - PosWeb/Application/Ventas/VentaService.cs
  - frontend/src/pages/MesasPage.tsx
Template Version: 1.0
Created: 2026-10-01
Updated: 2026-10-01
Tags:
  - POS
  - Ventas
  - Caja
```

---

## Descripción

Define cómo se cobra la cuenta de una mesa en el módulo restaurante. La venta de mesa reutiliza el flujo de venta de mostrador (caja activa, medios de pago, vuelto, cliente/deuda, MercadoPago) con una diferencia central: **no descuenta stock** (`SinStock = true`), porque los items de la comanda son representaciones de platos y el stock se maneja por producto en mostrador.

---

## Reglas

1. **El monto del pago se capa al total de la cuenta.** El pago registrado nunca supera el total (`monto = min(recibido, total)`). El excedente en efectivo se envía como `conCambio` (el billete completo). Esto es obligatorio: el backend rechaza un pago mayor al total salvo que el medio pague vuelto y `conCambio > monto`. Copiar el patrón de `VentasPage`; nunca mandar `monto = recibido` sin capar.

2. **La venta de mesa no descuenta ni valida stock.** `SinStock = true`: se omite la validación de stock y el descuento. El precio usado es el capturado en la comanda (`PrecioUnitario`), no el precio actual del producto.

3. **La sesión se marca cobrada solo con pago confirmado.** Con `EsperarTransferencia = true` (QR/transferencia pendiente) la mesa **queda ocupada** hasta confirmar el pago, para no marcar como cobrada una venta que puede cancelarse. Con pago inmediato se marca `Cobrada` al crear la venta.

4. **Unificar cuentas cierra la sesión de origen.** Al mover los items contables hacia la sesión destino, la sesión origen se **cancela** para que la mesa quede libre. Sin esto, la mesa origen quedaría "Ocupada" con una comanda vacía para siempre.

5. **El cobro parcial genera deuda y exige cliente.** Si el monto recibido es menor al total, se requiere un cliente (`ClienteId`) y la diferencia queda como deuda a su nombre.

6. **Los items devueltos o cancelados no se cobran.** `ItemComanda.Contable` solo incluye Pendiente/EnCocina/Servido. La cuenta (y la unificación) solo considera items contables.

---

## Relaciones

```yaml
RELATIONS:
  - type: RESPECTS
    target: BUS-venta
  - type: RELATED
    target: PAT-cart-flow
  - type: RELATED
    target: SERVICE-restaurante
  - type: RELATED
    target: BUS-mesa-numero-titulo
```