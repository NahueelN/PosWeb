# Templates — Convenciones del PKS

> Reglas generales que todo Knowledge Item debe respetar.
> Leer este documento antes de crear o modificar cualquier template.

---

## ¿Qué es un Knowledge Item?

Un Knowledge Item es un documento que preserva una pieza importante del conocimiento del proyecto.

No documenta cómo funciona el código. El código ya explica eso.

Preserva lo que el código NO puede explicar:

- por qué se tomó una decisión;
- qué problema resuelve un componente;
- cuándo debe reutilizarse;
- cuándo NO debe reutilizarse;
- qué invariantes de negocio deben respetarse;
- qué patrón forma parte del estándar del proyecto.

---

## ¿Cuándo crear un Knowledge Item?

### Crear cuando

- el componente, patrón o decisión es **reutilizable**;
- representa una **decisión arquitectónica** que no es evidente en el código;
- representa una **regla de negocio** que debe respetarse;
- implementa un **patrón** que forma parte del estándar del proyecto;
- es utilizado por **varios módulos** y merece ser conocido;
- preserva **conocimiento difícil de reconstruir** leyendo únicamente el código.

### NO crear cuando

- el código es autodocumentado (tipos de TypeScript, JSDoc, nombres claros);
- el componente es trivial (≤30 líneas, sin lógica de dominio);
- la información ya existe en otro Knowledge Item;
- el conocimiento es obvio para cualquier desarrollador;
- el patrón aún no fue probado en al menos dos contextos diferentes.

---

## Tipos de Knowledge Item

| Tipo | Prefijo | Descripción |
|------|---------|-------------|
| Component | `COMP-` | Componente reutilizable |
| Pattern | `PAT-` | Patrón de diseño, arquitectura o convención |
| Business Rule | `BUS-` | Regla de negocio que debe respetarse |
| ADR | `ADR-` | Decisión arquitectónica |
| Design System | `DS-` | Estándar visual, token o componente del Design System |
| Layout | `LAYOUT-` | Layout o shell |
| Flow | `FLOW-` | Flujo principal del sistema |
| Hook | `HOOK-` | Hook reutilizable |
| Service | `SERVICE-` | Servicio o API |
| Model | `MODEL-` | Modelo de datos cuya comprensión aporta conocimiento |
| Standard | `STAND-` | Estándar global del proyecto (coding, naming, UX, testing, etc.) |
| Glossary | `GLOSSARY-` | Término oficial del proyecto |

---

## Metadata obligatoria

Todo Knowledge Item DEBE incluir estos campos en su frontmatter o encabezado:

| Campo | Descripción | Valores |
|-------|-------------|---------|
| `ID` | Identificador permanente | `{PREFIJO}-{nombre}`. Ej: `PAT-cart-flow` |
| `Type` | Tipo de conocimiento | Uno de los tipos listados arriba |
| `Name` | Nombre descriptivo | Texto libre |
| `Status` | Estado del conocimiento | `Draft`, `Active`, `Canonical`, `Deprecated` |
| `Priority` | Importancia dentro del proyecto | `Critical`, `High`, `Medium`, `Low` |
| `Level` | Nivel de generalización | `Core`, `Domain`, `Project` |
| `Sources` | Archivos de donde se extrajo el conocimiento | Lista de paths relativos al repo |
| `Created` | Fecha de creación | ISO 8601 (`YYYY-MM-DD`) |
| `Updated` | Fecha de última actualización | ISO 8601 (`YYYY-MM-DD`) |

---

## Metadata opcional

Estos campos pueden agregarse cuando aporten valor:

| Campo | Descripción |
|-------|-------------|
| `Confidence` | Nivel de certeza: `High`, `Medium`, `Low` |
| `Review Required` | `true` si una IA debe consultar antes de reutilizar |
| `Owner` | Área responsable: `Core`, `UX`, `Business`, `Shared`, `Infrastructure` |
| `Deprecates` | ID del Knowledge Item que este reemplaza |
| `Deprecated By` | ID del Knowledge Item que reemplaza a este |
| `Tags` | Clasificación temática. Vocabulario controlado (ver sección Tags) |
| `Version` | Versión semántica si el item evoluciona formalmente |

---

## Estados (Status)

| Estado | Significado |
|--------|-------------|
| `Draft` | En elaboración. No debe considerarse conocimiento oficial. |
| `Active` | Conocimiento vigente y verificado. |
| `Canonical` | Es la forma oficial de construir ese tipo de funcionalidad. Toda implementación futura debe reutilizarlo salvo justificación. |
| `Deprecated` | Fue reemplazado o dejó de usarse. Se preserva por contexto histórico. |

### Sobre Canonical

**Canonical NO es un tipo de Knowledge Item. Es un estado.**

Cualquier tipo puede alcanzar estado `Canonical`:
- Un Pattern puede ser `Canonical`
- Un Component puede ser `Canonical`
- Un Layout puede ser `Canonical`
- Un Flow puede ser `Canonical`

Significa que el proyecto lo reconoce como la implementación oficial para ese tipo de funcionalidad.

---

## Prioridad (Priority)

| Prioridad | Significado |
|-----------|-------------|
| `Critical` | Conocimiento fundacional. Sin esto no se entiende el proyecto. |
| `High` | Conocimiento importante. Afecta a múltiples módulos. |
| `Medium` | Conocimiento útil. Mejora la comprensión pero no es indispensable. |
| `Low` | Conocimiento complementario. Puede consultarse si se necesita contexto adicional. |

---

## Niveles de conocimiento (Level)

| Nivel | Significado | Directorio |
|-------|-------------|------------|
| `Core` | Reutilizable por cualquier proyecto de software | `knowledge/core/` |
| `Domain` | Reutilizable dentro de un dominio específico (POS) | `knowledge/domains/pos/` |
| `Project` | Exclusivo de PosWeb | `knowledge/projects/posweb/` |

### Promoción entre niveles

- Todo conocimiento nace como `Project`.
- Cuando un patrón es reutilizado en distintos proyectos del mismo dominio, puede promoverse a `Domain`.
- Cuando un patrón es independiente del dominio, puede promoverse a `Core`.
- **Nunca generalizar anticipadamente.** La promoción requiere evidencia de uso.

---

## Nombres de archivo

Formato: `{PREFIJO}-{nombre}.md`

- Usar minúsculas.
- Separar palabras con guiones (`-`).
- No usar espacios ni underscores.
- El nombre debe coincidir con el ID.

Ejemplos:
- `PAT-cart-flow.md`
- `BUS-reglas-venta.md`
- `ADR-auth-flow.md`
- `DS-design-tokens.md`

---

## Tags

Los tags utilizan un vocabulario controlado. Solo pueden usarse tags registrados en el sistema.

### Tags disponibles

| Tag | Descripción |
|-----|-------------|
| `POS` | Sistema de punto de venta |
| `Ventas` | Flujo o regla de ventas |
| `Compras` | Flujo o regla de compras |
| `Caja` | Control de caja |
| `Stock` | Gestión de inventario |
| `Scanner` | Lectura de código de barras |
| `Keyboard` | Navegación por teclado |
| `UX` | Experiencia de usuario |
| `Deuda` | Gestión de deudas |
| `Cliente` | Relacionado con clientes |
| `Proveedor` | Relacionado con proveedores |
| `Auth` | Autenticación y autorización |
| `Offline` | Funcionalidad sin conexión |
| `Combo` | Productos combinados |

### Agregar nuevos tags

Para agregar un tag, debe proponerse y justificarse. Una vez aprobado se agrega a esta lista y al vocabulario del Registry.

---

## Relaciones

Los Knowledge Items forman un grafo. Las relaciones se definen en la metadata de cada item y se indexan en el Registry.

Tipos de relaciones:

| Relación | Significado |
|----------|-------------|
| `USES` | Utiliza al item destino |
| `IMPLEMENTS` | Implementa el estándar definido por el destino |
| `DEPENDS_ON` | Requiere al item destino para funcionar |
| `RESPECTS` | Respeta la regla de negocio del destino |
| `RELATED` | Relación conceptual sin dependencia técnica |
| `REPLACES` | Reemplaza al item destino |
| `DEPRECATED_BY` | Fue reemplazado por el destino |

---

## Versionado

- Los Knowledge Items no tienen versión por defecto.
- El campo `Updated` registra la última modificación.
- Si un item cambia de manera significativa, debe evaluarse si la documentación sigue representando la realidad del código.
- Si un item queda obsoleto, su status pasa a `Legacy` y se registra `Deprecated By`.

---

## Evolución de los templates

Los templates pueden evolucionar. Si durante el uso se descubre que:

- falta un campo importante;
- sobra un campo que nunca se usa;
- la estructura no escala;
- un nuevo tipo de Knowledge Item requiere su propio template;

debe proponerse la actualización del template correspondiente.

---

## Registry

El Registry existe en dos formatos complementarios:

1. **Registry Markdown** (`registry/*.md`): legible por humanos. Índices organizados por tipo de Knowledge Item.
2. **Registry Estructurado** (`registry/index.json`): generado automáticamente por el Knowledge Curator. Parseable por herramientas e IAs. Nunca editado manualmente.

Las relaciones se definen en la metadata de cada Knowledge Item. El Registry Estructurado las agrega para consulta. El archivo `registry/relationships.md` se genera a partir de esa misma metadata.

---

## Cómo usar los templates

1. Identificar el tipo de Knowledge Item a crear.
2. Abrir el template correspondiente en `templates/`.
3. Copiar la estructura.
4. Completar todos los campos obligatorios.
5. Completar los opcionales que aporten valor.
6. Guardar en el directorio correspondiente al `Level`.
7. Agregar la entrada al índice del Registry Markdown según el tipo.
8. El Knowledge Curator regenerará el Registry Estructurado automáticamente.

---

## Sources

El campo `Sources` es **obligatorio**. Todo Knowledge Item debe declarar de qué archivos del repositorio se extrajo el conocimiento.

Sin Sources, un Knowledge Item se vuelve inverificable con el tiempo.

Formato:
```yaml
Sources:
  - frontend/src/components/hosts/CartHost.tsx
  - frontend/src/hooks/useCart.ts
  - docs/dev-context.md
```

Deben ser paths relativos a la raíz del repositorio. Deben apuntar a archivos que existan en el momento de creación del item.
