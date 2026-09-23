# Segmento restaurante — mesas y cuentas (Etapa 1)

> Implementado en la rama `pr_37`. MVP: mesas con layout libre, comanda, unificación de mesas y cobro de cuenta generando una venta **sin descuento de stock**.

## Alcance
- **Mesas**: CRUD (alta/edición/baja) + mapa con **layout libre** (posiciones x/y en % persistidas, arrastre).
- **Comanda**: abrir mesa, agregar items (productos o combos) con nota, estados `Pendiente/EnCocina/Servido/Devuelto/Cancelado`, impresión de comanda a cocina (formato 80mm, mecanismo de ticket actual).
- **Unificación**: mover la cuenta de una mesa hacia otra.
- **Cobro**: cerrar la mesa genera **una venta** por el flujo actual de `VentaService` (caja activa, medios de pago, vuelto, cliente/deuda, QR/transferencia) pero con `SinStock=true` (no valida ni descuenta stock; usa el precio capturado de la comanda).
- **Módulo habilitable**: off por defecto, toggle en Configuración → Perfil ("Módulo restaurante"). El menú "Mesas" aparece solo habilitado y solo para Admin/SuperAdmin.
- **División de cuenta**: fuera de alcance.

## Modelo de datos (nuevo, SQLite local)
- `Mesa` (`MESA`): sucursal, número, descripción, `POS_X/POS_Y`, activa. Índice único `(sucursal, número)` filtrado por activa.
- `SesionMesa` (`SESION_MESA`): mesa, sucursal, usuario, estado `Abierta/Cobrada/Cancelada`, fechas, `ID_VENTA` de cierre.
- `ItemComanda` (`ITEM_COMANDA`): sesión, producto/combo, descripción y precio capturados, cantidad, nota, estado, fechas.
- `EmpresaConfiguracion` (`EMPRESA_CONFIGURACION`): flag `MODULO_RESTAURANTE`.
- Trazabilidad: `Venta.ID_SESION_MESA`.

## Endpoints (`api/restaurante`, solo Admin/SuperAdmin)
- `GET/PUT config`, `GET/POST/PUT/DELETE mesas`, `POST mesas/{id}/abrir`, `GET sesiones/abiertas`, `GET sesiones/{id}`, `POST sesiones/{id}/items`, `PUT items/{id}/estado`, `POST sesiones/{desde}/unificar/{hacia}`, `POST sesiones/{id}/cobrar`, `POST sesiones/{id}/cancelar`.

## Cambios en el flujo de venta (retrocompatible)
- `VentaDto.SinStock` + `VentaDto.SesionMesaId` + `VentaItemDto.PrecioUnitario` (opcionales, default off).
- `VentaService.CrearVenta` salta validación/descuento de stock cuando `SinStock=true` y usa `PrecioUnitario` capturado.
- `Venta.AgregarRenglon(producto, cantidad, precioUnitario, ofertaId)` nuevo overload.

## Limitaciones / pendientes (fuera de esta etapa)
- Comanda impresa por la impresora por defecto (mismo mecanismo que el ticket); sin selector de impresora de cocina ni impresión silenciosa.
- Sin división de cuenta.
- Sin descuento de stock en mesas (a propósito).
- Pagos: por ahora directos (efectivo/débito/crédito/transferencia con cobro directo); el QR/transferencia pendiente usa el flujo de venta pero la mesa se libera al confirmar por el flujo estándar.

## Verificación
- `dotnet build PosWeb.sln` (0 errores).
- `dotnet test` (los nuevos tests de `RestauranteTest` pasan; 2 fallas preexistentes ajenas a este cambio).
- `npx tsc -b` en `frontend` (0 errores).
- Migración SQLite: `20260909174921_AddRestaurante` en `PosWeb/Migrations/Local`.