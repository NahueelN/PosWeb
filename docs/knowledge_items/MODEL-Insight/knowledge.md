---
id: MODEL-Insight
status: Active
tags: [analytics, insight, ai, intelligence, model]
created: 2026-07-08
---

# MODEL-Insight

## Concepto

Conclusión, patrón o alerta generada a partir de la analítica de uno o más Datasets. Es un ciudadano de primer nivel del framework, no un add-on.

## Responsabilidades

- Representar hallazgos significativos en los datos
- Ser generados automáticamente (AI/ML) o manualmente (reglas de negocio)
- Tener un nivel de confianza (confidence)
- Ser consumibles por cualquier consumer (Dashboard, Reportes, API, Mobile)
- Tener un lifecycle (pendiente → aceptado → descartado)

## Tipos de Insight

| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| Trend | Patrón temporal ascendente/descendente | "Ventas subieron 15% esta semana" |
| Anomaly | Valor fuera de lo esperado | "Stock de café en 2 unidades" |
| Comparison | Comparación entre períodos | "Lunes vs Domingo: +40% ventas" |
| Threshold | Cruce de umbral configurado | "Caja abierta hace 8 horas" |
| Prediction | Predicción basada en historical | "Mañana se esperan 120 ventas" |
| Recommendation | Sugerencia de acción | "Reponer leche antes del martes" |

## Propiedades

```typescript
interface Insight {
  id: string;                    // ID único
  type: InsightType;             // Tipo de insight
  title: string;                 // Título legible (1 línea)
  description: string;           // Descripción detallada
  confidence: number;            // 0-1: qué tan seguro estamos
  source: InsightSource;         // De dónde viene el insight
  data: InsightData;             // Datos de soporte
  actions?: InsightAction[];     // Acciones sugeridas
  status: InsightStatus;         // Lifecycle del insight
  createdAt: Date;               // Cuándo se generó
  expiresAt?: Date;              // Cuándo expira (insights temporales)
}

type InsightType = 'trend' | 'anomaly' | 'comparison' | 'threshold' | 'prediction' | 'recommendation';
type InsightStatus = 'pending' | 'viewed' | 'accepted' | 'discarded';

interface InsightSource {
  queryIds: string[];            // Queries que contribuyeron
  datasetIds: string[];          // Datasets analizados
  algorithm?: string;            // Algoritmo usado (si es AI/ML)
  ruleId?: string;               // Regla de negocio (si es manual)
}

interface InsightData {
  metric?: string;               // Métrica analizada (ej: 'ventas')
  currentValue?: any;            // Valor actual
  previousValue?: any;           // Valor anterior
  change?: number;               // Cambio porcentual
  threshold?: any;               // Umbral configurado
  chart?: ChartData;             // Datos para visualización
}

interface InsightAction {
  type: 'navigate' | 'execute' | 'notify';
  label: string;                 // Texto del botón
  target?: string;               // URL o comando a ejecutar
  params?: Record<string, any>;  // Parámetros adicionales
}
```

## Ejemplo de Insight

```typescript
const stockAlert: Insight = {
  id: 'ins-stock-001',
  type: 'anomaly',
  title: 'Stock crítico: Café Americano',
  description: 'Solo quedan 2 unidades de Café Americano. Stock mínimo recomendado: 10.',
  confidence: 0.95,
  source: {
    queryIds: ['productos-stock'],
    datasetIds: ['ds-stock-20260708'],
    algorithm: 'threshold-check'
  },
  data: {
    metric: 'stock',
    currentValue: 2,
    threshold: 10,
    change: -80
  },
  actions: [
    { type: 'navigate', label: 'Ver producto', target: '/productos/123' },
    { type: 'execute', label: 'Crear pedido', target: 'create-order', params: { productId: 123 } }
  ],
  status: 'pending',
  createdAt: new Date('2026-07-08T14:30:00'),
  expiresAt: new Date('2026-07-08T18:00:00')
};
```

## Generación de Insights

### Automática (AI/ML)
- Análisis de tendencias temporales
- Detección de anomalías (valores fuera de rango)
- Predicciones basadas en historical data
- Recomendaciones basadas en patrones

### Manual (Reglas de negocio)
- Thresholds configurados (ej: "si stock < 5, alertar")
- Comparaciones predefinidas (ej: "vs ayer", "vs semana pasada")
- Alertas operativas (ej: "caja abierta más de X horas")

## Boundary: Insight vs. Notification

- **Insight** es un hallazgo analítico (puede ser ignorado, aceptado, descartado)
- **Notification** es una alerta push (se entrega inmediatamente, no tiene lifecycle)

```
Insight: "Stock bajo" → el usuario decide si actuar
Notification: "Stock bajo" → se envía al usuario inmediatamente
```

## Decisiones de diseño

1. **Insight es un citizen de primer nivel**: no es un add-on, es parte del framework
2. **Insight tiene confidence**: no todos los insights son igual de confiables
3. **Insight tiene lifecycle**: se puede aceptar, descartar, o ignorar
4. **Insight es accionable**: puede sugerir acciones concretas
5. **Insight es serializable**: se puede exportar en reportes
