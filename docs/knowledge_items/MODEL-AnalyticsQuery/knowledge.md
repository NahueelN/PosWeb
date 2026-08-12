---
id: MODEL-AnalyticsQuery
status: Active
tags: [analytics, query, data-source, model]
created: 2026-07-08
---

# MODEL-AnalyticsQuery

## Concepto

Representa una fuente de datos analytics: una consulta parametrizable que produce un Dataset. Es el punto de entrada del flujo de datos.

## Responsabilidades

- Definir QUÉ datos se necesitan (no CÓMO se muestran)
- Ser parametrizable (fechas, filtros, agrupaciones)
- Producir un Dataset como resultado
- Ser reutilizable en múltiples contexts (Dashboard, Reports, API)

## Propiedades

```typescript
interface AnalyticsQuery {
  id: string;                    // Identificador único (ej: 'ventas-diarias')
  name: string;                  // Nombre legible (ej: 'Ventas Diarias')
  description?: string;          // Descripción opcional
  params: QueryParam[];          // Parámetros aceptados
  execute: (params: Record<string, any>) => Dataset;  // Función de ejecución
  cache?: CacheConfig;           // Configuración de cache (opcional)
  permissions?: string[];        // Permisos requeridos (opcional)
}
```

## Parámetros de Query

```typescript
interface QueryParam {
  name: string;                  // Nombre del parámetro
  type: 'string' | 'number' | 'date' | 'boolean' | 'enum';
  required: boolean;             // Si es obligatorio
  default?: any;                 // Valor por defecto
  options?: any[];               // Para type='enum': opciones disponibles
  description?: string;          // Descripción para UI
}
```

## Queries existentes en el sistema

| ID | Descripción | Params | Módulo actual |
|----|-------------|--------|---------------|
| `ventas-diarias` | Resumen de ventas del día | fecha | Dashboard |
| `top-productos` | Productos más vendidos | fecha, limit | Dashboard |
| `alertas-stock` | Productos con stock bajo | threshold | Dashboard |
| `caja-estado` | Estado de la caja del día | fecha | Dashboard |
| `productos-stock` | Inventario completo | categoría, search | Productos |

## Boundary: Query vs. Service

- **Query** es una abstracción de datos analytics (lectura, parametrizable, cacheable)
- **Service** es un caso de uso de negocio (escritura, validación, workflow)

```
Query NO: Crear producto, Procesar venta, Enviar email
Query SI: Leer ventas del día, Leer stock, Leer KPIs
```

## Cache Strategy

```typescript
interface CacheConfig {
  ttl: number;                   // Time-to-live en segundos
  strategy: 'session' | 'user' | 'global';  // Alcance del cache
  invalidateOn?: string[];       // Eventos que invalidan el cache
}
```

Ejemplo: `ventas-diarias` con `ttl: 300` (5 min), `strategy: 'session'`

## Ejemplo de definición

```typescript
const ventasDiariasQuery: AnalyticsQuery = {
  id: 'ventas-diarias',
  name: 'Ventas Diarias',
  description: 'Resumen de ventas del día actual',
  params: [
    { name: 'fecha', type: 'date', required: false, default: 'today' }
  ],
  execute: async (params) => {
    const fecha = params.fecha || new Date();
    const data = await api.get(`/analytics/ventas?fecha=${fecha}`);
    return {
      columns: ['producto', 'cantidad', 'total'],
      rows: data.items,
      summary: { total: data.total, count: data.count }
    };
  },
  cache: { ttl: 300, strategy: 'session' }
};
```

## Decisiones de diseño

1. **Query es declarativa**: describe QUÉ datos, no CÓMO obtenerlos
2. **Query es parametrizable**: misma query, distintos contextos
3. **Query produce Dataset**: separación clara entre definición y resultado
4. **Query es cacheable**: performance-first, no N+1 queries
5. **Query tiene permisos**: seguridad integrada en la capa de datos
