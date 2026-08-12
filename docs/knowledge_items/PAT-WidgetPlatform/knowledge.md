---
id: PAT-WidgetPlatform
status: Active
tags: [analytics, dashboard, widget, architecture, platform, visualization]
created: 2026-07-17
---

# PAT-WidgetPlatform

## Concepto

El Dashboard es una **plataforma de Widgets genéricos**. Los Widgets representan **formas de visualizar un Dataset**, no entidades de negocio. Cualquier AnalyticsQuery puede alimentar cualquier Widget compatible, sin cambiar nada del Dashboard.

## Decisión arquitectónica

**El Dashboard es un orquestador de visualizaciones, no un modelo de negocio.**

- Un Widget no representa "Top Productos". Representa una **tabla** que puede mostrar cualquier Dataset con columnas adecuadas.
- Un Widget no representa "Ventas de la Semana". Representa un **bar chart** que puede graficar cualquier dataset con eje X categórico y eje Y numérico.
- El Dataset es el contrato universal: `columns + rows + summary`. Cualquier query que produzca un Dataset puede alimentar cualquier Widget compatible.

## Tipos de Widget

| Tipo | Descripción | Tamaño default | Dataset esperado |
|------|-------------|----------------|------------------|
| `KPI` | Indicador numérico con tendencia | 1×1 | 1 row, columns numéricas |
| `LINE_CHART` | Gráfico de líneas | 2×2 | Múltiples rows, eje X + Y |
| `BAR_CHART` | Gráfico de barras | 2×2 | Múltiples rows, eje X categórico + Y numérico |
| `PIE_CHART` | Gráfico circular/donut | 2×2 | Múltiples rows, label + value |
| `TABLE` | Tabla de datos | 2×2 | Múltiples rows, múltiples columns |
| `LIST` | Lista de items | 1×2 | Múltiples rows, columns de texto/fecha |
| `ALERTS` | Lista de alertas priorizadas | 1×2 | Rows con tipo/count |
| `PROGRESS` | Barra de progreso | 1×1 | 1 row, value + target |
| `GAUGE` | Indicador tipo velocímetro | 1×1 | 1 row, value + min + max |
| `HEATMAP` | Mapa de calor (preparado) | 2×2 | *No implementado aún* |

## Regla fundamental

```
AnalyticsQuery  →  Dataset  →  Widget(tipo)  →  Visualización
```

**Cualquier Query** que produzca un Dataset compatible puede alimentar **cualquier Widget** del tipo adecuado, sin modificar el Dashboard.

Ejemplo:
```
VentasPorCategoriaQuery → Dataset → PieChart Widget
VentasPorCategoriaQuery → Dataset → BarChart Widget
```

Mismo Dataset, misma Query. Distinto Widget. Sin cambios en el Dashboard.

## WidgetConfig

Cada tipo de Widget define su propia configuración visual:

```typescript
// Config común a todos
interface WidgetConfigBase {
  title?: string
  subtitle?: string
  icon?: string
  color?: string
  refreshInterval?: number  // Auto-refresh en segundos
}

// Config específica por tipo
interface LineChartConfig extends WidgetConfigBase {
  xAxis?: string      // Campo del eje X
  yAxis?: string      // Campo del eje Y
  showLegend?: boolean
  showDots?: boolean
  showLabels?: boolean
}

interface PieConfig extends WidgetConfigBase {
  showPercentages?: boolean
  donut?: boolean      // true = donut, false = pie completo
  showLegend?: boolean
}

interface TableConfig extends WidgetConfigBase {
  visibleColumns?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  pageSize?: number
}

interface ProgressConfig extends WidgetConfigBase {
  max?: number        // Valor máximo de la barra
  showLabel?: boolean
  format?: 'number' | 'currency' | 'percentage'
}
```

## Layout

Cada tipo de Widget conoce su tamaño recomendado. El Dashboard usa ese tamaño por defecto.

```
KPI → 1×1    (un indicador)
LINE_CHART → 2×2    (gráfico con espacio)
BAR_CHART → 2×2
PIE_CHART → 2×2
TABLE → 2×2    (tabla con columnas)
LIST → 1×2    (lista vertical)
ALERTS → 1×2
PROGRESS → 1×1    (barra compacta)
GAUGE → 1×1    (velocímetro compacto)
```

Más adelante se podrá modificar el tamaño por widget instance.

## Frontend: WidgetRenderer

El WidgetRenderer es el routing central:

```typescript
switch (widget.type) {
  case 'KPI':         return <KpiWidget ... />
  case 'LINE_CHART':  return <LineChartWidget ... />
  case 'BAR_CHART':   return <BarChartWidget ... />
  case 'PIE_CHART':   return <PieChartWidget ... />
  case 'TABLE':       return <TableWidget ... />
  case 'LIST':        return <ListWidget ... />
  case 'ALERTS':      return <AlertWidget ... />
  case 'PROGRESS':    return <ProgressWidget ... />
  case 'GAUGE':       return <GaugeWidget ... />
  case 'HEATMAP':     return <HeatmapPlaceholder ... />
}
```

**Nuevo Widget = agregar tipo al enum + crear componente + agregar case al switch.**
Zero cambios en el Dashboard.

## Backend: WidgetFactory

```csharp
_factory.CreateKpi(id, title, dataset, icon, color)
_factory.CreateBarChart(id, title, dataset, period)
_factory.CreateLineChart(id, title, dataset)
_factory.CreatePieChart(id, title, dataset)
_factory.CreateTable(id, title, dataset)
_factory.CreateList(id, title, dataset)
_factory.CreateAlerts(id, title, dataset)
_factory.CreateProgress(id, title, dataset)
_factory.CreateGauge(id, title, dataset)
```

**Nuevo Query = ejecutarlo, obtener Dataset, pasar a WidgetFactory.**
Zero cambios en el Dashboard.

## Objetivo final

Crear un Dashboard se reduce a:

1. Ejecutar una AnalyticsQuery
2. Obtener un Dataset
3. Elegir el tipo de Widget
4. Agregarlo al Dashboard

```csharp
// Backend: una línea por widget
var dataset = await new VentasPorCategoriaQuery().ExecuteAsync(sucursalId, db);
var widget = _factory.CreatePieChart("ventas-categoria", "Ventas por Categoría", dataset);
```

```typescript
// Frontend: zero cambios
// WidgetRenderer ya sabe renderizar PIE_CHART
```

## Lo que NO es un Widget

- ~~Una entidad de negocio (Venta, Producto, Cliente)~~
- ~~Un screen o página~~
- ~~Un servicio o API endpoint~~
- ~~Un DTO del backend~~

## Lo que SÍ es un Widget

- Una **forma de visualizar datos** (tabla, gráfico, indicador, lista)
- Una **unidad de composición** reutilizable
- Un **componente React** que recibe un Dataset y produce UI
- Un **tipo serializable** que el backend envía y el frontend renderiza

## Anti-patterns que previene

| Anti-pattern | Solución |
|--------------|----------|
| Dashboard hardcodea qué query va con qué visualización | Cualquier Query alimenta cualquier Widget |
| Nuevo tipo de gráfico requiere cambiar el Dashboard | Solo agregar componente + case en switch |
| Widgets atados a "Ventas" o "Productos" | Widgets son genéricos, Dataset es el contrato |
| Config visual hardcodeada en el componente | WidgetConfig permite configuración flexible |

## Diagrama de dependencias

```
PAT-WidgetPlatform
├── PAT-AnalyticsFramework   (framework general)
├── COMP-Widget              (componentes de visualización)
├── MODEL-Dataset            (contrato universal de datos)
├── MODEL-AnalyticsQuery     (fuentes de datos)
└── DS-DashboardLayout       (organización de widgets)
```

## Estado de implementación

- ✅ KPI, BAR_CHART, TABLE, LIST, ALERTS — implementados
- ✅ LINE_CHART — tipo definido, usa ChartWidget
- ✅ PIE_CHART — nuevo, implementado
- ✅ PROGRESS — nuevo, implementado
- ✅ GAUGE — nuevo, implementado
- 🔲 HEATMAP — tipo definido, placeholder pendiente
- 🔲 Drag & Drop — pendiente
- 🔲 Dashboard configurable por usuario — pendiente
- 🔲 Editor visual — pendiente
- 🔲 Persistencia del layout — pendiente
