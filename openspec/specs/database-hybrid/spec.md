# Database Hybrid Architecture Spec

## Purpose

Arquitectura de doble base de datos: SQLite local (offline-first) + MySQL remoto (cloud). Ambos motores coexisten en el mismo proyecto con contextos separados y configuración de entidades compartida.

## Current State (2026-07-08)

**Active:** SQLite only (PosDbContextLocal). All services and controllers use it.
**Preserved:** MySQL (PosDbContext) — stack completo intacto, listo para reactivar.

## Architecture

```
┌─────────────────────────────────────────────┐
│                 Application                 │
│  (services/controllers use PosDbContextLocal)│
├─────────────────────────────────────────────┤
│          PosDbContextModel.cs                │
│    ConfigureEntities() + SeedLocalData()    │
│        (shared entity config, partial)       │
├──────────────────────┬──────────────────────┤
│   PosDbContextLocal  │    PosDbContext      │
│   (SQLite)           │    (MySQL)           │
│   ─────────────────  │    ────────────────  │
│   No HasFilter       │    7 HasFilter idx   │
│   UseSqlite()        │    UseMySql()        │
│   Migrations/Local/  │    Migrations/       │
│   posweb.db          │    Server=localhost  │
└──────────────────────┴──────────────────────┘
```

## Key Design Decisions

### Shared Entity Configuration
- `PosDbContextModel.cs` (partial): contains `ConfigureEntities(ModelBuilder)` with all entity configs and `SeedLocalData(ModelBuilder)`.
- Both contexts call `ConfigureEntities()`. Only MySQL adds `.HasFilter("ACTIVO = 1")` on 7 unique indexes.

### Why Separate DbContexts (not inheritance)
- EF Core model snapshots are per-DbContext type. MySQL and SQLite migrations must live in separate directories.
- Filtered indexes (`HasFilter`) are MySQL-specific — SQLite throws runtime error if present.
- `PosDbContextLocal` is a standalone `DbContext` (not inheriting from `PosDbContext`) to keep model snapshots completely independent.

### Connection Strings
| Key | Value |
|---|---|
| `DefaultConnection` | `Server=localhost;Database=posweb;User=root;Password=280590;` |
| `LocalConnection` | `Data Source=posweb.db` |

## Files

| File | Role |
|---|---|
| `Data/PosDbContext.cs` | MySQL context (partial). OnModelCreating calls ConfigureEntities + HasFilter + SeedLocalData |
| `Data/PosDbContextModel.cs` | Shared config (partial). ConfigureEntities(ModelBuilder) + SeedLocalData(ModelBuilder) |
| `Data/PosDbContextLocal.cs` | SQLite context. OnModelCreating calls ConfigureEntities + SeedLocalData only |
| `Migrations/` | 22 MySQL migration files (preserved, not active) |
| `Migrations/Local/` | 1 SQLite migration (InitialSqlite) + ModelSnapshot |
| `DesignTimeDbContextFactory.cs` | Currently creates PosDbContextLocal with SQLite for `dotnet ef` commands |

## Migrations

```bash
# SQLite (current)
dotnet ef migrations add <Name> --context PosDbContextLocal --output-dir Migrations/Local
dotnet ef database update --context PosDbContextLocal

# MySQL (future)
dotnet ef migrations add <Name> --context PosDbContext --output-dir Migrations
dotnet ef database update --context PosDbContext
```

## Future: Hybrid Sync

When ready to add online/offline sync:
1. Services check connectivity and switch between PosDbContext/PosDbContextLocal
2. Sync service pushes local changes → remote and pulls remote → local
3. Conflict resolution (last-write-wins by timestamp or manual)

## Requirements

### Requirement: Dual Context Registration

Program.cs DEBE registrar ambos contextos con sus respectivos providers.

#### Scenario: SQLite context resolves
- GIVEN PosDbContextLocal registrado con UseSqlite
- WHEN un service inyecta PosDbContextLocal
- THEN el contexto se conecta a posweb.db

#### Scenario: MySQL context resolves (when activated)
- GIVEN PosDbContext registrado con UseMySql
- WHEN un service inyecta PosDbContext
- THEN el contexto se conecta al servidor MySQL remoto

### Requirement: SQLite Has No Filtered Indexes

PosDbContextLocal.OnModelCreating NO DEBE llamar HasFilter().

#### Scenario: SQLite migration runs without error
- GIVEN migración SQLite inicial
- WHEN dotnet ef database update --context PosDbContextLocal
- THEN la DB se crea sin errores de filtered index

### Requirement: MySQL Keeps Filtered Indexes

PosDbContext.OnModelCreating DEBE aplicar HasFilter en los 7 índices únicos de código.

#### Scenario: MySQL migration preserves filters
- GIVEN migración MySQL
- WHEN SQL generado contiene `FILTER (WHERE ACTIVO = 1)`
- THEN índices únicos condicionales se crean correctamente
