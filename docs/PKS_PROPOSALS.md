# PKS Proposals

> Documento de trabajo. Propuestas activas, architectural gaps, decisiones de descarte, investigaciones y conceptos experimentales.
> No representa conocimiento oficial del PKS.
> Cuando una idea madure y sea aprobada, pasará al manifiesto (`PROJECT_KNOWLEDGE_SYSTEM.md`).

---

## Propuestas activas

### STAND-entity-identity — Estándar de diseño de identidad de entidades

**Origen**: Auditoría UX de Entity Lists (Clientes, Proveedores, Productos).

**Qué define**: Proceso de 4 preguntas para definir cualquier entidad antes de diseñar su pantalla. Flujo conceptual: dominio → identidad → representación → lista → página → workflow → componentes. Categorías de información: Identidad, Estado, Contexto, Acción.

**Documento**: `docs/ENTITY_IDENTITY_STANDARD.md`

**Evidencia**: Aplicado retrospectivamente a 3 entidades. Identificó datos faltantes (deuda en clientes, última compra en proveedores, categoría en productos) y datos sobrantes (IVA en lista, código interno).

**Condición para promover a Knowledge Item**: usado para diseñar ≥2 nuevas entidades desde cero (Marcas, Categorías, Rubros, Depósitos).

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

### CMD-project-sync — Especificación de `project sync` (Full Sync)

**Origen**: Especificación funcional externa. Véase ADR-project-commands-family para la decisión arquitectónica sobre la familia CMD-*.

**Definición oficial**: Project Sync alinea una rama con la evolución del proyecto. No sincroniza únicamente código. Sincroniza: conocimiento, arquitectura, decisiones, reglas, estándares, narrativas, código. El objetivo no es terminar con un rebase exitoso. El objetivo es terminar con una rama completamente alineada con la evolución del proyecto.

**Principios metodológicos**:

1. **Principio de Trazabilidad**: Antes de clasificar cualquier diferencia entre ramas, Project Companion debe determinar su origen. Ningún artefacto podrá clasificarse como nuevo, eliminado, modificado, reemplazado, renombrado o movido sin haber determinado previamente: merge-base, rama donde nació, primer commit donde apareció, historia del artefacto, y si realmente existió en ambas ramas. Toda clasificación posterior depende de esta trazabilidad. Si no puede determinar el origen con suficiente evidencia, debe informarlo explícitamente y evitar conclusiones categóricas.

2. **Principio de Costo Cognitivo**: Project Sync debe minimizar el costo cognitivo del desarrollador. Toda capacidad incorporada al comando debe justificar su existencia demostrando que reduce el tiempo, el esfuerzo o el riesgo de sincronizar una rama. Si una capacidad no aporta valor suficiente, debe eliminarse o ejecutarse únicamente bajo demanda.

3. **Principio de Relevancia**: Durante el Project Assessment el Companion no debe cargar ni analizar automáticamente todo el conocimiento nuevo de la rama objetivo. Solo debe profundizar cuando detecte evidencia objetiva de que ese conocimiento puede afectar la sincronización actual. Ejemplos de evidencia: un ADR nuevo que modifica la arquitectura involucrada, un Standard nuevo que afecta módulos o archivos modificados, una Narrativa de PR que documenta decisiones relevantes para resolver un conflicto esperado, un cambio metodológico que altera la estrategia de integración. Si ninguna condición ocurre, el Assessment informa brevemente que existen nuevos artefactos pero continúa con la sincronización sin leerlos ni analizarlos en detalle. La carga de conocimiento debe ser incremental, justificada y proporcional al problema que intenta resolver.

**Sintaxis**:

```
project sync [<rama>] [--full]
```

- `project sync` (o `project sync <rama>`) — **Quick mode (default)**: Assessment mínimo y merge rápido. Sin análisis profundo de conocimiento salvo que el Assessment detecte evidencia objetiva de relevancia.
- `project sync --full` (o `project sync <rama> --full`) — **Full mode**: Assessment completo con análisis profundo de ADR, Standards, Narrativas, reutilización y PKS. Para sincronizaciones complejas o cuando el usuario lo solicite explícitamente.

La rama objetivo es opcional. En Quick mode, el comportamiento metodológico se reduce al mínimo necesario para una sincronización segura. En Full mode, conserva el análisis completo.

**Casos**:

| Uso | Rama objetivo | Modo | Regla |
|-----|--------------|------|-------|
| `project sync` | Rama principal del proyecto | Quick (default) | Assessment mínimo. Sin análisis profundo salvo evidencia de relevancia. |
| `project sync <rama>` | La rama explícita indicada | Quick (default) | Igual que default pero contra la rama especificada. |
| `project sync --full` | Rama principal del proyecto | Full | Assessment completo con análisis profundo de ADR, Standards, Narrativas, reutilización y PKS. |
| `project sync <rama> --full` | La rama explícita indicada | Full | Igual que full pero contra la rama especificada. |

**Regla de resolución**:

1. Si el usuario pasa una rama → esa es la rama objetivo.
2. Si no pasa nada → detectar la rama por defecto del remoto (`git remote show origin \| grep "HEAD branch"` o `origin/HEAD`).
3. Si no se puede detectar → preguntar al usuario.

El Companion nunca debe asumir que la rama objetivo es `master` sin verificarlo.

**Equivalencia conceptual**:

```
project sync                 → sincronizar contra la rama principal del proyecto
project sync rolesusuario    → sincronizar contra rolesusuario
project sync feature/compras → sincronizar contra feature/compras
```

**Experiencia del usuario**:

Modo Quick (default):
```
project sync
    ↓
Assessment Mínimo
  (merge-base, estrategia,
   conflictos esperados,
   Required Actions,
   Recomendación)
    ↓
¿Continuar? → Sí / No
    ↓ (si Sí)
Merge / Rebase
    ↓
Build + Tests
    ↓
PASS del Sync
    ↓
Sync Learning
```

Modo Full (`--full`):
```
project sync --full
    ↓
Assessment Completo
  (6 preguntas + análisis
   profundo de ADR, Standards,
   Narrativas, reutilización, PKS)
    ↓
¿Continuar? → Sí / No
    ↓ (si Sí)
Merge / Rebase
    ↓
Build + Tests
    ↓
PASS del Sync
    ↓
Sync Learning
```

**Project Assessment** (automático): varía según el modo.

**Modo Quick** — Assessment mínimo:

1. **¿Qué cambió desde mi merge-base?** — Contexto (rama actual, rama objetivo, merge-base). Sin diff estructural detallado.
2. **Estrategia recomendada** — Merge o Rebase, con justificación.
3. **Conflictos esperados** — Archivos con alta probabilidad de conflicto.
4. **Required Actions** — Acciones obligatorias para continuar.
5. **Recomendación** — ¿Continuar o no?

En Quick mode no se cargan ADR, Standards, Narrativas ni PKS de la rama objetivo. La Evaluación de Relevancia solo se activa si durante el Assessment se detecta evidencia concreta de que ese conocimiento impacta archivos modificados o la estrategia de integración.

**Modo Full** — Assessment completo (comportamiento actual):

1. **¿Qué cambió desde mi merge-base?** — Contexto (rama actual, rama objetivo, merge-base), diff estructural de código, Assumptions explícitos sobre el análisis.
2. **¿Qué cambios afectan realmente mi implementación?** — Relevant Changes: cambios filtrados por impacto real en la rama actual. Cada ítem incluye impacto (Alto/Medio/Bajo), motivo, y nivel de confianza (Alta/Media/Baja + justificación).
3. **¿Qué riesgos existen?** — Probabilidad de conflictos, archivos críticos afectados, migraciones incompatibles, breaking changes, conflictos metodológicos, cambios de arquitectura incompatibles. Cada riesgo incluye explicación del motivo.
4. **Required Actions** — Acciones obligatorias para continuar correctamente. Ejemplos: ejecutar migraciones, resolver conflictos obligatorios, regenerar artefactos. No son recomendaciones — son requisitos.
5. **Evaluación de Relevancia** — El Companion evalúa si el conocimiento nuevo en la rama objetivo (ADRs, Standards, Narrativas, cambios metodológicos) afecta directamente los archivos modificados o la estrategia de integración. Solo si existe evidencia concreta de impacto profundiza en el análisis de ese artefacto. Si no, informa brevemente qué artefactos nuevos existen y continúa sin analizarlos en detalle.
6. **Recomendación** — Plan priorizado. El Companion recomienda, el desarrollador decide. Puede incluir: no continuar (riesgo alto sin mitigación), continuar con precauciones, o continuar directamente.

**Punto de decisión** (ambos modos): Al finalizar el Assessment, el Companion pregunta si el usuario desea continuar con la sincronización. La decisión final pertenece al desarrollador.

**Project Execution** (solo si el usuario confirma, ambos modos):

1. **Merge o Rebase** — Sincronización efectiva del código. El Companion ejecuta la estrategia definida en el Assessment (merge recomendado por defecto si la rama contiene merges internos). Durante la resolución de conflictos, el Companion analiza únicamente el conocimiento necesario para resolver cada conflicto. No ejecuta análisis preventivos.

2. **Build + Tests** — Verificación de que el código compila y los tests pasan después del merge.

3. **Actualización de PASS** — Registrar la PASS del Sync cuando corresponda.

**Sync Learning** (ambos modos): retroalimentación al finalizar, adaptada al modo ejecutado. En Quick mode, más breve y focalizada.

Project Execution se considera completado cuando el merge está resuelto, el código compila, los tests pasan y —si aplica— la PASS del Sync queda registrada.

**Sync Learning** (retroalimentación al finalizar): captura tres categorías para mejorar el Companion en el próximo sync.

| Categoría | Qué captura |
|-----------|-------------|
| Descubrimientos | ¿Qué conocimiento nuevo apareció durante el sync? |
| Conocimiento faltante | ¿Qué hubo que inferir porque no estaba preservado? |
| Recomendaciones | ¿Qué deberíamos preservar para que el próximo sync sea más rápido, barato y preciso? |

**Proyección a escala**: Project Sync debe seguir siendo útil cuando existan múltiples PRs (10, 20, 50) y cientos de commits entre el merge-base y la rama objetivo. El Assessment debe agrupar, filtrar y priorizar automáticamente la evolución detectada. El usuario nunca debe tener que analizar manualmente decenas de PRs para comprender qué cambió y qué le afecta.

**Dependencias conocidas**:
- `STAND-pr-narrative` ✅ — las narrativas de PR son un insumo del Assessment (Relevant Changes, Riesgos). El análisis detallado de narrativas solo se ejecuta bajo demanda o cuando el Assessment detecta que es relevante para resolver la sincronización.
- PASS ⏳ — concepto metodológico existente pendiente de formalización en el PKS. Se referencia en Execution (actualización de PASS si corresponde).

**Relación con el ADR-project-commands-family**: Este comando es el primero de la familia CMD-*, actualmente acompañado por CMD-project-init (inicialización de sesión). Cuando existan 2-3 comandos promovidos, se creará la infraestructura formal CMD-* (registry, metadata, template, convenciones). Hasta entonces vive como propuesta.

**Condición para promover a Knowledge Item**: Implementación funcional validada con al menos un sync real entre ramas.

**Estado de validación**: ✅ Primer sync real completado (PASS-002). Merge exitoso Rediseño_Productos_Cliente_Proveedor ↔ rolesusuario. Principio de Relevancia validado. 8 recomendaciones para V2 capturadas en PASS-002 Sync Learning (incluyendo modos Quick/Full). Pendiente segundo sync real de tipo distinto para promoción.

### PASS Discovery — Detección automática de unidades de trabajo

**Origen**: Diseño de PASS V1. El sistema detectó que la creación de PASS depende completamente del usuario.

**Qué define**: Capacidad del Project Companion para detectar automáticamente cuándo una conversación evolucionó hasta convertirse en una unidad de trabajo, y sugerir la creación de una PASS al usuario.

**Criterios de detección**:

Señales fuertes (cualquiera sola justifica sugerir):
- Aparece un objetivo claro de implementación
- Se modifican 3+ archivos
- Se analizan alternativas con criterios
- Aparece un plan con pasos
- Se identifica un bug con causa raíz
- El trabajo requiere investigación externa

Señales medias (necesitan 2+ para sugerir):
- Se toman decisiones
- Aparecen tareas pendientes o próximos pasos
- Se acumula contexto que sería costoso reconstruir
- Se referencian conceptos ya investigados
- La conversación abarca múltiples módulos

Señales débiles (apoyan pero no determinan solas):
- Conversación se extiende más allá de 5-10 intercambios
- El usuario indica que el trabajo continuará después
- Se crean archivos nuevos
- Se ejecutan comandos de build/test repetidamente

**Comportamiento**:
- El Companion evalúa las señales durante la conversación
- Al cruzar el umbral, pregunta: "Parece que este trabajo ya tiene entidad propia. ¿Querés crear una PASS?"
- Si el usuario acepta: genera ID, asigna Trigger, registra objetivo, inicia seguimiento normal
- Si el usuario rechaza: continúa normalmente, no insiste salvo que el trabajo cambie significativamente

**Estado**: Propuesta activa. No implementado.

**Condición para promover**: Validado con al menos 3 detecciones exitosas en trabajo real donde el usuario confirme que la PASS creada fue útil.

### CMD-project-init — Inicialización de sesión del Project Companion

**Origen**: Necesidad de estandarizar la inicialización del Companion al comenzar una sesión. Reemplaza al antiguo "modo pks".

**Qué define**: Comando que prepara al Project Companion para trabajar siguiendo la metodología del proyecto. No modifica archivos, no crea PASS, no ejecuta sync, no genera documentación. Su única responsabilidad es preparar la sesión.

**Comportamiento**:

Al ejecutar `project init`, el Companion debe:

1. **Cargar el contexto del proyecto**: leer los documentos mínimos necesarios para inicializar la sesión. Son obligatorios: `PROJECT_KNOWLEDGE_SYSTEM.md` y `PROJECT_COMPANION.md`. Los demás documentos (PASS, STAND, ADR, CMD, registries, propuestas) se cargan automáticamente solo si son relevantes para la sesión o si el Companion determina que forman parte del contexto necesario.

2. **Reconocer el estado del proyecto**: informar brevemente la rama actual, estado del repositorio (cambios sin commit), PASS activa (si existe), comandos disponibles del Companion, y propuestas activas relevantes (solo si afectan la sesión). Resumen ejecutivo breve, no un reporte largo.

3. **Inicializar el Companion para trabajar con la metodología**: a partir de ese momento, utilizar PKS, PASS, Standards, ADR, CMD y Narrativas como parte natural del razonamiento. No esperar a que el usuario los mencione nuevamente.

4. **Aplicar PASS Discovery durante la sesión**: detectar cuándo la conversación evoluciona a unidad de trabajo y sugerir crear una PASS. Nunca crearla automáticamente.

5. **Mantener el contexto sin releer continuamente**: el conocimiento cargado persiste como contexto base durante toda la sesión.

**Relación con CMD-project-sync**: comando complementario. `project init` prepara la sesión; `project sync` alinea ramas. Si `project sync` se ejecuta después de `project init`, no necesita recargar el contexto.

**Relación con el ADR-project-commands-family**: Este es el segundo comando de la familia CMD-*, junto con CMD-project-sync. La infraestructura formal CMD-* sigue diferida hasta que uno de los dos sea promovido a Knowledge Item.

**Estado**: Propuesta activa. No implementado.

**Condición para promover**: Implementación funcional validada en al menos 3 sesiones de trabajo real donde el usuario confirme que el comando agilizó el inicio de la sesión.

### CMD-project-help — Ayuda oficial del Project Companion

**Origen**: Necesidad de un comando de referencia para listar las capacidades disponibles del Companion, similar a `git help` o `docker help`.

**Qué define**: Comando que muestra al usuario las capacidades disponibles del Project Companion con nombre, propósito, descripción breve y ejemplos de uso. No modifica archivos, no crea PASS, no ejecuta sync. Solo informa.

**Comportamiento**:

Al ejecutar `project help`, el Companion debe mostrar cada comando con:
- nombre
- propósito
- breve descripción
- sintaxis y ejemplos de uso cuando corresponda

Debe incluir como mínimo los comandos con especificación (`project init`, `project sync`, `project help`) y los planificados (`project pass`, `project review`, `project audit`, `project learn`, `project status`).

Para `project sync` debe reflejar ambos modos:

```
project sync              → Quick mode (default): sincronización rápida con Assessment mínimo
project sync <rama>       → Quick mode contra rama específica
project sync --full       → Full mode: análisis completo de conocimiento
project sync <rama> --full → Full mode contra rama específica
project sync --help       → Mostrar ayuda detallada del comando sync
```

La fuente de verdad de la lista de comandos es `ADR-project-commands-family.md`. `project help` debe reflejar los comandos registrados allí. Los comandos que todavía son propuesta (no implementados) deben indicarlo explícitamente.

**Relación con `project init`**: `project init` incluye "comandos disponibles del Companion" como parte de su resumen ejecutivo de inicio de sesión. `project help` es la referencia completa que el usuario puede consultar en cualquier momento. No son redundantes — init muestra un vistazo rápido, help es la documentación oficial.

**Relación con el ADR-project-commands-family**: Este comando completa el conjunto de comandos con especificación detallada junto con CMD-project-sync y CMD-project-init. La infraestructura formal CMD-* sigue diferida hasta que un comando sea promovido a Knowledge Item.

**Estado**: Propuesta activa. No implementado.

**Condición para promover**: Implementación funcional validada donde el usuario confirme que el comando es útil como referencia de las capacidades del Companion.

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

### Project Companion Command System

**Estado**: Architectural Gap

**Qué define**: La arquitectura del sistema de comandos `project`. Comando raíz extensible con subcomandos de responsabilidad única. Filosofía: "Git sincroniza código. Project Companion sincroniza conocimiento, arquitectura y evolución del proyecto."

**Comandos identificados**:

| Comando | Propósito |
|---------|-----------|
| `project sync` | Sincronizar rama preservando código, conocimiento y arquitectura |
| `project pass` | Administrar una PASS |
| `project review` | Auditar una implementación |
| `project audit` | Comprender un módulo o funcionalidad |
| `project preserve` | Determinar qué conocimiento incorporar al PKS |
| `project learn` | Extraer conocimiento desde una branch, PR o funcionalidad |
| `project status` | Estado del proyecto, PASS activas, reglas nuevas, pendientes |
| `project help` | Listar todos los comandos disponibles |

**Evidencia**: La especificación de `project sync` (primer comando) existe como documento externo y está registrada como Propuesta Activa en este documento. El proyecto ya cuenta con `STAND-pr-narrative` que `project sync` consumiría. El ADR-project-commands-family establece la dirección arquitectónica (familia CMD-*, infraestructura diferida).

**Decisión arquitectónica**: Véase ADR-project-commands-family. Los comandos constituyen una familia conceptual distinta de los Standards (CMD-* vs STAND-*). La infraestructura formal se creará cuando existan 2-3 comandos promovidos.

**Condición para promover a Knowledge Item**: Cuando al menos un comando esté implementado y validado con uso real.

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
| 2026-07-05 | STAND-pr-narrative — Preservación de Narrativa de Desarrollo | `standards/STAND-pr-narrative.md` |
| 2026-07-05 | PASS V1 — Especificación de unidad de trabajo | `passes/PASS-V1.md` |
| 2026-07-05 | PASS-002 — Primer sync real CMD-project-sync | `passes/PASS-002.md` |
| 2026-07-05 | CMD-project-sync: Principio de Relevancia validado en sync real | PASS-002 |
| 2026-07-05 | CMD-project-sync: 8 recomendaciones para V2 (incluye Quick/Full modes) | PASS-002 Sync Learning |
| 2026-07-05 | CMD-project-sync: Quick/Full modes incorporados a sintaxis y Assessment | PKS_PROPOSALS.md |
