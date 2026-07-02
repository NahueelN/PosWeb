# Project Knowledge System (PKS)

> El cerebro vivo de PosWeb.

---

# Idea fundamental

**El código representa la implementación. El Project Knowledge System representa la intención.**

El código explica **cómo** funciona PosWeb. El PKS explica **por qué** funciona así.

El PKS responde:

- ¿Por qué está construido de esa manera?
- ¿Qué problema resuelve cada componente?
- ¿Cuándo debe reutilizarse? ¿Cuándo NO?
- ¿Qué decisiones arquitectónicas llevaron a esa implementación?
- ¿Qué reglas de negocio deben respetarse?
- ¿Qué patrones forman parte del estándar del proyecto?

Si algún día todo el código tuviera que reescribirse desde cero, el PKS debería contener suficiente conocimiento como para reconstruir la misma arquitectura sin perder las decisiones que hicieron crecer al proyecto.

La implementación, las tecnologías y los frameworks pueden cambiar. El conocimiento del proyecto debe permanecer. Ese es el verdadero activo.

El PKS no reemplaza al código. Lo complementa. Ambos deben permanecer sincronizados durante toda la vida del proyecto. Cuando exista una diferencia, deberá considerarse una inconsistencia que debe revisarse.

---

# Qué es y qué no es

**No es** un conjunto de Markdown, un manual, ni documentación tradicional. No reemplaza el código. No pretende documentar absolutamente todo.

**Es** una representación del conocimiento del proyecto. Cada documento es una pieza importante del conocimiento de PosWeb. A ese documento lo llamamos **Knowledge Item**.

La Base de Conocimiento será la fuente oficial de arquitectura, componentes, reglas de negocio, patrones y decisiones de diseño. Deberá poder ser utilizada por OpenCode, ChatGPT, Claude, Cursor, un CLI propio, un MCP propio, un AI Project Architect, y cualquier herramienta futura.

La documentación debe estar pensada tanto para personas como para herramientas automatizadas.

---

# Filosofía

El conocimiento vale más que el código. El código puede reescribirse. Las decisiones arquitectónicas no.

Cada vez que el proyecto aprende algo importante, ese conocimiento debe poder preservarse. No queremos depender de la memoria de los desarrolladores. Queremos que el proyecto recuerde por sí mismo.

---

# Principios

## 1. Registrar solamente conocimiento importante

No registrar código trivial.

## 2. Registrar únicamente lo que aporta contexto

No repetir lo que ya explica claramente el código.

## 3. Evolucionar junto con el proyecto

Nunca quedar desactualizada.

## 4. Toda incorporación debe ser una decisión consciente

Nunca registrar conocimiento automáticamente. Siempre preguntar.

## 5. La simplicidad tiene prioridad

No agregar complejidad innecesaria.

## 6. Pensar siempre en reutilización

Todo componente reutilizable merece ser evaluado.

## 7. Automatizar sobre simplificar

Antes de eliminar una estructura por considerarla compleja, responder: ¿es posible automatizar esa complejidad? Si la respuesta es sí, la automatización tendrá prioridad. La estructura sólo deberá simplificarse cuando la automatización no sea una solución razonable.

## 8. Validación por uso

La infraestructura del PKS no evolucionará por especulación. Toda modificación importante deberá surgir de la utilización real del sistema. Los Knowledge Items serán el mecanismo principal para validar la calidad de la arquitectura. No se optimizarán problemas hipotéticos. Se optimizarán problemas observados.

## 9. El conocimiento es un activo del proyecto

Cada decisión importante deberá poder recuperarse años después. El conocimiento será tratado como un activo del proyecto. Nunca como un activo de las personas.

---

# Principio de Captura Progresiva

El conocimiento no nace estructurado. Primero se captura. Después madura. Recién cuando demuestra valor se convierte en conocimiento oficial.

```
Desarrollo
    ↓
Knowledge Detected
    ↓
Resumen automático
    ↓
Usuario aprueba guardar
    ↓
Engram Entry
    ↓
(reutilización / evidencia)
    ↓
Knowledge Candidate
    ↓
Usuario aprueba
    ↓
Knowledge Item
    ↓
(si corresponde)
    ↓
Canonical
```

Cada etapa exige menos esfuerzo de captura y más esfuerzo de estructura. El costo de avanzar de etapa siempre lo absorbe el Knowledge Curator, nunca el desarrollador. El desarrollador únicamente aprueba o rechaza. Nunca escribe desde cero.

Forzar estructura completa desde el primer momento es la principal causa de abandono de cualquier sistema de documentación. El PKS exige estructura completa solo cuando el conocimiento ya demostró que vale la pena estructurarlo.

---

# Organización

```
docs/
    PROJECT_KNOWLEDGE_SYSTEM.md    ← manifiesto
    PKS_PROPOSALS.md               ← propuestas e ideas no consolidadas

    registry/                      ← índices (Markdown + JSON autogenerado)
    templates/                     ← templates oficiales de Knowledge Items
    knowledge/                     ← Knowledge Items
        core/                      ← nivel Core
        domains/pos/               ← nivel Domain
        projects/posweb/           ← nivel Project
    standards/                     ← estándares globales del proyecto
    glossary/                      ← términos oficiales
    engram/                        ← incubadora de conocimiento
```

---

# Componentes del sistema

## Registry

Contiene índices que permiten localizar rápidamente el conocimiento disponible. Debe ser la primera fuente consultada por cualquier IA.

Existen dos formatos complementarios: Markdown (legible por humanos) y JSON (autogenerado por el Knowledge Curator para herramientas e IAs, nunca editado manualmente).

## Knowledge Items

Cada archivo en `knowledge/` representa una única pieza importante del conocimiento del proyecto. Se organizan en tres niveles: Core, Domain y Project.

Ejemplos: `COMP-cart-host.md`, `PAT-cart-flow.md`, `BUS-reglas-venta.md`, `ADR-auth-flow.md`, `FLOW-venta.md`

## Templates

Definen la estructura oficial de cada tipo de Knowledge Item. No debe haber documentos con formatos distintos. Reducir templates no es el objetivo; el objetivo es reducir lo que la persona completa a mano. Cada template incluye un campo Template Version para detectar documentos desactualizados.

## Engram

Engram no es una carpeta de notas. Es la incubadora del conocimiento. Todo conocimiento nuevo nace en el Engram: sin estructura, sin metadata, sin formato oficial. Ideas, contexto, conversaciones, investigaciones. No representa conocimiento oficial.

Cuando el Knowledge Curator detecta conocimiento nuevo durante el desarrollo, muestra un resumen corto y pregunta si el usuario quiere guardarlo. El usuario únicamente aprueba o rechaza. Una entrada del Engram permanece ahí hasta que demuestre evidencia de reutilización o valor real. Sólo entonces podrá proponerse como Knowledge Candidate.

## Glosario

Define términos oficiales utilizados dentro del proyecto. Ejemplo: Venta, Compra, Combo, Scanner, Carrito, Monto recibido.

## Standards

Estándares globales del proyecto: coding standards, naming conventions, UX guidelines, testing guidelines, accessibility guidelines, git workflow, review checklist, etc. No son Knowledge Items pero utilizan el mismo sistema de templates y metadata.

---

# Tipos de Knowledge Item

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
| Standard | `STAND-` | Estándar global del proyecto |
| Glossary | `GLOSSARY-` | Término oficial del proyecto |

Si en el futuro aparece un nuevo tipo, podrá incorporarse. Todo Knowledge Item tiene un identificador permanente con el formato `{PREFIJO}-{nombre}`. No debe depender nunca del nombre del archivo.

---

# Metadata

Todo Knowledge Item comparte una estructura común de metadata. Los campos se dividen en dos grupos según quién los completa.

**Automáticos** (el Knowledge Curator los infiere y completa):

- `Created` / `Updated`
- `Sources`
- `Tags` (desde vocabulario controlado)
- `Type`
- Relaciones
- Registro en el Registry

**Manuales** (los completa la persona, porque ningún sistema puede inferirlos):

- `Overview` (qué es y por qué existe)
- `When to use` / `When NOT to use`
- `Rules` (invariantes, restricciones)
- Consideraciones específicas del tipo

El objetivo es que quien escribe un Knowledge Item dedique su esfuerzo únicamente a lo que solo una persona puede aportar: el por qué, el cuándo y el cuándo no. Todo lo que pueda inferirse del código, del historial o del contexto, lo completa el Curator.

No se implementará un archivo `_metadata.yaml` separado. Se prefiere una pequeña duplicación dentro del propio template antes que introducir una capa adicional de complejidad. Los templates deben seguir siendo autoexplicativos, legibles de punta a punta sin depender de otro archivo.

## Campos obligatorios

| Campo | Valores |
|-------|---------|
| `ID` | `{PREFIJO}-{nombre}` |
| `Type` | Uno de los tipos definidos |
| `Name` | Texto libre |
| `Status` | `Draft`, `Active`, `Canonical`, `Deprecated` |
| `Priority` | `Critical`, `High`, `Medium`, `Low` |
| `Level` | `Core`, `Domain`, `Project` |
| `Sources` | Lista de paths relativos al repo |
| `Template Version` | Versión del template usado |
| `Created` | ISO 8601 |
| `Updated` | ISO 8601 |

## Status

Canonical no es un tipo de Knowledge Item. Es un valor de Status. Un Knowledge Item alcanza el estado Canonical cuando se promueve a Patrón Canónico.

| Status | Significado |
|--------|-------------|
| `Draft` | En elaboración. No es conocimiento oficial. |
| `Active` | Conocimiento vigente y verificado. |
| `Canonical` | Forma oficial de construir ese tipo de funcionalidad. Toda implementación futura debe reutilizarlo salvo justificación. |
| `Deprecated` | Reemplazado o en desuso. Se preserva por contexto histórico. |

## Sources

Cada Knowledge Item mantiene un campo Sources con una lista simple de paths. Sin prefijos ni tipos. El Knowledge Curator podrá inferir el tipo de cada fuente según la ubicación del archivo. No agregar complejidad innecesaria a este campo.

## Campos opcionales

Se agregan solo cuando aportan valor. Nunca automáticamente. Siempre consultar.

- `Confidence` — `High`, `Medium`, `Low`
- `Review Required` — `true` si una IA debe consultar antes de reutilizar
- `Owner` — `Core`, `UX`, `Business`, `Shared`, `Infrastructure`
- `Deprecates` — ID del Knowledge Item reemplazado
- `Deprecated By` — ID del Knowledge Item que lo reemplaza
- `Tags` — Vocabulario controlado. El Curator completa, no se inventa libremente.

## Tags: vocabulario controlado

Nuevos tags solo se incorporan con aprobación humana.

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

## Campos eliminados

Estos campos fueron evaluados y descartados:

- **Historial** — Git ya cumple esa función.
- **Dónde se usa actualmente** — Se infiere del grafo de relaciones. No se mantiene a mano.
- **Variantes por defecto** — Generan mantenimiento sin uso real. Si una variante demuestra valor, se documenta como su propio Knowledge Item.
- **Stability** — Redundante con Status.
- **Version** — Sin semántica definida. `Updated` y `Template Version` cubren la trazabilidad.

---

# Relaciones

Los Knowledge Items forman un grafo. No son documentos aislados.

| Relación | Significado |
|----------|-------------|
| `USES` | Utiliza al item destino |
| `IMPLEMENTS` | Implementa el estándar definido por el destino |
| `DEPENDS_ON` | Requiere al item destino para funcionar |
| `RESPECTS` | Respeta la regla de negocio del destino |
| `RELATED` | Relación conceptual sin dependencia técnica |
| `EXTENDS` | Extiende el concepto base con reglas adicionales |
| `REPLACES` | Reemplaza al item destino |
| `DEPRECATES` | Este item depreca al destino |
| `DEPRECATED_BY` | Este item es deprecado por el destino |
| `INSPIRED_BY` | Inspirado en el item destino |

Esto permite navegar toda la arquitectura.

---

# Niveles de conocimiento

Todo conocimiento pertenece a uno de tres niveles:

| Nivel | Significado | Directorio |
|-------|-------------|------------|
| `Core` | Reutilizable por cualquier proyecto de software | `knowledge/core/` |
| `Domain` | Reutilizable dentro de un dominio específico (POS, ERP, CRM, etc.) | `knowledge/domains/pos/` |
| `Project` | Exclusivo de PosWeb | `knowledge/projects/posweb/` |

El conocimiento siempre comienza como Project. Sólo será promovido cuando exista evidencia suficiente de reutilización. Nunca se generalizará una solución de forma anticipada. Toda abstracción deberá surgir como consecuencia del uso. Las abstracciones deberán descubrirse, no inventarse.

---

# Knowledge Filter

No se usará un puntaje numérico. Antes de proponer un Knowledge Candidate, el Knowledge Curator deberá responder tres preguntas:

- ¿Se reutiliza?
- ¿No es evidente leyendo el código?
- ¿Reconstruirlo costaría tiempo real?

Si al menos dos respuestas son "Sí", el Curator propondrá un Knowledge Candidate. Si no, sugerirá únicamente guardarlo en el Engram. No se usarán fórmulas ni puntajes. La decisión final siempre será humana.

## Excepción al flujo de captura

Si el Knowledge Curator detecta una decisión claramente importante —una ADR, un patrón reutilizable, una decisión de arquitectura o una regla crítica de negocio— podrá proponer directamente un Knowledge Item, sin pasar primero por el Engram.

En ese caso deberá justificar explícitamente por qué se salta la incubación. Esta excepción no reemplaza el Knowledge Filter para el resto de los casos. Es únicamente para conocimiento cuya importancia es evidente desde el momento en que se detecta.

---

# Forma de trabajar

Cuando un desarrollo termine:

1. Analizar los cambios realizados.
2. Detectar conocimiento nuevo.
3. Aplicar el Knowledge Filter (o la Excepción, si corresponde).
4. Preguntar.
5. Si se acepta, actualizar la Base de Conocimiento en la etapa correspondiente del ciclo de vida.

## Sincronización

Cuando un componente ya documentado cambie, deberá verificarse si su documentación sigue siendo correcta. Si deja de representar la realidad del código deberá proponerse su actualización. Nunca modificar automáticamente.

---

# Canonical Patterns

Un Patrón Canónico representa la forma oficial de construir un determinado tipo de funcionalidad dentro del proyecto. No describe cómo está implementado el proyecto hoy. Establece el estándar para todas las implementaciones futuras.

Cuando una IA deba crear una nueva funcionalidad, deberá consultar primero si existe un Patrón Canónico compatible. Si existe, deberá utilizarlo como punto de partida. Sólo podrá proponer una implementación diferente cuando no exista un Patrón Canónico aplicable, exista una justificación técnica suficiente, o el usuario apruebe una nueva dirección arquitectónica.

## Evolución de los patrones

Todo patrón nace describiendo una implementación existente. Cuando una solución demuestra ser reutilizable y consistente en distintos contextos, podrá promoverse a Patrón Canónico. La promoción siempre requerirá aprobación humana. No todos los patrones deberán convertirse en canónicos. Sólo aquellos que representen la mejor forma conocida de resolver un problema recurrente.

Cuando un mismo tipo de funcionalidad aparezca repetidamente, deberá evaluarse la creación de un Patrón Canónico. El objetivo es que todas las implementaciones futuras compartan: arquitectura, estructura visual, componentes reutilizados, comportamiento, navegación, accesibilidad, flujo de teclado, diseño visual, y reglas de negocio relacionadas.

El conocimiento deberá evolucionar hacia estándares cada vez más consistentes. Cada Patrón Canónico fortalece la identidad visual, funcional y arquitectónica del proyecto.

## Canonical Pattern Checklist

Todo Patrón Canónico deberá definir, cuando corresponda: objetivo, problema que resuelve, cuándo utilizarlo, cuándo NO utilizarlo, estructura recomendada, componentes obligatorios y opcionales, flujo de navegación y teclado, reglas de negocio relacionadas, Design System aplicable, accesibilidad, ejemplos reales, implementaciones existentes, buenas prácticas y errores comunes. El nivel de detalle dependerá del tipo de patrón. No todos los campos serán obligatorios.

## Criterio de calidad para Patterns

Cada Pattern debe poder leerse en menos de 5 minutos y proporcionar el conocimiento suficiente para implementar correctamente una nueva funcionalidad del mismo tipo sin necesidad de recorrer el código fuente.

Un Pattern no debe intentar documentar toda la implementación. Debe responder únicamente las decisiones que una persona o una IA necesita conocer para construir una implementación consistente con el proyecto.

Si un Pattern obliga a leer el código para entender cómo reutilizarlo, está incompleto. Si un Pattern solo repite lo que ya dice el código, está aportando poco valor.

Este criterio deberá utilizarse como control de calidad para todos los PAT-* futuros.

## Criterio de calidad para ADRs

Un ADR nunca debe explicar cómo funciona una implementación. Debe explicar por qué esa implementación existe, qué alternativas fueron evaluadas, qué trade-offs se aceptaron y bajo qué condiciones debería reconsiderarse.

Este criterio deberá utilizarse como control de calidad para todos los ADR-* futuros.

## Criterio de calidad para Business Rules

Antes de crear cualquier Business Rule, responder: "¿Estoy modelando un proceso o un concepto del dominio?" Siempre que sea posible, modelar conceptos. Los procesos deberán reutilizar esos conceptos mediante relaciones. El PKS debe representar el dominio del negocio, no la estructura de las pantallas.

Antes de crear un nuevo Knowledge Item, preguntarse siempre: "¿Existe un concepto más general al que realmente pertenece este conocimiento?" Si existe, proponer primero ese concepto. Solo crear documentos específicos cuando el conocimiento no pueda abstraerse sin perder claridad.

Este criterio deberá utilizarse como control de calidad para todos los BUS-* futuros.

## Principio de modelado del dominio

Los Knowledge Items deben modelar primero conceptos del dominio y luego procesos. Las implementaciones reutilizan conceptos. Los conceptos nunca deben depender de implementaciones concretas.

## Principio de clasificación previa

Antes de crear cualquier Knowledge Item, el Curator debe clasificar el conocimiento:

- ¿Es una política del proyecto? → `STAND-*`
- ¿Es una decisión arquitectónica? → `ADR-*`
- ¿Es un patrón reutilizable? → `PAT-*`
- ¿Es una regla del negocio? → `BUS-*`
- ¿Es una estructura visual? → `LAYOUT-*`
- ¿Es un componente reutilizable? → `COMP-*`

Cuando un Knowledge Item mezcle implementación y política, deberá dividirse. Los Standards describen **qué**, **cuándo** y **por qué**. Los Layouts, Components y Patterns describen **cómo**. Nunca mezclar ambos. Cada Knowledge Item debe tener una única responsabilidad.

---

# Modo PKS

El Modo PKS es un estado de sesión que activa automáticamente el workflow del PKS para todas las solicitudes de desarrollo.

## Activación

Cuando el usuario escribe `Modo PKS`, la IA responde `✅ Modo PKS activado.` y a partir de ese momento aplica automáticamente el AI Workflow, Knowledge Curator, Knowledge Filter y Discard Filter en cada solicitud de implementación, auditoría, investigación, revisión, refactor o análisis. No requiere repetir instrucciones.

## Desactivación

Cuando el usuario escribe `Modo normal`, la IA responde `✅ Modo PKS desactivado.` y vuelve al comportamiento estándar sin aplicar automáticamente el workflow del PKS.

## Reglas

- El modo permanece activo durante toda la sesión.
- No debe preguntarse nuevamente si el usuario quiere usar el PKS.
- No modifica el funcionamiento del PKS — solo el comportamiento de la sesión.
- Es compatible con cualquier herramienta que soporte el PKS.
- En el futuro, herramientas como OpenCode podrían mostrar un indicador visual (`PKS: ON`) cuando el modo esté activo.

---

# AI Workflow

Toda IA que participe del desarrollo deberá seguir este flujo.

## Antes de desarrollar

1. Leer el PKS.
2. Consultar el Registry.
3. Buscar Patrones Canónicos aplicables.
4. Buscar componentes reutilizables.
5. Buscar reglas de negocio relacionadas.
6. Buscar ADR relevantes.
7. Identificar Knowledge Items relacionados.
8. Analizar el código actual.

Recién después podrá proponer una implementación. Nunca deberá asumir que la mejor solución es crear un componente nuevo. Primero deberá verificar si ya existe una solución equivalente.

## Durante el desarrollo

La IA deberá detectar automáticamente: nuevos componentes, nuevos patrones, nuevas reglas de negocio, nuevas decisiones arquitectónicas, cambios importantes en componentes existentes, y posibles reutilizaciones.

Durante esta etapa nunca modificará el PKS. Únicamente recopilará información.

## Al finalizar

1. Analizar el diff.
2. Detectar conocimiento nuevo.
3. Aplicar el Knowledge Filter.
4. Determinar si el PKS debería actualizarse.
5. Proponer los cambios al usuario.

La actualización del PKS siempre requerirá aprobación humana.

## Principio de mínimo mantenimiento

El costo de mantener el PKS debe tender a cero. El usuario nunca debería escribir documentación manualmente. El sistema deberá detectar automáticamente nuevo conocimiento. El usuario únicamente validará, corregirá o ampliará la información cuando sea necesario.

Si mantener el PKS requiere trabajo repetitivo, el sistema está mal diseñado. El objetivo no es automatizar la documentación. El objetivo es automatizar la captura del conocimiento.

---

# Knowledge Curator

El Knowledge Curator es el responsable de mantener viva la Base de Conocimiento. Su función: analizar cambios, detectar conocimiento nuevo, identificar patrones, detectar reutilización, sugerir actualizaciones, y mantener sincronizado el PKS.

Nunca tomará decisiones automáticamente. Siempre propondrá. El usuario tendrá la decisión final.

## Flujo de decisión

Una investigación no siempre termina creando un Knowledge Item.

```
Código
    ↓
Investigación
    ↓
¿Se descubrió conocimiento?

├── No → Finalizar.

└── Sí
        ↓
    ¿Existe suficiente evidencia?

    ├── No → Propuesta o Architectural Gap (PKS_PROPOSALS.md)

    └── Sí
            ↓
        ¿Ya existe un Knowledge Item?

        ├── Sí → Actualizarlo.

        └── No → Crear uno nuevo.
```

## Architectural Gap

Un Architectural Gap representa una oportunidad de mejora detectada por el Curator. No es un Pattern, un ADR, una Business Rule, ni un Standard. Es evidencia de que el proyecto todavía no posee un patrón, una decisión o una abstracción suficientemente madura.

Su objetivo es preservar ese descubrimiento sin inventar conocimiento. Debe registrarse en `PKS_PROPOSALS.md`. Puede promoverse a un Knowledge Item únicamente cuando exista evidencia suficiente.

Ejemplos: ausencia de un patrón reutilizable, duplicación importante, arquitecturas divergentes, oportunidades de unificación, deuda arquitectónica.

## Resultados de una investigación

- Crear un nuevo Knowledge Item.
- Actualizar un Knowledge Item existente.
- Registrar una propuesta en `PKS_PROPOSALS.md`.
- Registrar un Architectural Gap.

El PKS debe representar la realidad del proyecto. Nunca debe crear documentos para completar categorías.

## Resumen de cambios

Todo informe de implementación debe comenzar con un listado conciso de archivos modificados y el cambio funcional realizado en cada uno. El objetivo es que en menos de 10 segundos pueda entenderse el alcance real de la implementación.

Formato:

> **Resumen de cambios**
>
> ✔ `path/to/file.ts`
>   - Cambio funcional realizado.
>   - Otro cambio en el mismo archivo.
>
> ✔ `path/to/other.tsx`
>   - Cambio funcional realizado.

Reglas:

- Solo archivos efectivamente modificados durante la ejecución. No listar archivos leídos o inspeccionados.
- Máximo 2 o 3 líneas descriptivas por archivo. Describir el cambio funcional, no el detalle del código.
- Si no hubo modificaciones (auditoría sin implementación), no mostrar esta sección.
- El listado debe coincidir exactamente con los archivos modificados.

Esta sección aparece al comienzo del informe, antes del resto del reporte del Knowledge Curator.

## Resultado de la consulta al PKS

Al finalizar una implementación o auditoría, el Knowledge Curator evaluará si el PKS contenía conocimiento relevante para las decisiones tomadas. Consultar el PKS y determinar que no existe conocimiento específico para un caso también es un resultado válido del sistema.

### Cuando el PKS contiene conocimiento relevante

Se agrega la sección:

> **Conocimiento aplicado del PKS**
>
> Listar únicamente los Knowledge Items que influyeron en la decisión. No listar por listar. Justificar brevemente cómo ayudó cada uno.

### Cuando el PKS no contiene conocimiento específico

Se reporta:

> **Resultado del PKS**
>
> ✓ PKS consultado. No existe conocimiento específico registrado para esta decisión. La implementación se realizó utilizando buenas prácticas generales. No fue necesario incorporar nuevo conocimiento al PKS.

No deben usarse expresiones como "Valor generado: Ninguno" o "El PKS no aportó nada" — transmiten una idea incorrecta del sistema. El PKS cumplió su función al confirmar la ausencia de conocimiento específico.

### Cuando no hubo contribución del PKS ni apareció conocimiento nuevo

El informe termina con:

> **El PKS no requiere actualización.**

Sin secciones adicionales. Sin ruido.

## Registro de decisiones de descarte

Cuando una mejora es analizada y descartada por una decisión fundamentada —no por dificultad técnica, sino por razones de dominio, UX, operación o evidencia de uso— el Knowledge Curator evaluará si esa decisión merece preservarse.

Si la mejora descartada probablemente volvería a aparecer en auditorías futuras, se registra en `PKS_PROPOSALS.md` como **Propuesta descartada**, indicando: estado, origen, motivo del descarte y condición para reevaluar.

No se registran descartes triviales. Solo aquellos que evitarán que futuras auditorías vuelvan a discutir el mismo tema.

Esto extiende "Resultados de una investigación" con un quinto caso:

- Crear un nuevo Knowledge Item.
- Actualizar un Knowledge Item existente.
- Registrar una propuesta activa.
- Registrar un Architectural Gap.
- Registrar una decisión de descarte.

## Discard Filter

Antes de registrar una decisión de descarte, el Knowledge Curator debe responder tres preguntas:

- ¿Esta mejora probablemente volverá a aparecer en futuras auditorías?
- ¿El motivo del descarte responde a una decisión de dominio, arquitectura, UX o evidencia de uso (y no simplemente a una limitación temporal)?
- ¿Registrar esta decisión evitará rediscutir el mismo tema en el futuro?

Solo si las tres respuestas son afirmativas deberá registrarse. Si no, la decisión simplemente se descarta y no se conserva. El PKS no almacena descartes triviales.

---

# Estado del proyecto

El PKS evolucionará por etapas. Cada etapa deberá demostrar valor antes de avanzar a la siguiente.

Estado actual:

- [x] Filosofía
- [x] Arquitectura de carpetas
- [x] Organización
- [x] Templates oficiales
- [x] Registry (Markdown)
- [x] Convenciones
- [x] Tipos de Knowledge Items
- [x] Metadata y relaciones
- [x] Principio de Captura Progresiva
- [x] Engram como incubadora
- [x] Knowledge Filter

- [ ] Registry Estructurado (JSON autogenerado)
- [ ] Knowledge Items
- [ ] Knowledge Curator automatizado
- [ ] Knowledge Quality Gate
- [ ] CLI
- [ ] MCP
- [ ] AI Project Architect

## Fase actual

La infraestructura del PKS se considera **estable y congelada**. Los cambios futuros deberán estar justificados por experiencia de uso real. La arquitectura deja de evolucionar por hipótesis y pasa a evolucionar por evidencia.

**Trabajo en curso**: creación de Knowledge Items reales.

Toda mejora propuesta deberá: registrar el problema real que resuelve, indicar cuántas veces apareció, y justificar por qué la infraestructura actual no alcanza. Sólo después será evaluada.

## Estabilidad del manifiesto

El manifiesto solo se modifica cuando una mejora aparece al menos dos veces durante el uso real del PKS. Esto mantiene el documento estable y evita que crezca por ideas teóricas.

---

# Principio de consistencia

Toda nueva funcionalidad deberá parecer una evolución natural del proyecto. Nunca una excepción. El usuario debe percibir que todas las pantallas pertenecen al mismo sistema.

La reutilización no es únicamente una optimización técnica. Es parte de la identidad visual, funcional y arquitectónica del proyecto.

---

# Manifiesto

No estamos construyendo documentación. No estamos construyendo un MCP. No estamos construyendo un CLI. No estamos construyendo otra herramienta de IA.

Estamos construyendo la memoria permanente del proyecto.

Queremos capturar el conocimiento que normalmente vive únicamente en la cabeza de los desarrolladores. Cada componente reutilizable, cada patrón, cada decisión arquitectónica, cada regla de negocio, cada estándar de UX, cada aprendizaje. Todo aquello que hace que PosWeb sea PosWeb.

Nuestro objetivo es que, dentro de diez años, cualquier desarrollador o inteligencia artificial pueda entender el proyecto, respetar su arquitectura y continuar su evolución sin perder el conocimiento acumulado durante su construcción.

El código cambiará. Las tecnologías cambiarán. Los frameworks cambiarán. Las herramientas cambiarán. Pero el conocimiento del proyecto debe permanecer.

El conocimiento no nace estructurado: se captura, madura, y solo se vuelve oficial cuando demuestra valor real. Ese es el Principio de Captura Progresiva.

La complejidad de capturar, estructurar y mantener ese conocimiento la absorbe el Knowledge Curator, nunca la persona. El desarrollador dedica su tiempo a generar conocimiento, no a sostener la infraestructura que lo guarda.

La infraestructura del PKS no evoluciona por hipótesis. Evoluciona por evidencia de uso real, etapa por etapa.

El Project Knowledge System será la fuente oficial de ese conocimiento. No es una herramienta de documentación. Es el sistema que garantiza que el conocimiento del proyecto sobreviva a las personas, las tecnologías y el tiempo.
