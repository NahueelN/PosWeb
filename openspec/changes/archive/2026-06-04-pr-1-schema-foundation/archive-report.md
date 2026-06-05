# Archive Report: pr-1-schema-foundation

**Archived**: 2026-06-04
**Change**: pr-1-schema-foundation — backend schema foundation for the multi-PR migration
**Source**: `openspec/changes/pr-1-schema-foundation/` → `openspec/changes/archive/2026-06-04-pr-1-schema-foundation/`

---

## Change Summary

| Field | Value |
|-------|-------|
| **Proposal** | Establish the 21-table backend schema foundation, including new entities, renamed payment model, decimal stock quantities, and full `PosDbContext` remap |
| **Scope** | Backend domain + EF Core schema only; no controllers, APIs, or frontend behavior delivered in this PR |
| **Status** | ✅ Implemented, verified, and archived |

## Traceability

| Artifact | File Source | Engram ID |
|----------|-------------|-----------|
| Proposal | `openspec/changes/pr-1-schema-foundation/proposal.md` | #168 |
| Spec | `openspec/changes/pr-1-schema-foundation/spec.md` | #169 |
| Design | `openspec/changes/pr-1-schema-foundation/design.md` | #170 |
| Tasks | `openspec/changes/pr-1-schema-foundation/tasks.md` | #171 |
| Verify Report | `openspec/changes/pr-1-schema-foundation/verify-report.md` | #174 |

## Files Touched

| Action | File | Description |
|--------|------|-------------|
| **Create/Modify** | `PosWeb.Domain/*.cs` | Added new schema entities and reshaped legacy entities to the approved contract |
| **Modify** | `PosWeb/Data/PosDbContext.cs` | Registered 21 DbSets, composite stock key, decimal precision, relationships, and renamed payment mapping |
| **Create** | `PosWeb/Migrations/20260604214915_InitialCreate.cs` | Persisted the refreshed schema as the current EF Core migration baseline |
| **Modify** | `PosWeb.Application/`, `PosWeb.Contracts/`, `PosWeb.Domain.Test/`, `PosWeb.Application.Test/` | Applied compile-alignment fixes for renamed entities, decimal quantities, and removed global stock |
| **Create** | `openspec/specs/schema-foundation/spec.md` | Synced the durable backend schema contract into main OpenSpec specs |

## Verification Results

| Check | Result | Details |
|-------|--------|---------|
| Backend build | ✅ PASS | `dotnet build PosWeb.sln` passed with 0 errors, 0 warnings |
| Backend tests | ✅ PASS | `dotnet test PosWeb.sln --no-build` passed with 78 tests green |
| Final schema drifts | ✅ PASS | `Proveedor.NOMBRE`, `UnidadMedida` without `ACTIVO`, and non-nullable `Compra.ID_PROVEEDOR` all verified |
| File-store completeness | ✅ PASS | Restored missing `verify-report.md` to the change folder before archiving and normalized `tasks.md` to complete state |

## Specs Synced

| Domain | Action | Details |
|--------|--------|---------|
| `schema-foundation` | Created | Copied the refreshed full spec into the main OpenSpec source-of-truth because no prior main schema-foundation spec existed |

## Source of Truth

The following main spec now reflects the durable backend schema contract:
- `openspec/specs/schema-foundation/spec.md`

## Archive Contents

```text
openspec/changes/archive/2026-06-04-pr-1-schema-foundation/
├── archive-report.md
├── proposal.md
├── spec.md
├── design.md
├── tasks.md
└── verify-report.md
```

---

## SDD Cycle Complete

The `pr-1-schema-foundation` change has been planned, implemented, verified, synced into OpenSpec, and archived. The codebase is ready for the next slice that uses this schema foundation.
