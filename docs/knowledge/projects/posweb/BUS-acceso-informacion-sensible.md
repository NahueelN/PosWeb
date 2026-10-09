# BUS-acceso-informacion-sensible — Acceso a información comercial sensible

## Metadata

```yaml
ID: BUS-acceso-informacion-sensible
Type: Business Rule
Name: Información comercial de gestión restringida a Admin/SuperAdmin
Status: Active
Priority: High
Level: Project
Sources:
  - frontend/src/App.tsx
  - frontend/src/components/Layout.tsx
  - frontend/src/pages/CajaPage.tsx
  - PosWeb/Controllers/DashboardController.cs
  - PosWeb/Controllers/CajasController.cs
  - PosWeb/Controllers/VentasController.cs
  - PosWeb/Controllers/LicenciaController.cs
  - PosWeb/Controllers/ClientesController.cs
  - PosWeb/Controllers/EmpresaController.cs
Template: business-rule-v1
Created: 2026-10-08
Updated: 2026-10-08
Tags:
  - Auth
  - Ventas
  - Caja
```

---

## Overview

La información comercial **de gestión** —el resumen analítico del negocio (dashboard de inicio: KPIs de ventas, comparaciones, tendencias, facturación)— es sensible y queda reservada a `SuperAdmin`/`Admin`. 

Esto **no** significa que un `UsuarioComun` no pueda ver cifras comerciales. Los flujos operativos que debe ejecutar (registrar ventas, cobrar, abrir/cerrar caja, arqueo) exponen legítimamente la información necesaria para completar la operación, incluidos totales de ventas y desglose de pagos. El criterio que decide el acceso es el **propósito** (gestión analítica vs. operación), no el tipo de dato.

---

## Rules

1. **La vista analítica de gestión es sensible y admin-only.** El dashboard de inicio (`DashboardPage`) muestra el panorama comercial del negocio (KPIs, tendencias, comparaciones, facturación). Solo `SuperAdmin`/`Admin` acceden a él.

2. **Los flujos operativos exponen por necesidad.** El cierre de caja, el arqueo, el cobro y el registro de ventas muestran al operador los totales, el desglose de pagos, los gastos y la ganancia del turno. Esto **no** viola la regla: el `UsuarioComun` necesita esa información para ejecutar la operación. `CajaPage` es accesible a todos los roles.

3. **El criterio es el propósito, no el dato.** Un mismo dato (ej. ventas del día) puede ser legítimo en un contexto operativo (cierre de caja) y restringido en uno de gestión (dashboard). Por lo tanto la restricción se define por **pantalla/flujo y consumidor**, nunca por tipo de dato aislado.

4. **El home diferenciado por rol es deliberado.** La ruta `/` decide entre el dashboard (admins) y el placeholder `InicioPage` (resto de roles). Un dashboard de inicio para no-admin se evaluó y **descartó** (ver `PKS_PROPOSALS.md`): sería una vista de gestión que expondría KPIs comerciales a roles operativos.

5. **La restricción se aplica en dos capas independientes.** La capa de presentación (frontend) no debe mostrar el acceso, y la capa de datos (API) debe rechazar la lectura aunque la UI sea evadida. Ocultar en la UI no es suficiente para las vistas de gestión.

6. **Enforcement en dos capas (implementado).** La restricción se aplica tanto en la UI (`App.tsx` decide dashboard vs. `InicioPage`) como en la capa de datos: `DashboardController` exige `Roles.SuperAdmin`/`Roles.Admin`. Los controllers operativos (`CajasController`, `VentasController`) permanecen accesibles a todos los roles autenticados, porque son flujos de operación. La restricción se define por pantalla/consumidor, nunca restringiendo el dato en sí.

---

## Relations

```yaml
RELATIONS:
  - type: RELATED
    target: MODEL-AnalyticsQuery
  - type: RELATED
    target: PAT-AnalyticsFramework
  - type: RELATED
    target: PAT-DashboardBuilder
  - type: RELATED
    target: SERVICE-restaurante
```
