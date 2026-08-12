# ADR-catalogo-productos — Shared Product Catalog on Cloudflare Worker + D1

## Metadata

```yaml
ID: ADR-catalogo-productos
Type: ADR
Name: Shared Product Catalog on Cloudflare Worker + D1
Status: Active
Priority: High
Level: Project
Sources:
  - catalogo-worker/src/index.ts
  - PosWeb/Application/Catalogo/CatalogoService.cs
  - PosWeb/Controllers/ProductosController.cs
  - PosWeb/Program.cs
  - PosWeb/appsettings.json
  - catalogo-worker/openapi.yaml
Template: adr-v1
Created: 2026-07-22
Updated: 2026-07-22
Tags:
  - Productos
  - Scanner
  - Networking
```

---

## Context

PosWeb resolves barcodes in two tiers: local SQLite database, then OpenFoodFacts. Products manually created by one business are invisible to other installations. Every new PosWeb instance starts with an empty product catalog and rediscovers the same products through OpenFoodFacts.

A third-party installation that already added "Coca-Cola 500ml" with price and markup has that knowledge trapped locally. The next installation scanning the same barcode gets OpenFoodFacts data (name, brand, volume) but not the product data that other PosWeb users already refined.

The licensing system (ADRs pending) already established a Cloudflare Worker + D1 architecture for centralized license management. The same stack can serve a shared product catalog.

---

## Decision

**The shared product catalog is implemented as a Cloudflare Worker with D1 (`catalogo-worker`), following the same architecture as `licensing-worker`. The PosWeb backend resolves barcodes in cascading order: local DB → catalog worker → OpenFoodFacts. Products created with a barcode are asynchronously uploaded to the catalog.**

The worker is stateless (Hono framework), the database is D1 with a single `productos` table indexed by barcode. The backend talks to the worker through a dedicated `CatalogoService` that follows the established proxy pattern (`OpenFoodFactsService`, `LicenciaService`).

---

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| **Extend OpenFoodFacts: push our data to OFF** | OFF's data model is rigid. We cannot add price/cost/margin fields. The ingestion pipeline is out of our control. |
| **Central .NET API hosted on a VPS** | Higher operational cost, requires server maintenance, no scale-to-zero. Worker + D1 has $0 base cost under free tier limits. |
| **Modify OpenFoodFactsService to also upload** | Mixes two responsibilities: read from a public API, write to our own catalog. Violates single responsibility. |
| **Database per tenant** | A global catalog with `contador_usos` creates network effects. The more installations use it, the richer the autocomplete for everyone. |
| **Extend the licensing-worker with product endpoints** | Violates worker responsibility. Licensing handles payments and subscriptions. The catalog is a separate domain. Keep workers focused. |

---

## Consequences

### What this enables

- **All PosWeb installations share product data.** A barcode scanned once by any user is available for autocomplete everywhere.
- **Network effect on data quality.** Popular products get refined descriptions, consistent brands, and accurate units through repeated updates.
- **OpenFoodFacts remains as safety net.** If a product is not in our catalog, OFF provides the initial seed data.
- **Anonymous usage tracking.** `contador_usos` reveals which products matter most across all installations.

### What this limits

- **The catalog is barcode-only.** Products without barcodes cannot be shared. This is intentional — barcodes are the natural shared identifier.
- **No price/cost/margin in the catalog.** These are business-specific and belong in the local database. The catalog provides product identity only.
- **Upload is fire-and-forget.** If the worker is unreachable, the product is saved locally but not shared. There is no retry queue. This is acceptable: the next lookup from another installation will still fall through to OFF.

### What this obliges

- **All future barcode resolution must go through the cascade.** Direct OpenFoodFacts calls bypassing the catalog break the network effect.
- **The `CatalogoService` must handle network failures gracefully.** The system must never crash or block because the worker is down.
- **The `Catalogo:Habilitado` flag stays in appsettings.** It allows disabling the catalog per installation without code changes.

---

## When to Revisit

This ADR should be reconsidered when:

- The catalog grows beyond D1's free tier (5M rows read/day, 100K rows written/day, 5GB storage). At current rates, this requires thousands of active installations.
- The global catalog creates data quality problems (duplicates, spam). A moderation layer may be needed.
- The upload pattern (`Task.Run` fire-and-forget) causes observable data loss. A proper outbox or retry queue would then be justified.
- A mobile-only deployment model (tablets without local backend) requires the catalog to also serve prices and stock, not just product identity.

---

## Relations

```yaml
RELATIONS:
  - type: RELATED
    target: SERVICE-catalogo
  - type: IMPLEMENTS
    target: "ProductosController.cs lookup cascade"
  - type: INSPIRED_BY
    target: "licensing-worker architecture"
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-07-22 | ADR created |
