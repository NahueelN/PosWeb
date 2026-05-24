# Spec: Historial de Ventas

## 1. Requirements

### R1 — Listar Ventas (Backend)

`GET /api/ventas` MUST return paginated sales matching provided filters. Each item MUST include: `ventaId`, `fecha`, `sucursalNombre`, `total`, `cantidadItems`.

### R2 — Detalle de Venta (Backend)

`GET /api/ventas/{id}` MUST return full sale detail with line items. Each item MUST include: `productoId`, `productoNombre`, `codigoBarra`, `cantidad`, `precioUnitario`, `subtotal`.

### R3 — Filtros (Backend)

The system MUST support optional query params: `fechaDesde`, `fechaHasta`, `sucursalId`, `page`, `pageSize`. Default: last 30 days, page=1, pageSize=20. Invalid date ranges (`fechaDesde > fechaHasta`) MUST return 400.

### R4 — Paginación (Backend)

Response MUST include `totalCount`, `page`, `pageSize` for pagination controls. `page` MUST be 1-based. Requests with `page` beyond the last valid page MUST return `items: []` with the correct `totalCount`.

### R5 — Página /historial (Frontend)

The system MUST render a table with columns: N° Venta | Fecha | Sucursal | Items | Total. Rows MUST be expandable to show line items. A filter bar at the top MUST include date range inputs, sucursal dropdown, and a Buscar button. Pagination controls MUST appear below the table.

### R6 — Estados de UI (Frontend)

The page MUST handle loading (spinner), empty (no-results message), and error (red banner) states following the existing `StockPage` pattern.

## 2. Scenarios

| ID | Req | Type | Given | When | Then |
|----|-----|------|-------|------|------|
| S1 | R1 | Happy | Sales exist in date range | `GET /api/ventas?fechaDesde=2026-05-01&fechaHasta=2026-05-22` | 200 with paginated list, each item has ventaId/fecha/sucursalNombre/total/cantidadItems |
| S2 | R1 | Empty | No sales match filters | `GET /api/ventas?fechaDesde=2020-01-01&fechaHasta=2020-01-02` | 200, items: [], totalCount: 0 |
| S3 | R3 | Error | fechaDesde after fechaHasta | `GET /api/ventas?fechaDesde=2026-06-01&fechaHasta=2026-05-01` | 400 with error message indicating invalid range |
| S4 | R3 | Error | sucursalId does not exist | `GET /api/ventas?sucursalId=99999` | 400 with error message indicating invalid sucursal |
| S5 | R4 | Edge | page beyond total pages | `GET /api/ventas?page=999&pageSize=20` when 5 total records | 200, items: [], totalCount: 5, page: 999 |
| S6 | R2 | Happy | Venta exists with 3 line items | `GET /api/ventas/42` | 200 with items array of 3 entries, each with productoId/productoNombre/codigoBarra/cantidad/precioUnitario/subtotal |
| S7 | R2 | Error | Venta does not exist | `GET /api/ventas/99999` | 404 with error message |
| S8 | R5 | Happy | Page loads, sales data returned | Navigate to /historial | Table renders with columns, first page of data shown |
| S9 | R5 | Happy | User expands a row | Click expand icon on a sale row | Line items table slides in below the row |
| S10 | R6 | UI | Loading state | Initial data fetch in progress | Spinner centered, table hidden |
| S11 | R6 | UI | Error state | API returns error | Red banner with error message, retry option |
| S12 | R6 | UI | Empty state | API returns empty list | "No se encontraron ventas" message |

## 3. API Contracts

### GET /api/ventas — Listar Ventas

**Request:**
```
GET /api/ventas?fechaDesde=2026-05-01&fechaHasta=2026-05-22&sucursalId=1&page=1&pageSize=20
```

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| fechaDesde | string (date) | No | Hoy - 30 days | Filter: fecha >= |
| fechaHasta | string (date) | No | Today | Filter: fecha <= |
| sucursalId | int | No | — | Filter by sucursal |
| page | int | No | 1 | Page number (1-based) |
| pageSize | int | No | 20 | Items per page |

**Response 200:**
```json
{
  "items": [
    {
      "ventaId": 42,
      "fecha": "2026-05-22T10:30:00",
      "sucursalNombre": "Sucursal Centro",
      "total": 1250.00,
      "cantidadItems": 5
    }
  ],
  "totalCount": 150,
  "page": 1,
  "pageSize": 20
}
```

**Response 400:**
```json
{ "error": "fechaDesde no puede ser posterior a fechaHasta" }
```

### GET /api/ventas/{id} — Detalle de Venta

**Response 200:**
```json
{
  "ventaId": 42,
  "fecha": "2026-05-22T10:30:00",
  "sucursalId": 1,
  "sucursalNombre": "Sucursal Centro",
  "total": 1250.00,
  "items": [
    {
      "productoId": 7,
      "productoNombre": "Coca-Cola 500ml",
      "codigoBarra": "7791234567890",
      "cantidad": 2,
      "precioUnitario": 250.00,
      "subtotal": 500.00
    }
  ]
}
```

**Response 404:**
```json
{ "error": "Venta no encontrada" }
```

## 4. Frontend Spec

### Route
`/historial` — new route in `<Layout>` outlet, added to `App.tsx`.

### Nav Link
Add to `Layout.tsx` link list: `{ to: '/historial', label: 'Historial', icon: '📋' }` (between Ventas and Productos).

### Component: `HistorialPage`

States (same pattern as `StockPage`):

| State | Behavior |
|-------|----------|
| **Loading** | Spinner + "Cargando historial…" |
| **Error** | Red banner with message + retry button |
| **Empty** | SVG icon + "No se encontraron ventas" message |
| **Success** | Table + pagination |
| **Row expanded** | Nested detail table below the parent row |

### Filter Bar (top)

```
[Fecha desde: ___ date input] [Fecha hasta: ___ date input] [Sucursal: ▼ dropdown] [🔍 Buscar]
```

- Date inputs: native `<input type="date">`
- Sucursal dropdown: populated from `api.sucursales.listar()`, with "Todas" default option
- Buscar button triggers filtered fetch (page resets to 1)
- Initial load: last 30 days, todas las sucursales

### Table

| Col | Header | Data |
|-----|--------|------|
| 1 | N° Venta | `row.ventaId` (monospace, gray) |
| 2 | Fecha | `new Date(row.fecha).toLocaleString('es-AR')` |
| 3 | Sucursal | `row.sucursalNombre` |
| 4 | Items | `row.cantidadItems` items |
| 5 | Total | `$ row.total.toFixed(2)` (bold, right-aligned) |
| — | Expand | Chevron icon, rotates on expand |

### Expanded Row Detail

- Row expands inline below the parent (single expanded at a time, or independent — TBD design)
- Nested table with columns: Código Barra | Producto | Cantidad | Precio Unit. | Subtotal
- Items come from `GET /api/ventas/{id}` (lazy-loaded on expand)
- Loading spinner in expanded area while fetching

### Pagination (below table)

```
[← Anterior] Página X de Y [Siguiente →]
```

- Anterior disabled on page 1
- Siguiente disabled when page >= totalPages
- totalPages = Math.ceil(totalCount / pageSize)

### Error Scenarios (UI)

| Scenario | Handling |
|----------|----------|
| Invalid date range (client-side) | Disable Buscar, show inline validation |
| API 400 (server-side) | Show error banner with server message |
| API 500 / network | Show error banner with "Error de conexión" + retry button |

## 5. Delta — Venta Spec (Modified Domain)

### ADDED Requirements

#### Requirement: Query Sales

The `VentaService` MUST expose read queries (`listar`, `obtenerPorId`) in addition to the existing creation capability. Reads MUST use manual joins with `VENTAS`, `RENGLONES_VENTA`, `SUCURSALES`, and `PRODUCTOS` tables — no navigation properties added to domain entities.

#### Scenario: List with date range

- GIVEN sales exist in the system within a date range
- WHEN `VentaService.Listar(fechaDesde, fechaHasta, sucursalId, page, pageSize)` is called
- THEN a paginated result is returned with sale summaries sorted by fecha descending

#### Scenario: Detail fetches line items

- GIVEN a venta with 3 renglones exists
- WHEN `VentaService.ObtenerPorId(ventaId)` is called
- THEN the returned detail includes 3 items with product name, barcode, quantity, unit price, subtotal
