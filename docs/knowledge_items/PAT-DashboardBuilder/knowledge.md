---
id: PAT-DashboardBuilder
status: Active
tags: [analytics, dashboard, widget, architecture, platform, visualization, builder]
created: 2026-07-17
---

# PAT-DashboardBuilder

## Concepto

El Dashboard es un **Dashboard Builder** — una plataforma donde el usuario construye su propio dashboard sin código. El Dashboard solo conoce **instancias de Widgets**, nunca sabe qué datos hay detrás.

## Cadena arquitectónica

```
AnalyticsQuery  →  Dataset  →  WidgetDefinition  →  WidgetInstance  →  Dashboard
```

- **AnalyticsQuery**: Produce datos. No conoce la UI.
- **Dataset**: Contrato universal de datos (`columns + rows + summary`).
- **WidgetDefinition**: Describe una fuente de datos y qué visualizaciones son compatibles.
- **WidgetInstance**: Un widget colocado en el dashboard por el usuario.
- **Dashboard**: Grid que renderiza WidgetInstances.

## Modelo de datos

### WidgetDefinition

Describe una fuente de datos disponible. El Dashboard nunca conoce "Ventas" o "Productos" — solo conoce WidgetDefinitions.

```json
{
  "id": "ventas-por-dia",
  "name": "Ventas por día",
  "description": "Evolución de ventas de los últimos días",
  "category": "charts",
  "icon": "BarChart3",
  "compatibleTypes": [
    { "type": "BAR_CHART", "label": "Barras", "icon": "BarChart3", "params": [...] },
    { "type": "LINE_CHART", "label": "Líneas", "icon": "TrendingUp", "params": [...] },
    { "type": "TABLE", "label": "Tabla", "icon": "Table", "params": [...] }
  ]
}
```

### WidgetInstance

Un widget colocado en el dashboard. Contiene:
- Referencia a la WidgetDefinition (fuente de datos)
- Tipo de visualización elegida
- Configuración del usuario (período, límite, color, etc.)
- Posición en el grid
- Orden de visualización

```json
{
  "id": "ventas-semana-1679000000",
  "definitionId": "ventas-semana",
  "widgetType": "BAR_CHART",
  "title": "Ventas de la Semana",
  "config": { "period": "7" },
  "col": 0, "row": 0, "width": 1, "height": 1,
  "order": 10
}
```

### WidgetDefinitionParam

Cada WidgetVisualizationType puede tener parámetros configurables:

```json
{
  "key": "period",
  "label": "Período",
  "type": "select",
  "default": "7",
  "options": [
    { "value": "7", "label": "Últimos 7 días" },
    { "value": "14", "label": "Últimos 14 días" }
  ]
}
```

## Flujo del usuario

### Agregar Widget

1. **Elegir información** — Usuario ve todas las WidgetDefinitions agrupadas por categoría
2. **Elegir visualización** — Solo se muestran las compatibles con la fuente elegida
3. **Configurar** — Título, período, límite, color, etc.
4. **Guardar** — La instancia se persiste en localStorage y aparece en el dashboard

### Ejemplo: "Ventas por categoría"

```
Paso 1: El usuario elige "Ventas por categoría" del picker
Paso 2: Ve las visualizaciones compatibles:
         ○ Pie Chart (circular)
         ○ Barras
         ○ Tabla
Paso 3: Elige "Pie Chart", configura donut=true, showPercentages=true
Paso 4: Guarda → WidgetInstance creada → dashboard la renderiza
```

### Ejemplo: "Top Productos"

```
Paso 1: El usuario elige "Productos más vendidos"
Paso 2: Ve: ○ Tabla ○ Barras ○ Pie Chart
Paso 3: Elige "Tabla", configura limit=5
Paso 4: Guarda → aparece en el dashboard
```

## Backend

### WidgetDefinitionRegistry

Catálogo estático de todas las fuentes de datos disponibles. Contiene:
- Metadata de cada fuente (id, name, description, category, icon)
- Lista de visualizaciones compatibles con sus parámetros

### DashboardBuilderService

Servicio principal que:
1. Recibe las WidgetInstances del usuario
2. Para cada instancia, ejecuta la AnalyticsQuery correspondiente
3. Crea el Widget con el tipo de visualización elegido
4. Aplica la configuración del usuario
5. Devuelve `DashboardResponse { definitions, widgets }`

### Endpoint

```
POST /api/dashboard/build?sucursalId=1
Body: [ { definitionId, widgetType, config, ... }, ... ]
Response: { definitions: [...], widgets: [...] }
```

## Frontend

### Persistencia

Las WidgetInstances se guardan en **localStorage** (key: `dashboard-instances`).
No hay persistencia en base de datos todavía.

### Componentes

- **WidgetPicker**: Dialog de 4 pasos (elegir info → elegir viz → configurar → confirmar)
- **DashboardPage**: Grid que renderiza WidgetInstances usando WidgetRenderer
- **WidgetRenderer**: Routing por tipo (KPI → KpiWidget, PIE_CHART → PieChartWidget, etc.)
- **widgetInstances.ts**: CRUD de instancias en localStorage

### API Client

```typescript
// Build dashboard with user instances
api.dashboard.build(sucursalId, instances)

// Get definitions only (for picker)
api.dashboard.definitions()
```

## Regla fundamental

**El Dashboard nunca debe conocer:**
- ~~Ventas~~
- ~~Productos~~
- ~~Clientes~~
- ~~Ninguna entidad de negocio~~

**Solo conoce WidgetInstances.**

**Las AnalyticsQuery tampoco conocen Widgets.**
Solo producen Datasets.

## Diagrama de dependencias

```
PAT-DashboardBuilder
├── PAT-AnalyticsFramework   (framework general)
├── PAT-WidgetPlatform       (tipos de visualización)
├── COMP-Widget              (componentes de renderizado)
├── MODEL-Dataset            (contrato universal de datos)
├── MODEL-WidgetDefinition   (catálogo de fuentes)
├── MODEL-WidgetInstance     (instancia en el dashboard)
└── DS-DashboardLayout       (organización de widgets)
```

## Lo que esto habilita (futuro)

- Dashboard por usuario (guardar instancias en BD)
- Drag & Drop avanzado (reordenar, redimensionar)
- Dashboard compartido (exportar/importar instancias)
- Widgets dinámicos (agregar nuevas fuentes sin tocar el Dashboard)
- API de terceros (consumir el mismo catálogo de definiciones)

## Estado de implementación

- ✅ WidgetDefinitionRegistry (catálogo de 10 fuentes)
- ✅ DashboardBuilderService (ejecuta queries por instancia)
- ✅ WidgetInstances en localStorage
- ✅ WidgetPicker (flujo de 4 pasos)
- ✅ DashboardPage consume instancias
- ✅ CRUD de instancias (agregar, eliminar, reordenar)
- 🔲 Persistencia en base de datos
- 🔲 Dashboard por usuario
- 🔲 Drag & Drop avanzado (resize)
- 🔲 Editor visual completo
- 🔲 Import/Export de configuración
