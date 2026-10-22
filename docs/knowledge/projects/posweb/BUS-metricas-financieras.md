# BUS-metricas-financieras — Métricas financieras estimadas del dashboard

## Metadata

```yaml
ID: BUS-metricas-financieras
Type: Business Rule
Name: Definición de rentabilidad, margen y flujo de caja del dashboard
Status: Active
Priority: High
Level: Project
Owner: Business
Sources:
  - PosWeb/Analytics/Queries/RentabilidadQuery.cs
  - PosWeb/Analytics/Queries/MargenPorCategoriaQuery.cs
  - PosWeb/Analytics/Queries/MargenPorProductoQuery.cs
  - PosWeb/Analytics/Queries/FlujoCajaQuery.cs
  - PosWeb/Analytics/Queries/DeudasClientesQuery.cs
  - PosWeb/Analytics/Queries/DeudasProveedoresQuery.cs
  - PosWeb/Analytics/WidgetDefinitionRegistry.cs
Template: business-rule-v1
Created: 2026-10-08
Updated: 2026-10-08
Tags:
  - Ventas
  - Compras
  - Caja
  - Deuda
  - Stock
```

---

## Descripción

Define cómo el dashboard de gestión calcula sus métricas financieras. Estas métricas son **estimaciones de gestión**, no contabilidad formal: se calculan a partir del estado actual del catálogo y de los movimientos del período, y existen para orientar decisiones, no para cerrar balances.

---

## Reglas

1. **La ganancia es estimada, no histórica.** `Ganancia = Facturación − Σ(CANTIDAD × COSTO actual del producto)`. Se usa el `COSTO` vigente del producto en el momento de la consulta, no el costo que tenía al momento de la venta. Si el costo cambia, la ganancia histórica del período cambia. Es una métrica de orientación.

2. **El margen es relativo a la facturación.** `Margen % = Ganancia / Facturación × 100`. Si la facturación es 0, el margen es 0 (nunca `NaN`/división por cero).

3. **El flujo de caja es del período, no acumulado.** `Flujo Neto = Ingresos − Egresos`, donde `Ingresos = ventas (!anuladas) + cobros de deudas (PagoDeuda no anulado)` y `Egresos = compras + gastos operativos (Gasto no anulado con caja)`. Los cuatro componentes se filtran por el mismo rango de fechas.

4. **El saldo de una deuda es lo pendiente, no lo original.** `Saldo = MONTO_DEUDA − MONTO_PAGADO`. Toda métrica de deuda excluye las deudas `PAGO = true` y `ANULADA = true`. "Fiados" son deudas de clientes (`ID_CLIENTE`); las deudas con proveedores (`ID_PROVEEDOR`) se reportan por separado.

5. **Los fiados se originan en el pago parcial.** Una venta con pago parcial requiere un cliente (ver `BUS-venta`, regla 5), y genera la deuda de cliente que alimentan los indicadores de fiados.

6. **Son métricas de gestión, restringidas a Admin/SuperAdmin.** No reemplazan ni condicionan la información operativa: el cierre de caja, el arqueo y el cobro siguen mostrando al operador los totales que necesita. Ver `BUS-acceso-informacion-sensible`.

---

## Relaciones

```yaml
RELATIONS:
  - type: RELATED
    target: MODEL-AnalyticsQuery
  - type: RELATED
    target: PAT-DashboardBuilder
  - type: RELATED
    target: PAT-WidgetPlatform
  - type: RESPECTS
    target: BUS-acceso-informacion-sensible
  - type: RELATED
    target: BUS-venta
```
