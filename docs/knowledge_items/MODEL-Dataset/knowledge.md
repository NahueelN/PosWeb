---
id: MODEL-Dataset
status: Active
tags: [analytics, dataset, data, model]
created: 2026-07-08
---

# MODEL-Dataset

## Concepto

Resultado reutilizable de ejecutar un AnalyticsQuery. Es la representación normalizada de datos analytics que puede ser consumido por Visualizaciones, Reportes o APIs.

## Responsabilidades

- Normalizar datos de diferentes fuentes a un formato estándar
- Ser cacheable (mismo query + mismos params = mismo Dataset)
- Soportar transformaciones (filtrar, ordenar, agrupar) sin re-ejecutar query
- Ser serializable para exportación (PDF, Excel, JSON)

## Propiedades

```typescript
interface Dataset {
  id: string;                    // ID único del dataset
  queryId: string;               // Query que lo generó
  params: Record<string, any>;   // Params usados en la query
  columns: ColumnDef[];          // Definición de columnas
  rows: any[][];                 // Datos en formato tabular
  summary?: DataSummary;         // Resumen agregado (opcional)
  metadata: DatasetMetadata;     // Info de caché y timing
  transforms?: Transform[];      // Transformaciones aplicadas
}

interface ColumnDef {
  name: string;                  // Nombre de la columna
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage';
  label?: string;                // Nombre para UI (ej: 'Total Ventas')
  format?: string;               // Formato de display (ej: 'currency', 'date-short')
  sortable?: boolean;            // Si se puede ordenar
  filterable?: boolean;          // Si se puede filtrar
}

interface DataSummary {
  total?: number;                // Total general
  count?: number;                // Cantidad de registros
  average?: number;              // Promedio
  min?: number;                  // Mínimo
  max?: number;                  // Máximo
  growth?: number;               // Crecimiento vs período anterior
  custom?: Record<string, any>;  // Métricas custom
}

interface DatasetMetadata {
  createdAt: Date;               // Cuándo se creó
  expiresAt?: Date;              // Cuándo expira el cache
  executionTime?: number;        // Tiempo de ejecución (ms)
  source: 'cache' | 'fresh';     // Si viene de cache o es fresh
  recordCount: number;           // Cantidad de registros
}
```

## Transformaciones

```typescript
interface Transform {
  type: 'filter' | 'sort' | 'group' | 'aggregate' | 'limit' | 'select';
  params: Record<string, any>;
}
```

Ejemplo de pipeline de transformaciones:
```typescript
const transformed = dataset
  .filter(col => col.type === 'number')
  .sort('total', 'desc')
  .limit(10)
  .group('category');
```

## Ejemplo de Dataset

```typescript
const ventasDataset: Dataset = {
  id: 'ds-ventas-20260708',
  queryId: 'ventas-diarias',
  params: { fecha: '2026-07-08' },
  columns: [
    { name: 'producto', type: 'string', label: 'Producto' },
    { name: 'cantidad', type: 'number', label: 'Unidades', format: 'number' },
    { name: 'total', type: 'currency', label: 'Total Ventas', format: 'currency' }
  ],
  rows: [
    ['Café Americano', 45, 67500],
    ['Cappuccino', 32, 57600],
    ['Medialuna', 28, 16800]
  ],
  summary: {
    total: 141900,
    count: 105,
    average: 1351.43,
    growth: 12.5
  },
  metadata: {
    createdAt: new Date('2026-07-08T14:30:00'),
    expiresAt: new Date('2026-07-08T14:35:00'),
    executionTime: 45,
    source: 'fresh',
    recordCount: 105
  }
};
```

## Boundary: Dataset vs. DTO

- **Dataset** es un concepto del dominio Analytics (estructura normalizada, cacheable, transformable)
- **DTO** es un contrato de API (puede incluir campos de presentación, metadata de UI)

```
Dataset NO: Incluir estilos CSS, colores, iconos
Dataset SI: Incluir tipos, formatos, metadata de presentación
```

## Boundary: Dataset vs. Cache

- **Dataset** es el resultado de una query (puede estar en cache o no)
- **Cache** es la capa de almacenamiento (Redis, in-memory, localStorage)

```
Dataset: 'ventas-diarias' con params { fecha: '2026-07-08' }
Cache: { key: 'analytics:ventas-diarias:20260708', ttl: 300, value: {...} }
```

## Decisiones de diseño

1. **Dataset es tabular**: rows/columns, no objects (fácil de renderizar en tablas, charts, exportar)
2. **Dataset es inmutable**: una vez creado, no se modifica (se transforma o se crea uno nuevo)
3. **Dataset es cacheable**: mismo query + mismos params = mismo Dataset
4. **Dataset es serializable**: se puede exportar a PDF, Excel, JSON
5. **Dataset tiene metadata**: timing, source, recordCount para debugging y UX
