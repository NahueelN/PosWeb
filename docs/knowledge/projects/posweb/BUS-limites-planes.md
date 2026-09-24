# BUS-limites-planes

> Reglas de límites por plan de PosWeb: cuántos productos activos, usuarios, admins y sucursales permite cada nivel, y cómo se hace cumplir el tope de productos (creación, importación y recorte).

---

## Metadata

```yaml
ID: BUS-limites-planes
Type: Business Rule
Name: Límites de planes (Gratuito/Básico/Máximo) y tope de productos
Status: Active
Priority: High
Level: Project
Sources:
  - PosWeb.Domain/LicenciaConfig.cs
  - PosWeb.Domain/Suscripcion.cs
  - PosWeb/Application/Licensing/LicenciaService.cs
  - PosWeb/Application/Productos/ProductoService.cs
  - frontend/src/App.tsx
  - frontend/src/components/Layout.tsx
Created: 2026-09-23
Updated: 2026-09-23
Template Version: 1.0
Tags:
  - Suscripcion
  - Stock
```

---

## Descripción

Define los límites de cada plan de suscripción y las invariantes para hacer cumplir el tope de productos activos. La tabla canónica vive en `PlanLimits.Get(nivel)`; ningún otro valor de límite es fuente de verdad.

---

## Tabla canónica de límites

| Plan | Sucursales | Admins | Usuarios | Productos activos |
|------|-----------|--------|----------|-------------------|
| Gratuito | 1 | 1 | 1 | 500 |
| Basica | 1 | ∞ | 3 | 1000 |
| Maxima | ∞ | ∞ | ∞ | 10000 |

`maxProductos` se deriva de `PlanLimits.Get(nivel)`; no existe columna dedicada en la entidad.

---

## Reglas

1. **PlanLimits es la fuente única**: `ObtenerLimitesPlan()` devuelve siempre `PlanLimits.Get(nivel efectivo)`. Los `MAX_*` guardados en la `Suscripcion` son solo copia local y **no** se mezclan con la tabla canónica al reportar límites.

2. **El tope cuenta solo productos ACTIVOS**: los inactivos / borrados lógicos no ocupan cupo. El conteo es `Producto.Count(p => p.ACTIVO)`.

3. **Crear un producto valida el tope**: `Crear()` rechaza con `LimiteProductosException` si el alta haría superar el máximo del plan. **Reactivar un producto inactivo también consume cupo**: la rama de reuso de `Crear()` valida antes de reactivar.

4. **El import da de alta todo y recorta al final**: `ImportarProductos()` **no** rechaza por fila (abortar la importación masiva sería inutilizable). Crea todos los productos y recién al terminar aplica `RecortarProductosAlMaximoDelPlan()`, desactivando los sobrantes hasta el tope del plan.

5. **Recorte defensivo en Gratuito**: la rama Gratuito de `VerificarAcceso()` ejecuta el recorte a 500 de forma idempotente y persistida (`SaveChanges`). Así, aunque alguien edite la DB local a Gratuito (o un plan pago vencido intente escapar), el tope de 500 productos activos se respeta. La desactivación es aleatoria (borrado lógico, los tickets históricos conservan la referencia).

6. **El nivel efectivo decide el límite**: el nivel se resuelve desde la `Suscripcion` del titular (o `LicenciaConfig.Plan` si no existe). Sin licencia ni suscripción, `ObtenerLimitesPlan()` devuelve `(0,0,0,0)` y no se enforcea tope.

7. **Grisado de módulos en Gratuito**: en el plan Gratuito solo quedan operativos ventas, caja, stock, configuración (Perfil, Usuarios, Márgenes, Stock) y Ayuda. El frontend oculta/redirige el resto (`hiddenForGratuito` en `Layout.tsx` y `GratuitoGuard` en `App.tsx`), usando el nivel efectivo reportado por `/licencia/resumen`.

---

## Relaciones

```yaml
RELATIONS:
  - type: RESPECTS
    target: BUS-vencimiento-licencia
  - type: RESPECTED_BY
    target: SERVICE-licensing-worker
  - type: RELATED
    target: FLOW-suscripcion
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-09-23 | Creación (planes Gratuito/Básico/Máximo) |