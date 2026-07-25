---
id: PAT-AnalyticsFramework
status: Active
tags: [analytics, dashboard, architecture, framework, patterns]
created: 2026-07-08
---

# PAT-AnalyticsFramework

## Concepto

Framework arquitectónico que establece Analytics como dominio de primer clase en el sistema. Define el flujo de datos completo y las responsabilidades de cada capa, permitiendo que múltiples consumers (Dashboard, Reportes, API, Mobile, IA) reutilicen la misma infraestructura.

## Responsabilidades

- Definir el flujo de datos: `Query → Dataset → Visualization → Widget → Consumer`
- Establecer boundaries claros entre capas de datos, presentación y composición
- Proveer cache strategy para queries frecuentes
- Soportar consumers actuales y futuros sin acoplamiento

## Componentes del Framework

| Componente | PKS ID | Tipo | Responsabilidad principal |
|------------|--------|------|---------------------------|
| Query | MODEL-AnalyticsQuery | MODEL | Definir fuente de datos |
| Dataset | MODEL-Dataset | MODEL | Resultado normalizado y cacheable |
| Visualization | COMP-Widget | COMP | Cómo se representan los datos |
| Widget | COMP-Widget | COMP | Composición de Query + Viz + Config |
| Dashboard | DS-DashboardLayout | DS | Layout de Widgets |
| Report | - | Service | Exportación de Widgets a PDF/Excel |
| Insight | MODEL-Insight | MODEL | Conclusiones generadas |

## Flujo de Datos

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAT-AnalyticsFramework                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐                                               │
│  │    Query     │  "Qué datos necesito"                        │
│  │ (Analytics   │  - Parámetros: fecha, filtros, agrupación    │
│  │    Query)    │  - Execute: produce Dataset                   │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │   Dataset    │  "Resultado normalizado"                      │
│  │ (Model)      │  - columns + rows (tabular)                   │
│  │              │  - Cacheable (query + params = dataset)        │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │ Visualization│  "Cómo se muestra"                            │
│  │ (Component)  │  - chart, table, number, list, card, map      │
│  │              │  - Recibe Dataset, produce ReactNode           │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │   Widget     │  "Unidad de composición"                      │
│  │ (Component)  │  - Query + Visualization + Config             │
│  │              │  - Reutilizable en múltiples contexts          │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ├──────────────────┬──────────────────┐                  │
│         ▼                  ▼                  ▼                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Dashboard   │  │    Report    │  │  API/Mobile  │          │
│  │ (Layout)     │  │ (Service)    │  │ (Service)    │          │
│  │              │  │              │  │              │          │
│  │ Grid de      │  │ PDF, Excel,  │  │ REST,        │          │
│  │ Widgets      │  │ Impresión    │  │ WebSocket    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌──────────────┐                                               │
│  │   Insight    │  "Conclusiones de los datos"                  │
│  │ (Model)      │  - Trend, Anomaly, Comparison, Prediction     │
│  │              │  - Generado por AI/ML o reglas manuales        │
│  └──────────────┘                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Beneficios de este enfoque

### 1. Reutilización de Queries
```typescript
// Misma query, múltiples consumers
const ventasQuery = { id: 'ventas-diarias', execute: ... };

// Dashboard la usa
const dashboard = [ventasWidget];

// Report la misma query
const report = [ventasWidget, ...];

// API expone el mismo dato
app.get('/api/analytics/ventas', (req, res) => res.json(ventasQuery.execute(req.params)));
```

### 2. Cache Strategy
```typescript
// Dataset se cachea automáticamente
const dataset = await cache.getOrExecute(ventasQuery, params);
// Segunda llamada: cache hit, 0ms
```

### 3. Cambio de Visualización sin tocar datos
```typescript
// Hoy: gráfico de barras
const barWidget = { query: ventasQuery, visualization: barChart };

// Mañana: gráfico de torta (mismo query)
const pieWidget = { query: ventasQuery, visualization: pieChart };

// Datos idénticos, presentación diferente
```

### 4. Consumers futuros sin cambios
```typescript
// Nuevo consumer: Mobile App
const mobileWidget = { query: ventasQuery, visualization: mobileChart };
// No se modifica el query, no se modifica el dataset
```

## Anti-patterns que previene

| Anti-pattern | Solución |
|--------------|----------|
| Lógica de analytics hardcodeada a Dashboard | Analytics es dominio independiente |
| Queries duplicadas en múltiples módulos | Query se define una vez, se reutiliza |
| Datos se re-ejecutan en cada render | Dataset es cacheable |
| Cambiar visualización requiere cambiar datos | Separación Query ↔ Visualization |
| Nuevo consumer requiere refactor completo | Consumers son solo más usuarios del framework |

## Diagrama de dependencias

```
PAT-AnalyticsFramework
├── MODEL-AnalyticsQuery    (define QUÉ datos)
├── MODEL-Dataset           (resultado normalizado)
├── MODEL-Insight           (conclusiones)
├── COMP-Widget             (composición Query+Viz+Config)
└── DS-DashboardLayout      (layout de Widgets)
```

## Implementación actual (pre-framework)

El sistema actual tiene queries hardcodeadas en `DashboardService`:
- `GetResumenDiarioAsync()` → Datos del día
- `GetTopProductosAsync()` → Top productos vendidos
- `GetAlertasAsync()` → Alertas de stock
- `GetCajaEstadoAsync()` → Estado de la caja

Estas queries existen pero NO están formalizadas como `AnalyticsQuery`.
El Dataset actual es un DTO (`DashboardDto`) que combina datos + metadata de UI.

**Gap identificado**: El framework permite que estas queries existan como entidades de primer clase, cacheables y reutilizables.

## Próximos pasos (cuando se implemente)

1. Formalizar queries existentes como `AnalyticsQuery`
2. Implementar cache layer para Datasets
3. Crear Visualization components reutilizables
4. Implementar Widget system
5. Migrar Dashboard a usar Widgets
6. Agregar consumers futuros (Reportes, API)
