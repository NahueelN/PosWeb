# PASS-001 — Mejorar Clientes

---

## Resumen

- **ID:** PASS-001
- **Trigger:** Feature/UX
- **Estado:** Completed (extracción de conocimiento pendiente)
- **Especificación:** [PASS-V1](PASS-V1.md)
- **Objetivo:** Migrar `loading` / `error` de `ClientesPage` a los props de `PageShell`.
- **Cambio seleccionado:** C6 — Migrar loading/error a props de PageShell (score 12/16; tiene par comparable en `ProveedoresPage` para Fase 4 del experimento).
- **Archivos modificados:**
  - `frontend/src/components/shared/PageShell.tsx` (añadido `onErrorClose?: () => void`)
  - `frontend/src/pages/ClientesPage.tsx` (eliminado `AlertBanner` y div "Cargando…", props delegadas a PageShell)
- **Verificación:** `npm run build` — sin errores nuevos en archivos tocados. Los errores reportados son preexistentes en `VentasPage.tsx` y fuera de scope.
- **Resultado:** PageShell ahora soporta error dismissible. ClientesPage simplificado +2 / -8 líneas.
- **Preguntas abiertas (no bloqueantes):**
  - H3: deuda no aparece en DTO/endpoint → candidate para Pass futura
  - H4: soft-delete planeado pero no expuesto → candidate para Pass futura
  - H5: estándar de identidad definido post-implementación
- **Experimento:** Pass seleccionada en parte por tener par comparable (ProveedoresPage). Fase 2 (baseline) completada midiendo el flujo actual. Fase 3 (diseño del Context Builder) pendiente; Fase 4 (repetir sobre Proveedores con optimización) pendiente.
- **Próximo paso:** Fase 3 — diseñar Context Builder a partir de la evidencia de contexto efectivo de esta Pass.

---

## Detalle

### Mapa de comprensión (resumido)

| Entidad | Estado | Nota mínima |
|---|---|---|
| Problem | Inferido | Admin necesita cadastro de clientes. |
| Actor | Observado | Admin/SuperAdmin (`[Authorize]`). |
| Objective | Inferido | Encontrar, crear, editar clientes. |
| Constraint | Conocimiento | Solo admin; backend no modela IVA (H2 validada). |
| Decision | Conocimiento | IVA es dead code; soft-delete existe pero inalcanzable. |
| Process | Conocimiento (H1) | CRUD admin desconectado de la venta. |
| Concept | Observado | Cliente (identidad: nombre + tipo + nro doc). |
| Concept | Grieta | Deuda no modelada en DTO ni endpoint. |
| Interface | Observado | REST `/api/clientes` + UI ClientesPage. |
| Implementation | Observado | .NET + React + 4 hooks. |
| Evidence | Observado | Código, DB snapshot, git log. |
| Knowledge | Conocimiento | H1, H2 validadas. |

Hipótesis H3, H4, H5 quedan como preguntas abiertas registradas, no validadas. No influyen en el cambio seleccionado (C6).

### Diseñar — Selección

8 candidatos evaluados (C1–C8). Mecanismo: tabla de scoring con 5 dimensiones (alineación ×2, valor ×2, aprendizaje ×2, costo ×1 invertido, riesgo ×1 invertido).

Ver scoring completo en `docs/passes/heuristicas/scoring-seleccion-de-cambio-v0.md` (pendiente de creareción).

Resultado: **C6 seleccionado** (score 12/16) por tener par comparable para el experimento.

> La fórmula de scoring NO es parte de la metodología oficial. Es heurística experimental v0. Vive en `docs/passes/heuristicas/`. Se promoverá solo si sobrevive varias Pass de tipos distintos de cambio.

### Construir — Cambios realizados

**PageShell.tsx:**

- Añadido prop `onErrorClose?: () => void`.
- Import añadido: `X` desde lucide-react.
- Error banner renderiza botón de cerrar (icono X) cuando `onErrorClose` se pasa.

**ClientesPage.tsx:**

- Eliminada importación de `AlertBanner`.
- Eliminada importación de `PagedResult` (unused, preexistente).
- `PageShell` recibe `loading={list.loading && list.data.length === 0}`, `error={list.error}`, `onErrorClose={list.clearError}`.
- Eliminado el JSX de `<AlertBanner>` y del div "Cargando…".
- Subárbol condicional reducido a `list.data.length === 0 ? <EntityEmptyState/> : <listado>`.

### Métricas observadas (no estimadas)

#### Contexto cargado

- Lecturas directas en Construir: 3 archivos (~507 líneas).
- Auditoría Comprender delegada: 25 archivos de la zona Clientes.
- Mini-validación H1/H2: ~10 archivos (VentaPage, DbContext, schema, service, etc.).
- Documentos consultados: 4 (PROJECT_COMPANION.md, PKS_PROPOSALS, entity-pages-architecture, ENTITY_LIST/IDENTITY standards via delegación).
- KI consultados: 0.

#### Contexto efectivamente utilizado (confirmado, confianza alta)

- `ClientesPage.tsx` — leído + editado.
- `PageShell.tsx` — leído + editado.
- `types/index.ts` — referenciado para confirmar `ClienteDto` shape (conocimiento previo via delegación).

#### Contexto útiles pero no imprescindibles (confianza media)

- `entity-pages-architecture.md` — útil para entender por qué importa la divergencia; no directamente consultado durante Construir.
- `ENTITY_IDENTITY_STANDARD.md` — útil para entender H5; no influyó en C6.

#### Contexto posiblemente innecesario (confianza mediaalta)

- La mayoría de los 25 archivos de la auditoría inicial de Clientes no contribuyeron a C6. Eran necesarios para Comprender, pero Comprender produjo una lista de candidatos; C6 solo necesita 2 archivos.
- Mini-validación H1/H2 informó el scoring de C1 e indirectly la seleccion de C6 (el scoring incluyó aprendizaje esperado de H2). Pero el cambio de C6 en sí no usa H1/H2.
- `LAYOUT-page-shell.md` KI aplica directamente al cambio. **No fue consultado.** Confianza: alta de que se trató de desperdicio.

#### Tiempo hasta primer edit de código (confianza alta)

- ~30 tool calls entre el inicio de Comprender y el primer edit en PageShell. La metodología tarda en generar valor de código cuando el cambio es pequeño.

### Contexto efectivo

Esta sección aprende para el futuro Context Builder: qué contexto se necesitó realmente para completar la Pass.

**Necesario (no se puede completar la Pass sin esto):**

- `frontend/src/pages/ClientesPage.tsx`
- `frontend/src/components/shared/PageShell.tsx`
- Sección de Comprender de `PROJECT_COMPANION.md` (para ejecutar la etapa)
- Sección de Diseñar de `PROJECT_COMPANION.md` (para ejecutar el Paso 1 — Selección)

**Útil (informó una decisión pero no imprescindible):**

- `frontend/src/pages/ProveedoresPage.tsx` (solo para confirmar comparabilidad del experimento, no para el cambio)
- `docs/entity-pages-architecture.md` (background sobre qué es una Entity Page)
- Heurística de scoring (en `docs/passes/heuristicas/`)

**No necesario (cargado pero no impactó el cambio):**

- Los ~22 archivos restantes de la auditoría inicial de Clientes (backend, domain, exceptions, DbContext, snapshots, git log).
- Mini-validación H1/H2 (aportó conocimiento pero el conocimiento no influyó en C6).
- `LAYOUT-page-shell.md` KI — relevante pero nunca cargado (grieta de diseño del Context Builder).
- `PKS_PROPOSALS.md`.
- `ENTITY_LIST_STANDARD.md`, `ENTITY_IDENTITY_STANDARD.md` (via delegación — no aportaron nada a C6).

### Fricciones detectadas

1. Criterio de salida de Comprender demasiado estricto → flexibilizado a "suficiente para el cambio".
2. Diseñar no tenía workflow → Paso 1 (Selección del cambio) definido en caliente.
3. Heurística de scoring cristalizada demasiado pronto → separada a `docs/passes/heuristicas/`.
4. `docs/passes/` no existía → creado mid-flight.
5. KI relevante (`LAYOUT-page-shell.md`) nunca consultado → evidencia directa para Fase 3.
6. Bash `workdir` no se aplicó en algunas llamadas → fuera de metodología (tooling).
7. PASS-001 terminó siendo un log → reescrito con estructura de dos niveles.

### Hipótesis experimental H-KI-NAV-001 (no promocionable hasta Validación en Pass posterior)

**Toda fricción con un solo dato es hipótesis, no conocimiento.** Esta sección registra la hipótesis, no la confirma.

**Contexto:** Durante PASS-001 existía un KI (`LAYOUT-page-shell.md`) que documentaba exactamente el componente central del cambio seleccionado (C6: migrar loading/error a props de PageShell). El KI nunca fue cargado. El cambio se implementó directamente del código fuente, sin consultar el conocimiento preservado que aplicaba.

**Pregunta:** ¿Por qué Project Companion no encontró automáticamente el KI relevante durante PASS-001?

**Análisis basado únicamente en evidencia de PASS-001:**

- El KI usa `Sources:` para listar archivos que se leyeron cuando se escribió el KI (`PageShell.tsx`, `CajaPage.tsx`, `DeudaPage.tsx`, `CartHost.tsx`). `ClientesPage.tsx` no está — el KI quedó desactualizado respecto a quién usa PageShell. El campo `Sources:` es volátil: cambia con cada consumidor nuevo.
- El KI usa `Tags: [UX, Caja]`. Ambos son amplios y no indexan los conceptos que el KI cubre (`loading`, `error`, `page-shell`, `shared-component`).Buscar "loading" en el directorio de KI no devuelve este KI.
- El KI tiene `Relations: RELATED DS-design-tokens.` No hay relación con ningún archivo de implementación como ancla estructural estable.
- El workflow de Comprender guide al auditor a buscar evidencia por "zona de entidad", no a seguir dependencias de implementación (ej: ClientesPage importa PageShell → buscar KI que documenta PageShell).

**Hipótesis:** Un Knowledge Item no es hoy un nodo de navegación. Solo es un documento de conocimiento. Para que el sistema encuentre KI relevantes sin que un humano se acuerde manualmente de ellos, todo KI debería poder responder dos preguntas:

1. **¿Qué artefacto documenta?** — una relación estructural estable (un archivo, un módulo, un contrato) que no cambia con cada consumidor nuevo.
2. **¿Qué conceptos cubre?** — navegación semántica por conceptos, no por etiquetas amplias.

El fallo en PASS-001 fue que `LAYOUT-page-shell.md` no podía ser encontrado ni por estructura (no conecta anclado a `PageShell.tsx` de forma buscable) ni por concepto (sus tags no incluyen los conceptos que cubre).

**Lo que NO define esta hipótesis:**

- No define nombres de campos (`Implemented-by`, `Primary Artifact`, `Covers`, etc.). Esos son detalles del template, no del principio.
- No define la forma del campo (lista, single, YAML, frontmatter). Esos son detalles de implementación.
- No modifica `PROJECT_COMPANION.md`. Es hipótesis experimental de PASS-001.
- No migra el resto de los KI existentes.
- No modificar `LAYOUT-page-shell.md` todavía.

**Plan de validación:**

- En PASS-002, aplicar esta hipótesis a dos KI distintos (probablemente `LAYOUT-page-shell.md` más otro que surja naturalmente del cambio de PASS-002).
- Medir si los KI aplicando la hipótesis son descubiertos sin que nadie se acuerde manualmente de ellos.
- Si funcionan en PASS-002, repetir en PASS-003. Si sobrevive dos Pass de tipos distintos de cambio (bug, feature, refactor, auditoría), proponer formalmente la evolución del template del PKS. Hasta entonces, queda como hipótesis experimental registrada en PASS, no como metodología.

### Aprender, Preservar, Retrospectiva

**Pendientes hasta Fase 3 del experimento.**

Candidatos preliminares (se filtran después del experimento):

- PageShell ahora soporta error dismissible → potencial KI de patrón "compartido extensible".
- IVA es dead code en PosWeb → potencial ADR.
- VentasPage duplica el formulario de cliente nuevo → potencial refactor candidato para Pass futura.

### Referencias

- Files edited: `frontend/src/components/shared/PageShell.tsx`, `frontend/src/pages/ClientesPage.tsx`.
- KI previos relevantes no consultados: `LAYOUT-page-shell.md`.
- Documento relacionado: `docs/PROJECT_COMPANION.md` (modificado durante la Pass; principio "Carga mínima" incorporado).
- Heurística de scoring (creación pendiente): `docs/passes/heuristicas/scoring-seleccion-de-cambio-v0.md`.