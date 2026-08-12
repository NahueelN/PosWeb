---
id: COMP-Widget
status: Active
tags: [analytics, widget, component, composition, ui]
created: 2026-07-08
---

# COMP-Widget

## Concepto

Componente UI reutilizable que une un AnalyticsQuery + Visualization + Configuración en una unidad visual coherente. Es el composition root del framework.

## Responsabilidades

- Componer datos (Query/Dataset) con presentación (Visualization)
- Mantener estado de configuración (filtros, período, orden)
- Ser reutilizable en múltiples contexts (Dashboard, Reportes, API)
- Soportar interacciones (drill-down, filter, refresh)

## Propiedades

```typescript
interface Widget {
  id: string;                    // ID único del widget
  name: string;                  // Nombre legible
  query: AnalyticsQuery;         // Fuente de datos
  visualization: Visualization;  // Cómo se renderiza
  config: WidgetConfig;          // Configuración actual
  metadata?: WidgetMetadata;     // Info adicional
}

interface WidgetConfig {
  period?: TimePeriod;           // Período de tiempo
  filters?: Filter[];            // Filtros activos
  sortBy?: string;               // Campo de ordenamiento
  sortOrder?: 'asc' | 'desc';   // Dirección del orden
  limit?: number;                // Límite de registros
  refreshInterval?: number;      // Auto-refresh (segundos)
  custom?: Record<string, any>;  // Config custom por tipo de widget
}

interface WidgetMetadata {
  description?: string;          // Descripción del widget
  icon?: string;                 // Icono para UI
  category?: string;             // Categoría (ventas, stock, operaciones)
  minWidth?: number;             // Ancho mínimo (en columnas)
  minHeight?: number;            // Alto mínimo (en filas)
  defaultSize?: { width: number; height: number };  // Tamaño por defecto
}

interface TimePeriod {
  type: 'relative' | 'absolute';
  value: string;                 // Ej: 'today', 'last-7-days', '2026-07-01/2026-07-08'
}

interface Filter {
  field: string;                 // Campo a filtrar
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'in';
  value: any;                    // Valor del filtro
}
```

## Tipos de Widget

| Tipo | Query | Visualization | Uso típico |
|------|-------|---------------|------------|
| KPI | Ventas del día | Number + Trend | KPIs principales |
| Chart | Ventas por producto | Bar/Pie/Line | Gráficos de distribución |
| Table | Inventario completo | DataGrid | Listas detalladas |
| List | Alertas activas | CardList | Alertas y notificaciones |
| Map | Ventas por ubicación | Map | Visualización geográfica |
| Insight | Análisis automático | InsightCard | Conclusiones AI/ML |

## Ejemplo de Widget

```typescript
const ventasDiariasWidget: Widget = {
  id: 'widget-ventas-diarias',
  name: 'Ventas Diarias',
  query: ventasDiariasQuery,  // Referencia al query definido
  visualization: {
    type: 'chart',
    chartType: 'bar',
    render: (dataset) => renderBarChart(dataset, {
      xAxis: 'producto',
      yAxis: 'total',
      colors: ['#4CAF50', '#2196F3', '#FF9800']
    })
  },
  config: {
    period: { type: 'relative', value: 'today' },
    sortBy: 'total',
    sortOrder: 'desc',
    limit: 10
  },
  metadata: {
    description: 'Top 10 productos vendidos hoy',
    icon: 'chart-bar',
    category: 'ventas',
    minWidth: 2,
    minHeight: 2,
    defaultSize: { width: 3, height: 2 }
  }
};
```

## Visualization Types

```typescript
interface Visualization {
  type: VisualizationType;
  render: (dataset: Dataset, config?: any) => React.ReactNode;
  config?: Record<string, any>;   // Config default de la visualización
}

type VisualizationType = 
  | 'chart'        // Gráficos (bar, line, pie, area)
  | 'table'        // Tabla de datos
  | 'number'       // Número grande con tendencia
  | 'list'         // Lista de items
  | 'card'         // Card con info resumida
  | 'map'          // Visualización geográfica
  | 'insight'      // Card de insight
  | 'custom';      // Visualización custom
```

## Boundary: Widget vs. Component

- **Widget** es una unidad de composición analytics (query + visualization + config)
- **Component** es un elemento UI genérico (botón, input, modal)

```
Widget: "Ventas Diarias" (tiene query, dataset, visualización)
Component: <Button />, <Input />, <Modal />
```

## Boundary: Widget vs. Dashboard Card

- **Widget** es reutilizable en múltiples contexts
- **Dashboard Card** es un widget posicionado en un layout específico

```
Widget: "Ventas Diarias" → se puede usar en Dashboard, Reporte, API
Dashboard Card: Widget + posición (x, y, width, height) en un layout
```

## Decisiones de diseño

1. **Widget es el composition root**: une datos + UI + config en una unidad
2. **Widget es reutilizable**: mismo widget, múltiples contexts
3. **Widget es configurable**: filtros, período, ordenamiento
4. **Widget es interactivo**: drill-down, filter, refresh
5. **Widget es serializable**: se puede exportar en reportes
