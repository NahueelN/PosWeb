# ADR-db-hybrid — Dual-Contexte EF Core para operación offline-first

## Metadata

```yaml
ID: ADR-db-hybrid
Type: ADR
Name: Dual-Context EF Core Architecture for Offline-First Operation
Status: Draft
Priority: High
Level: Project
Sources:
  - PosWeb/Data/PosDbContext.cs
  - PosWeb/Data/PosDbContextModel.cs
  - PosWeb/Data/PosDbContextLocal.cs
  - PosWeb/Program.cs
  - PosWeb/appsettings.json
  - PosWeb/Migrations/Local/
Template: adr-v1
Created: 2026-07-08
Updated: 2026-07-08
Tags:
  - Offline
  - POS
  - Ventas
  - Compras
```

---

## Contexto

PosWeb opera en comercios físicos donde la conectividad a internet puede ser intermitente. El sistema debe funcionar sin conexión (offline-first) guardando datos localmente, con capacidad futura de sincronizar con un servidor remoto MySQL. No se puede depender de un servidor externo para operaciones críticas como ventas, apertura de caja o gestión de stock.

Inicialmente el proyecto usaba solo MySQL (Pomelo.EntityFrameworkCore.MySql). Migrar completamente a SQLite implicaba perder la capacidad de sincronización remota y borrar 22 migraciones existentes.

---

## Decisión

**Usar dos DbContexts independientes — `PosDbContext` (MySQL) y `PosDbContextLocal` (SQLite) — que comparten configuración de entidades a través de un partial class (`PosDbContextModel.cs`), con migraciones separadas por proveedor.**

Actualmente los servicios y controladores usan `PosDbContextLocal` (offline mode). El stack MySQL se preserva completo para el futuro modo híbrido con sincronización bidireccional.

---

## Alternativas consideradas

| Alternativa | Descarte |
|---|---|
| **Herencia de DbContext** (`PosDbContextLocal : PosDbContext`) | `base.OnModelCreating()` ejecuta la config MySQL (HasFilter, MaxIdentifierLength). No se puede deshacer desde la clase derivada. |
| **Fábrica de DbContext** con provider dinámico | Requiere que ambos providers estén en el mismo DbContext, lo cual fuerza un solo ModelSnapshot. SQLite falla con HasFilter. |
| **Migrar todo a SQLite y borrar MySQL** | Pérdida de toda la infraestructura de nube. Futuro modo híbrido requeriría reconstruir desde cero. |
| **Un solo DbContext con `#if` condicionales** | El ModelSnapshot queda acoplado a un solo provider. Las migraciones no pueden coexistir. |

---

## Consecuencias

### Qué habilita

- **Operación 100% offline.** Ventas, compras, caja, stock — todo funciona sin internet usando la DB SQLite local.
- **Migración a híbrido sin rework.** Cuando se implemente la sincronización, solo hay que inyectar el contexto correcto según conectividad. Cero cambios en entidades.
- **Dos juegos de migraciones independientes.** Cada provider puede evolucionar su schema por separado si fuera necesario.

### Qué limita

- **Las entidades deben ser compatibles con ambos providers.** Funcionalidades exclusivas de MySQL (filtered indexes, stored procedures) no pueden usarse en el schema compartido.
- **No hay herencia de código.** `PosDbContextLocal` es una clase separada que duplica los `DbSet<>`, pero comparte `ConfigureEntities()` y `SeedLocalData()`.

### Qué obliga

- **Al modificar entidades, se deben generar migraciones para ambos contextos.** Si no se actualiza uno, el ModeleSnapshot correspondiente queda inconsistente.
- **Cualquier índice con `HasFilter()` solo va en `PosDbContext`. Nunca en `ConfigureEntities()`.**

---

## Cuándo reconsiderar

- Cuando se implemente la sincronización bidireccional y surja la necesidad de un provider factory dinámico.
- Si EF Core en el futuro soporta múltiples providers en un solo DbContext con ModelSnapshots separados.
- Si SQLite resulta insuficiente para el volumen de datos local (cientos de MB) y se necesita una alternativa intermedia (LiteDB, Realm).

---

## Relaciones

```yaml
RELATIONS:
  - type: RELATED
    target: ADR-cart-host
```

---

## Historial

| Fecha | Cambio |
|---|---|
| 2026-07-08 | ADR created — dual-context architecture deployed with SQLite active |

(End of file - total 78 lines)
