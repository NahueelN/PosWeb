---
id: DS-DashboardLayout
status: Active
tags: [analytics, dashboard, layout, design-system, ui]
created: 2026-07-08
---

# DS-DashboardLayout

## Concepto

Sistema de layout que define cómo se posicionan y dimensionan los Widgets en un Dashboard. Es un consumer del framework, no el framework mismo.

## Responsabilidades

- Definir el grid sistema (columnas, filas, gaps)
- Manejar posicionamiento de widgets (x, y, width, height)
- Soportar responsive design (desktop, tablet, mobile)
- Persistir configuración de layout por usuario
- Soportar interacciones (drag & drop, resize)

## Propiedades del Layout

```typescript
interface DashboardLayout {
  id: string;                    // ID único del layout
  name: string;                  // Nombre legible
  grid: GridConfig;              // Configuración del grid
  widgets: WidgetPosition[];     // Posiciones de widgets
  responsive?: ResponsiveConfig; // Config responsive
  metadata?: LayoutMetadata;     // Info adicional
}

interface GridConfig {
  columns: number;               // Cantidad de columnas (ej: 12)
  rows: number;                  // Cantidad de filas (ej: 8)
  rowHeight: number;             // Alto de cada fila (px)
  gap: number;                   // Espacio entre widgets (px)
  containerWidth?: number;       // Ancho del contenedor (px)
}

interface WidgetPosition {
  widgetId: string;              // ID del widget
  x: number;                     // Posición X (columna)
  y: number;                     // Posición Y (fila)
  width: number;                 // Ancho (en columnas)
  height: number;                // Alto (en filas)
  minSize?: { width: number; height: number };  // Tamaño mínimo
  maxSize?: { width: number; height: number };  // Tamaño máximo
}

interface ResponsiveConfig {
  breakpoints: {
    mobile: number;              // Ancho máximo para mobile
    tablet: number;              // Ancho máximo para tablet
    desktop: number;             // Ancho máximo para desktop
  };
  layoutOverrides: {
    mobile?: Partial<DashboardLayout>;   // Layout custom para mobile
    tablet?: Partial<DashboardLayout>;   // Layout custom para tablet
  };
}

interface LayoutMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;             // Usuario que creó
  isDefault: boolean;            // Si es el layout por defecto
  isShared: boolean;             // Si es compartido entre usuarios
}
```

## Ejemplo de Layout

```typescript
const dashboardLayout: DashboardLayout = {
  id: 'layout-dashboard-001',
  name: 'Dashboard Principal',
  grid: {
    columns: 12,
    rows: 8,
    rowHeight: 80,
    gap: 16
  },
  widgets: [
    { widgetId: 'widget-ventas-diarias', x: 0, y: 0, width: 3, height: 2 },
    { widgetId: 'widget-top-productos', x: 3, y: 0, width: 6, height: 4 },
    { widgetId: 'widget-alertas', x: 9, y: 0, width: 3, height: 2 },
    { widgetId: 'widget-stock-critico', x: 0, y: 2, width: 3, height: 2 },
    { widgetId: 'widget-actividad', x: 9, y: 2, width: 3, height: 2 }
  ],
  responsive: {
    breakpoints: { mobile: 640, tablet: 1024, desktop: 1280 },
    layoutOverrides: {
      mobile: {
        grid: { columns: 1, rows: 10, rowHeight: 120, gap: 8 },
        widgets: [
          { widgetId: 'widget-ventas-diarias', x: 0, y: 0, width: 1, height: 1 },
          { widgetId: 'widget-top-productos', x: 0, y: 1, width: 1, height: 2 },
          { widgetId: 'widget-alertas', x: 0, y: 3, width: 1, height: 1 }
        ]
      }
    }
  },
  metadata: {
    createdAt: new Date('2026-07-08'),
    updatedAt: new Date('2026-07-08'),
    createdBy: 'admin',
    isDefault: true,
    isShared: false
  }
};
```

## Grid System

### Desktop (12 columnas)
```
┌────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬────┐
│ W1 │ W1 │ W1 │ W2 │ W2 │ W2 │ W2 │ W2 │ W2 │ W3 │ W3 │ W3 │
│    │    │    │    │    │    │    │    │    │    │    │    │
├────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┼────┤
│ W4 │ W4 │ W4 │ W5 │ W5 │ W5 │ W5 │ W5 │ W5 │ W6 │ W6 │ W6 │
│    │    │    │    │    │    │    │    │    │    │    │    │
└────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┴────┘
```

### Mobile (1 columna)
```
┌────────────────────┐
│        W1          │
├────────────────────┤
│        W2          │
├────────────────────┤
│        W3          │
├────────────────────┤
│        W4          │
└────────────────────┘
```

## Interacciones

| Interacción | Desktop | Mobile | Descripción |
|-------------|---------|--------|-------------|
| Drag & Drop | ✅ | ❌ | Mover widgets en el grid |
| Resize | ✅ | ❌ | Cambiar tamaño de widgets |
| Add Widget | ✅ | ✅ | Agregar nuevo widget |
| Remove Widget | ✅ | �️ | Quitar widget del layout |
| Config Widget | ✅ | ✅ | Abrir panel de configuración |
| Fullscreen | ✅ | ✅ | Expandir widget a pantalla completa |

## Persistencia

```typescript
interface LayoutStorage {
  save(layout: DashboardLayout): Promise<void>;
  load(id: string): Promise<DashboardLayout>;
  list(userId: string): Promise<DashboardLayout[]>;
  delete(id: string): Promise<void>;
  clone(id: string, name: string): Promise<DashboardLayout>;
}
```

Opciones de persistencia:
- **Backend**: API REST (requiere auth, soporta sharing)
- **Local**: localStorage (rápido, sin sharing)
- **IndexedDB**: Para layouts complejos con muchos widgets

## Boundary: DashboardLayout vs. Widget

- **DashboardLayout** define POSICIÓN y TAMAÑO de widgets
- **Widget** define CONTENIDO y COMPORTAMIENTO

```
DashboardLayout: "Widget X está en posición (2,3) con tamaño (3,2)"
Widget: "Widget X muestra ventas diarias con gráfico de barras"
```

## Boundary: DashboardLayout vs. CSS Grid

- **DashboardLayout** es una abstracción de dominio (widgets, positions, responsive)
- **CSS Grid** es la implementación técnica (grid-template-columns, grid-gap)

```
DashboardLayout: 12 columnas, 8 filas, gap 16px
CSS Grid: grid-template-columns: repeat(12, 1fr); grid-gap: 16px;
```

## Decisiones de diseño

1. **Layout es una abstracción de dominio**: no depende de CSS ni de UI framework
2. **Layout es responsive**: breakpoints configurables por dispositivo
3. **Layout es persistible**: se puede guardar, cargar, clonar
4. **Layout es compartible**: múltiples usuarios pueden tener el mismo layout
5. **Layout es interactivo**: drag & drop, resize en desktop
