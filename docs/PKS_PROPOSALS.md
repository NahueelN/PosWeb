# PKS Proposals

> Documento de trabajo. Propuestas activas, architectural gaps, decisiones de descarte, investigaciones y conceptos experimentales.
> No representa conocimiento oficial del PKS.
> Cuando una idea madure y sea aprobada, pasará al manifiesto (`PROJECT_KNOWLEDGE_SYSTEM.md`).

---

## Propuestas activas

### Template Pattern: agregar Origin, Invariants y Expected Evolution

**Origen**: Creación de PAT-cart-flow (primer Knowledge Item real).

**Problema**: El template `pattern.md` no incluye secciones para documentar el contexto histórico de un patrón (`## Origin`), las reglas inmutables que nunca deben romperse (`## Invariants`), ni la dirección esperada de evolución (`## Expected Evolution`). Estas tres secciones resultaron esenciales para PAT-cart-flow y tuvieron que agregarse manualmente.

**Evidencia**: 1 caso de uso real. Las tres secciones contienen contenido sustancial que no podría haberse ubicado en otras secciones del template.

**Propuesta**: Agregar `## Origin`, `## Invariants`, y `## Expected Evolution` como secciones estándar del template `pattern.md`.

### STAND-page-layout — PageShell como estándar obligatorio

**Origen**: Creación de LAYOUT-page-shell. Análisis de adopción de PageShell en el proyecto.

**Estado actual**: Solo 2 de 15 páginas usan PageShell (CajaPage, DeudaPage). `propuestaUnificacion.md` lo declara como objetivo de la Fase 5, no como realidad vigente.

**Propuesta**: Cuando la adopción supere el 80% de las páginas, crear `STAND-page-layout` con Status Canonical que declare: "Toda página de PosWeb debe usar PageShell como wrapper. Las excepciones requieren justificación."

**Condición para implementar**: ≥12 de 15 páginas usando PageShell.

### Registry Estructurado (JSON autogenerado)

**Estado**: Aprobada en concepto, pendiente de implementación.

El Knowledge Curator generará automáticamente `registry/index.json` a partir de los Knowledge Items. Este archivo será parseable por herramientas e IAs. Nunca editado manualmente.

**Condición para implementar**: cuando existan suficientes Knowledge Items como para que el Registry Markdown sea difícil de consultar.

### Identificadores estables para reglas individuales (BUS-CART-001, etc.)

**Origen**: Creación de BUS-carrito, BUS-venta, BUS-compra. Las reglas dentro de cada BUS son listas numeradas sin identificador persistente.

**Ventajas**: Una relación podría apuntar a una regla específica. Si una regla se mueve entre documentos, su ID permanece estable.

**Desventajas**: Agrega granularidad que hoy no se necesita. Complejidad adicional en template y Registry.

**Recomendación**: No implementar ahora. Revisar cuando haya más de 10 BUS con más de 5 reglas cada uno.

---

## Architectural Gaps

### ABM Pattern

**Estado**: No existe un patrón ABM implementado. Las 7 páginas CRUD divergen en cada decisión de implementación.

**Evidencia**:

| Aspecto | Estado |
|---|---|
| Arquitectura común | ❌ Tabla vs Cards. Modal vs Inline. Paginación inconsistente. |
| Componentes compartidos | ❌ Solo Button en 5/7 páginas. Sin tabla, modal ni formulario compartido. |
| Flujo de teclado | ❌ Solo ProductosPage tiene navegación. Las otras 6 no. |
| Layout | ❌ Ninguna usa PageShell. Cada página hand-rollea su header. |
| Toolbar | ❌ No existe el concepto en el proyecto. |
| Estados compartidos | ❌ Sin hook `useCrud`. 7 implementaciones independientes de loading/editing/showForm. |
| Validaciones | ❌ Sin criterio unificado. HTML required, validación manual, o ninguna. |

**Inconsistencias observadas**: Misma operación (CRUD) se implementa con tabla en 5 páginas y cards en 2. Misma operación (crear/editar) con modal en 3 páginas y form inline en 4. Búsqueda inconsistente. Solo 1 página con paginación.

**Beneficios de resolverlo**: Nuevo ABM en ~60 líneas en lugar de ~250. Consistencia visual y de comportamiento. Cambio de diseño global automático vía CrudHost.

**Criterios de promoción a Canonical Pattern**: ≥3 páginas con CrudHost, `useCrud<T>` implementado, tabla/form/toolbar compartidos, PageShell en todas las páginas ABM, flujo de teclado consistente.

---

## Decisiones de descarte

### Mantener proveedor entre compras

**Estado**: Descartada

**Origen**: Auditoría Ventas/Compras (2026-06-30)

**Motivo**: Se evaluó conservar el proveedor seleccionado al iniciar una nueva compra. Se descartó porque el flujo operativo real indica que normalmente las compras consecutivas pertenecen a proveedores distintos. El ahorro de una selección no compensa el riesgo de registrar compras al proveedor incorrecto.

**Condición para reevaluar**: Solo si aparece evidencia de uso real que justifique el cambio (ej: métricas de que >70% de compras consecutivas son al mismo proveedor).

---

## Investigaciones

### Knowledge Score automatizado

¿Se puede calcular automáticamente un score de "merece ser Knowledge Item" basado en:
- cantidad de imports/usos en el código
- presencia de lógica no trivial
- cantidad de fuentes distintas
- antigüedad del código

---

### Validación de consistencia código↔PKS

¿Se puede detectar automáticamente cuando un Knowledge Item quedó desactualizado porque sus Sources fueron modificados?

---

## Registro de promociones

| Fecha | Propuesta | Destino |
|-------|-----------|---------|
| 2026-06-30 | `Sources` obligatorio | Manifiesto |
| 2026-06-30 | `Stability` eliminado (redundante con `Status`) | Manifiesto |
| 2026-06-30 | `Deprecates` (relación bidireccional de reemplazo) | Manifiesto |
| 2026-06-30 | Tags con vocabulario controlado | Manifiesto |
| 2026-06-30 | Tipo `Standard` (`STAND-`) | Manifiesto |
| 2026-06-30 | `Template` versionado en metadata | Manifiesto |
| 2026-06-30 | Principio de automatización (#7) | Manifiesto |
| 2026-06-30 | Principio de validación por uso (#8) | Manifiesto |
| 2026-06-30 | Infraestructura PKS v1 congelada | Manifiesto |
