# Project Companion

> El sistema que acompaña el ciclo de vida del conocimiento de un proyecto de software.
> Independiente del dominio, la tecnología, la metodología y la forma de persistencia.

---

## Qué es y qué no es

Project Companion no es un científico. No es un sistema cuyo objetivo sea *descubrir* conocimiento.

Project Companion es un **ingeniero**. Su objetivo es acompañar el desarrollo de software, asegurando que el conocimiento que el proyecto necesita esté disponible cuando hace falta, y que el conocimiento que se pierde al rotar gente o al reescribir código no se pierda de verdad.

El conocimiento no es el centro. **El desarrollo de software es el centro.** El conocimiento gira alrededor del desarrollo, no al revés.

---

## Principio: Carga mínima

> Ningún artefacto debe obligar a cargar más contexto del necesario.

_tokens son un recurso de ingeniería igual que CPU, memoria o almacenamiento. Una metodología que necesita leer cien archivos para resolver una tarea sencilla no escala, sin importar cuán correcta sea su teoría.

Todo artefacto del sistema se estructura en **dos niveles de lectura**:

- **Resumen canónico** — un mínimo de información que permite retomar el trabajo o decidir si el detalle es necesario. Carga por defecto.
- **Detalle expandible** — todo lo demás. Carga bajo demanda.

Esto aplica a: `PROJECT_COMPANION.md`, Knowledge Items, PASS, ADR, Standards, y cualquier artefacto nuevo que el sistema agregue.

No es una optimización de tokens. Es un principio de diseño. Un artefacto que mezcla resumen y detalle obliga al lector a cargar el todo para obtener la parte.

> Aplicación de este principio al propio `PROJECT_COMPANION.md`: pendiente. El documento todavía está en forma lineal. La refactorización a dos niveles se hará cuando una Pass lo demande por fricción, no por adelanto.

---

## Cómo evoluciona este documento

Project Companion no se perfecciona escribiendo teoría aislada. Se perfecciona resolviendo problemas reales mientras se desarrolla software.

PosWeb es el laboratorio permanente. Cada mejora de la aplicación es una pasada del ciclo completo (Comprender → Diseñar → Construir → Aprender → Preservar → Retrospectiva) ejecutada con la metodología.

Durante cada tarea se distinguen dos clases de problemas:

- **Problema del proyecto** (específico de PosWeb): se resuelve actualizando el PKS.
- **Problema de la metodología** (cómo se desarrolla cualquier proyecto): se resuelve actualizando este documento.

Al cerrar cada tarea hay una retrospectiva obligatoria con dos preguntas:

1. ¿Qué aprendimos sobre PosWeb? → PKS.
2. ¿Qué aprendimos sobre cómo desarrollar mejor un proyecto? → PROJECT_COMPANION.md.

Señal de madurez: si la metodología permanece estable a lo largo de varias tareas, Project Companion está madurando. Si hay que cambiarla constantemente, todavía no encontramos el modelo correcto.

No más teoría desconectada. Toda evolución de este documento se origina en una fricción real encontrada durante una tarea.

### Régimen de pasadas

Toda mejora de la aplicación se ejecuta como una **Pass**. Una Pass recorre el ciclo completo:

```
Trigger → Comprender → Diseñar → Construir → Aprender → Preservar → Retrospectiva
```

Cada Pass tiene id (PASS-001, PASS-002, ...), trigger (la tarea real que la origina), y bitácora de cada etapa con una evaluación local: ¿la metodología fue suficiente?, ¿faltó información?, ¿sobró algún paso?, ¿hubo fricción?, ¿la transición a la siguiente etapa fue natural?

La especificación completa de la estructura, principios y campos de PASS está en `docs/passes/PASS-V1.md`.

La retrospectiva es obligatoria y responde exactamente dos preguntas:

1. ¿Qué aprendimos sobre PosWeb? → actualiza el PKS si corresponde.
2. ¿Qué aprendimos sobre cómo desarrollar mejor cualquier proyecto? → actualiza este documento si corresponde.

Si ninguna de las dos respuestas aporta algo nuevo, no se modifica ningún documento. La madurez de Project Companion se mide por estabilidad a través de varias pasadas, no por volumen de cambios por pasada.

Separación de fuentes (no negociable):

- **PKS** captura conocimiento específico del proyecto (PosWeb).
- **PROJECT_COMPANION.md** captura conocimiento sobre la ingeniería de desarrollar cualquier proyecto.

Confundir las dos contamina ambos documentos. Lo específico del proyecto se trata en Pass; lo generalizable va a retrospectiva.

---

## Protocolo de Activación del Companion (OBLIGATORIO)

Regla obligatoria del Project Companion. Se activa cada vez que el Companion inicia una tarea de implementación tras `project init` o el comando de activación equivalente.

El Companion **no puede modificar ningún archivo de código** sin haber completado este protocolo y presentado el resumen de validación.

### Orden obligatorio

```
1. PASS Discovery
2. Code Discovery (OBLIGATORIO)
3. PKS Discovery (solo si aplica)
4. Pattern Discovery
5. Propuesta
6. Confirmación del usuario
7. Implementación
```

### 1. PASS Discovery

Si existe una PASS activa relacionada con el trabajo:

- leerla;
- comprender el objetivo;
- comprender el contexto;
- identificar decisiones abiertas;
- identificar el próximo paso recomendado.

Si no existe PASS activa, continuar.

### 2. Code Discovery (OBLIGATORIO)

Antes de proponer cualquier modificación, el Companion debe entender la implementación actual respondiendo explícitamente:

- ¿Dónde está implementado el comportamiento actual?
- ¿Cómo funciona hoy?
- ¿Qué componente o sección de código controla ese comportamiento?
- ¿Por qué ocurre el comportamiento actual?

No modificar todavía. Este paso no puede saltarse.

### 3. PKS Discovery (solo si aplica)

No se ejecuta automáticamente. Solo cuando durante Code Discovery se detecte evidencia de que el PKS puede afectar la implementación. Por ejemplo:

- reglas de negocio documentadas;
- decisiones arquitectónicas;
- Standards;
- Knowledge Items;
- restricciones funcionales;
- decisiones de UX previamente documentadas.

Si existe evidencia, buscar únicamente los Knowledge Items relacionados con el módulo o dominio afectado. No cargar el PKS completo.

Si no existe evidencia, continuar directamente.

### 4. Pattern Discovery

Buscar implementaciones equivalentes dentro del proyecto. Verificar si ya existe:

- componente similar;
- patrón similar;
- validación similar;
- comportamiento similar.

Si existe:

- reutilizarlo; o
- justificar por qué no aplica.

Encontrar un patrón no obliga a refactorizar. El refactor siempre debe evaluarse según el objetivo de la PASS actual.

### 5. Propuesta

Con toda la información recopilada, el Companion presenta una propuesta de modificación que describe qué cambiar y por qué.

### 6. Confirmación del usuario

Cuando corresponda, el Companion espera la confirmación del usuario antes de comenzar la implementación. La decisión final pertenece al desarrollador.

### 7. Implementación

Recién después de completar los pasos anteriores y obtener confirmación, comenzar la implementación.

### Validación obligatoria

Antes de modificar el primer archivo, el Companion debe mostrar un resumen de las etapas realizadas en este formato:

```
PASS Discovery
✓ PASS-003 activa
o
— Sin PASS activa

Code Discovery
✓ Explicación breve del comportamiento actual.

PKS Discovery
✓ Knowledge Items encontrados y utilizados
o
— No aplica (explicar por qué)

Pattern Discovery
✓ Patrones encontrados y decisión tomada
o
— No existen patrones equivalentes
```

Solo después de mostrar este resumen puede comenzar la implementación.

### Principios

- **Carga mínima**: nunca cargar todo el PKS. La búsqueda debe ser incremental y guiada por relevancia.
- **Reutilización primero**: antes de crear algo nuevo, verificar si ya existe.
- **Consistencia entre módulos**: evitar implementar soluciones diferentes para el mismo problema.
- **Progresión guiada**: si un paso no produce información útil, continuar inmediatamente con el siguiente.
- **Justificación breve**: el Companion debe informar qué conocimiento encontró y cómo influyó (o no) en la implementación.
- **Validación visible**: no alcanza con ejecutar el protocolo — el Companion debe demostrar que lo ejecutó mostrando el resumen antes de modificar código.

Este protocolo no modifica las etapas del ciclo. Es el comportamiento obligatorio del Companion al activarse para cualquier implementación (bug, feature, refactor, mejora UX, auditoría, etc.).

---

## La columna vertebral

Siete etapas. No son estrictamente secuenciales —se retroalimentan— pero tienen un orden natural: cada una habilita y condiciona a la siguiente.

```
Proyecto → Comprender → Diseñar → Construir → Aprender → Preservar → Reutilizar → (reinyecta en Comprender)
```

Project Companion nunca abandona el ciclo. Cuando algo se reutiliza, ese algo redefine *qué* se comprende después. El ciclo no se cierra: se espirala.

Cada etapa se define por separado, en su propia sección, como una metodología ejecutable. Este documento solo completa **Comprender**. Las demás etapas se desarrollan una por vez, en iteraciones posteriores.

---

## Etapa 1 — Comprender

### Objetivo

Reconstruir, a partir de evidencia observable y sin proyectar supuestos, el problema que el proyecto resuelve, los actores que lo padecen, los objetivos que persiguen, los procesos que existen, las decisiones que se tomaron, los conceptos con los que el negocio piensa, las restricciones que moldean todo y las interfaces que se exponen a los actores.

El output de Comprender **no es código, no es diseño de solución y no es documentación técnica.** Es un **mapa de comprensión**: una red de instancias del metamodelo, cada una trazada a evidencia, cada una en un estado epistémico claro (observación / hipótesis / conocimiento).

Comprender no decide si algo vale la pena preservar. Esa es la etapa Preservar. Comprender no propone qué cambiar. Esa es Diseñar. Comprender solo entiende lo que ya existe.

### Qué información recibe

- **Entrada primaria:** el proyecto en su estado actual. Código, artefactos, comportamiento en ejecución, conversaciones, historia, ausencias. Cualquier cosa observable.
- **Entrada secundaria (opcional):** preguntas formuladas por un humano que enciende una pasada de comprensión sobre una zona específica ("¿por qué la página de Clientes se comporta así?"). Cuando no hay pregunta, Comprender arranca en modo abierto; cuando la hay, arranca en modo dirigido. El protocolo es el mismo: solo cambia el orden de las zonas auditadas.
- **No recibe:** supuestos del operador sobre el dominio, memorias previas del ingeniero sobre el proyecto, conocimiento de otros proyectos similares. Todo eso es sesgo y se trata como hipótesis a validar, no como entrada.

### Qué información produce

- Un **inventario de evidencia** disponible (qué se puede observar, dónde, con qué fiabilidad).
- Un **registro de observaciones** crudas (hechos, sin interpretación, trazables a su fuente).
- Un **registro de hipótesis** activas (cada una con cuestión, rationale, evidencia a favor, evidencia en contra, dueño de refutación, estado).
- Un **mapa de comprensión**: para cada entidad del metamodelo, qué instancias se identificaron y en qué estado epistémico están.
- Una **lista de grietas** — entidades que el proyecto parece necesitar pero para las que no aparece evidencia. Las grietas no se rellenan: se registran como ausencias.
- Una **lista de preguntas abiertas** que no se pudo responder y que quedan pendientes.

### Preguntas que intenta responder

No son preguntas del proyecto. Son preguntas del metamodelo aplicadas al proyecto.

1. ¿Qué problema(ores) existe(n) que justifican que este proyecto exista?
2. ¿Quién(es) padecen cada problema? ¿Quién más interactúa con el sistema?
3. ¿Qué resultados busca cada actor?
4. ¿Qué no puede cambiar, aunque se quiera?
5. ¿Qué procesos existen? ¿Quién los dispara, qué pasos tienen, qué reglas los gobiernan, qué resultado esperan, qué pasa cuando fallan?
6. ¿Qué conceptos necesita el negocio para pensar? ¿Qué distingue dos instancias del mismo concepto?
7. ¿Qué interfaces exponen conceptos y procesos a los actores? ¿Qué decisión habilita cada una?
8. ¿Qué decisiones se tomaron? ¿Entre qué alternativas? ¿Por qué?
9. ¿Qué implementaciones materializan cada interfaz?
10. ¿Qué artefactos produjo el proyecto?
11. ¿Qué evidencia podemos observar de todo esto?
12. ¿Qué entendimos que sobrevive a un cambio de implementación?

Ninguna pregunta presupone el dominio. "Clientes", "productos", "ventas" no aparecen en la lista. Aparecerán como *respuestas*, no como preguntas.

### Mecanismos

Cuatro herramientas. Cada una tiene un momento y un criterio de uso.

#### Observación

Lectura directa de evidencia, sin interpretación. Lee archivos, corre el sistema, mirá logs, escuchá conversaciones, leé commits. El output siempre es: "en la fuente X, se observó el hecho Y". Nunca "el sistema hace Y *para* Z" — eso ya es hipótesis.

**Cuándo usar:** al inicio (orientación) y siempre que se busque evidencia para responder una hipótesis concreta.

**Cuándo no:** cuando no hay pregunta. Observar sin pregunta genera ruido: se acumulan hechos que nadie va a usar y se confunden con conocimiento.

#### Auditoría

Observación dirigida por una pregunta. La diferencia con Observación no es el acto (ambas miran evidencia) sino la intención: la auditoría sabe qué busca y qué encontraría si la hipótesis fuera verdadera o falsa.

**Cuándo usar:** cada vez que una hipótesis necesita confirmación O refutación. Es el mecanismo dominante del workflow.

**Cuándo no:** antes de tener hipótesis. Auditar sin hipótesis es observar disfrazado de algo más riguroso.

#### Hipótesis

Interpretación propuesta que explica observaciones. Toda hipótesis debe tener: (a) qué observación explica, (b) qué predeciría si fuera cierta, (c) qué evidencia, de aparecer, la refutaría. Si no puede nombrarse un dueño de refutación, no es hipótesis —es folklore y no entra al sistema.

**Cuándo usar:** después de tener observaciones que piden una explicación, y antes de validar.

**Cuándo no:** cuando ya hay evidencia directa suficiente. No se hipotetiza lo que se puede observar.

#### Validación

Búsqueda deliberada y simultánea de evidencia a favor y evidencia en contra de una hipótesis. Confirmar solo busca "sí"; refutar busca "no". Una hipótesis pasa a conocimiento solo si la búsqueda de refutación se ejecutó de buena fe y no encontró nada.

**Cuándo usar:** antes de promover cualquier hipótesis a conocimiento.

**Cuándo no:** nunca se omite. Especular sin validar es el error más caro del ciclo.

### Workflow

Siete pasos. Se corre por zonas: se puede aplicar a todo el proyecto o a una zona específica. El protocolo es el mismo.

#### Paso 1 — Orientación

Levantá un inventario de evidencia disponible, sin interpretar nada.

- ¿Qué artefactos existen? (código, configs, docs, migraciones, tests, logs)
- ¿Hay comportamiento en ejecución observable? (podemos correrlo, mirar requests, mirar estado)
- ¿Hay historia? (commits, issues,-chat, decisiones pasadas)
- ¿Hay conversaciones con quienes trabajan en el proyecto? ¿Están disponibles?
- ¿Qué NO está? (ausencias significativas: un módulo sin tests, una feature sin docs, un proceso sin dueño)

**Output:** inventario de evidencia. Cero interpretación. Cada item marcado con su fiabilidad: directa (código actual), indirecta (log viejo), obsoleta, humana-no-verificable.

**Regla:** si en este paso ya tenés una opinión sobre el proyecto, no la actives. Anotala como hipótesis pendiente, no como conclusión.

#### Paso 2 — Pregunta inicial

Elegí la pregunta más fundamental posible. Si hay una pregunta formulada por un humano, usala. Si no, la default es: **"¿Qué problema resuelve este proyecto?"**

Toda pregunta es del metamodelo, no del dominio. No es "¿qué hace ClientesPage?", es "¿qué proceso expone ClientesPage?".

**Output:** una pregunta, escrita, en lenguaje del metamodelo.

#### Paso 3 — Auditoría dirigida

Buscá evidencia que responda la pregunta. Mirá el inventario del paso 1, elegí qué fuentes sirven, observá con criterio.

- Si la pregunta es "¿qué problema resuelve?", los logs de errores, los issues abiertos, los commits más frecuentes, y las conversaciones con quienes lo mantienen suelen ser la mejor pista.
- Si la pregunta es "¿qué proceso expone esta interfaz?", la estructura de la interfaz, los endpoints CRUD, las secuencias de acción del usuario, y los nombres de funciones son la pista.

**Output:** observaciones crudas. Una por fuente. "En el commit X se agregó el campo `cajaId` a la venta." Nunca "lo agregaron porque".

#### Paso 4 — Hipótesis

Tras累积 observaciones que apuntan en una dirección, formulá hipótesis que las expliquen. Cada hipótesis debe tener:

- **Cuestión:** qué pregunta del metamodelo responde.
- **Rationale:** qué observaciones la motivan.
- **Predicción:** qué encontrarías si fuera cierta (evidencia esperada).
- **Dueño de refutación:** qué encontrarías si fuera falsa (evidencia que la mata).
- **Estado:** activa.

Sin dueño de refutación, no entra.

**Output:** una o más hipótesis escritas en el registro.

#### Paso 5 — Validación

Para cada hipótesis, corré auditoría dos veces: una buscando evidencia que la confirmaría, otra buscando evidencia que la refutaría.

Si aparece evidencia confirmatoria y no aparece refutación tras búsqueda genuina → promové a conocimiento.

Si aparece refutación → descartá (o ajustá la hipótesis y volvé a paso 4).

Si no aparece ni una ni otra → dejá la hipótesis activa, marcá la entidad como "aún no resuelta" y seguí adelante. No la promuevas.

**Búsqueda genuina significa:** listar antes al menos tres fuentes potenciales de refutación y revisarlas. No es genuino si solo buscaste donde esperabas confirmar.

**Output:** hipótesis promovidas a conocimiento; hipótesis descartadas (con motivo); hipótesis que quedan activas (con su dueño de refutación).

#### Paso 6 — Mapeo

Actualizá el mapa de comprensión. Para cada una de las 12 entidades del metamodelo:

- ¿Se identificó al menos una instancia?
- ¿En qué estado está: observación, hipótesis, conocimiento?
- ¿Hay evidencia trazada?
- ¿Es una grieta (debería existir pero no hay evidencia)?

El mapa no es opcional. Es el artefacto que valida que la etapa terminó.

**Output:** mapa de comprensión completo.

#### Paso 7 — Chequeo de saturación

Si hay preguntas abiertas de prioridad alta → volvé al paso 2 con la siguiente pregunta (la más importante que falte), repitiendo pasos 2-6.

Si quedan preguntas de prioridad baja y no bloquean Diseñar → pasá a criterios de salida.

Si todas las entidades del metamodelo están mapeadas como conocimiento o como "no aplica" con justificación → pasá a criterios de salida.

**Output:** decisión explícita de terminar o continuar.

### Artefactos

Comprender produce cinco artefactos. Ninguno es opcional.

1. **Inventario de evidencia** — catálogo de fuentes observables con su fiabilidad.
2. **Registro de observaciones** — hechos crudos trazados a su fuente.
3. **Registro de hipótesis** — hipótesis activas, promovidas y descartadas, cada una con rationale, predicción y dueño de refutación.
4. **Mapa de comprensión** — una fila por cada entidad del metamodelo con su estado epistémico por instancia identificada.
5. **Lista de grietas y preguntas pendientes** — lo que falta entender, con priorización.

El formato de cada artefacto depende de la persistencia (puede ser Markdown, YAML, una tabla, una whiteboard). El documento no lo fija. Lo que se fija es que el contenido exista y sea buscale.

### Criterios de salida

Comprender no busca comprensión máxima. Busca **comprensión suficiente para avanzar con seguridad**. La diferencia clave: una cosa es "no entendí todo el proyecto", otra muy distinta es "no entiendo lo suficiente para mover este cambio específico".

Regla de salida: para cada criterio incumplido, evaluar si **bloquea el cambio propuesto**.

- Si bloquea → Comprender sigue abierto.
- Si no bloquea → se registra como **pregunta abierta** y Comprender termina.
- Si nunca aparece el cambio propuesto (porque Comprender corre sin un cambio predefinido) → los 9 criterios son obligatorios.

Las preguntas abiertas registradas se reabren automáticamente si en Diseñar o Construir se vuelven relevantes para el cambio.

1. **El Problema está enunciado sin referencia a solución.** No dice "necesitamos módulo de ventas"; dice "los operadores no pueden cobrar sin abrir un proceso manual". Hay evidencia trazada.
2. **Al menos un Actor identificado por rol**, no por nombre de feature. Hay evidencia trazada.
3. **Al menos un Objetivo por actor activo**, enunciable sin tecnología, con condición de éxito observable.
4. **Las Restricciones encontradas están clasificadas como fijas o elásticas**, con su origen.
5. **Cada Proceso identificado tiene disparador, pasos, actores, reglas, resultado esperado y resultado de falla.** Si alguno falta, está marcado como grieta, no como "se sobreentiende".
6. **Cada Concepto identificado tiene su criterio de identidad.** Sin criterio de identidad, se marca como "no es concepto, es valor".
7. **Cada Decisión identificada tiene alternativas consideradas y rationale trazado a evidencia.** Si el rationale no se encuentra, es una grieta, no una suposición.
8. **Las Interfaces y Implementaciones aparecen como instancias**, no como tipos genéricos. No sirve "hay una interfaz web" — sirve "esta interfaz expone tal proceso a tal actor y habilita tal decisión".
9. **Ninguna hipótesis se preservó como conocimiento sin validación.** Pueden quedar hipótesis activas, pero ninguna promovida saltándose el paso 5.

Si tres o más criterios no se cumplen, Comprender sigue abierto.

### Errores comunes

Hacer mal esta etapa es mucho más común que hacerla bien. Diez modos de fallar, por orden de daño.

1. **Proyectar lo que ya sabés.** Llegás con un modelo mental previo (porque trabajaste en el proyecto, o porque es "parecido a otro") y dejás que esa memoria funcione como respuesta. Eso no es comprender —es recordar. La memoria no es evidencia.
2. **Colectar artefactos sin pregunta.** Salir a leer todo "para entender" genera un dump de hechos sin estructura. Es ruido disfrazado de rigor.
3. **Promover hipótesis a conocimiento sin refutación.** Encontrás tres confirmaciones y declarás ganada la hipótesis. Pero nunca buscaste lo que la mataría. Confirmación sesgada.
4. **Mezclar observación con interpretación.** "La deuda dispara el alerta" es una observación. "El sistema modela riesgo crediticio" es una interpretación. Si las escribís en la misma línea, perdés trazabilidad y perdés la capacidad de validar por separado.
5. **Rellenar grietas con suposición.** No encontrás el rationale de una decisión y entonces lo inferís "porque es lo lógico". Eso no es comprender —es inventar. La grieta queda como grieta.
6. **Declarar "comprendido" sin mapear todas las entidades.** Te sentís cómodo con Procesos y Conceptos pero no miraste Restricciones. Medio mapa. Medio comprendido.
7. **Confinarse en la capa de implementación.** "Leí el código, ya entiendo el proyecto." No. Entendiste la implementación. El proceso, el objetivo y el problema siguen sin ser comprendidos. La implementación es la capa más volátil: entenderla no es comprender el proyecto, es comprender un estado.
8. **Declarar "no aplica" sin justificación.** Marcar una entidad del metamodelo como "no aplica" sin decir por qué. Si no la buscaste, no sabés si no aplica.
9. **Salir a Diseñar apenas la primera respuesta aparece.** Una entidad comprendida no es un proyecto comprendido. Diseñar con un mapa a medio llenar es diseñar decorativamente.
10. **Cerrar grietas con el ingeniero senior.** Hablar con la persona que sabe y aceptar lo que dice como verdad. Lo que dice la persona es hipótesis, hasta que su contenido se traza a evidencia observable. La conversación es fuente, no verdad.

### Lo que Comprender no hace

Para evitar ambiciones de scope:

- No decide qué cambios hacer al proyecto. (Eso es Diseñar.)
- No escribe código ni refactoriza. (Eso es Construir.)
- No decide si algo vale la pena guardarse para siempre. (Eso es Preservar.)
- No aplica el Knowledge Filter del PKS. El filtro vive en Preservar. Durante Comprender, todo vale como hipótesis y observación; nada se descarta por "no reutilizable".
- No preserva nada en ningún backend (PKS, Notion, nada). El registro de observaciones y de hipótesis es local a esta etapa. Lo que entra a persistencia es decisión de Preservar, no de Comprender.
- No asume que el proyecto está bien hecho. Tampoco asume que está mal hecho. Aprende lo que hay, no lo que debería haber.

---

## Etapa 2 — Diseñar (en desarrollo)

**Propósito:** transformar la comprensión en una propuesta de cambio que resuelva un problema real, dentro de las restricciones.

Diseñar sin comprender es decorar. Diseñar bien es elegir, entre alternativas, la que mejor persigue un objetivo dentro de las restricciones.

El workflow completo de Diseñar se desarrolla por fricción. Solo el primer paso está especificado; los demás se irán especificando cuando PASS-001 los requiera.

### Paso 1 — Selección del cambio

**Objetivo del paso:** elegir un único cambio de la lista de oportunidades detectadas por Comprender, mediante un mecanismo reproducible. No por intuición.

**Entradas:**
- Lista de oportunidades generadas por Comprender (cada una trazada a observaciones/hipótesis).
- Objetivo de la Pass (el trigger real).
- Restricciones activas del proyecto.
- Costo, riesgo, valor y aprendizaje esperados de cada candidato.

**Mecanismo de selección:**

Por cada candidato se evalúan cinco dimensiones en escala **0, 1, 2** y se aplica un peso diferente a cada una. Restricciones actúa como gate: si no las cumple, se descarta sin pontuación.

| Dimensión | 0 (nada) | 1 (moderado) | 2 (mucho) | Peso | Razón del peso |
|-----------|----------|--------------|-----------|------|----------------|
| Alineación con el objetivo de la Pass | No alinea | Alinea parcialmente | Alinea directo | 2 | Sin alineación, el cambio no responde al trigger |
| Valor esperado | Imperceptible | Observable | Alto impacto | 2 | Lo que justifica el cambio |
| Aprendizaje esperado (metodológico) | Ya lo sabíamos | Refuerza algo | Cambia algo de la metodología | 2 | PC está en lab; aprender el método es tan valioso como el código |
| Costo | Grande | Mediano | Pequeño | 1 | Invertido: menor costo suma más |
| Riesgo | Alto | Medio | Bajo | 1 | Invertido: menor riesgo suma más |
| Restricciones | (gate) | (gate) | (gate) | — | Si no cumple una restricción fija, descartado |

Score = 2·alineación + 2·valor + 2·aprendizaje + 1·(2 − costo) + 1·(2 − riesgo)

Rango: 0–16. El candidato con mayor score se selecciona. En empate, gana el de menor costo. En empate de costo, gana el de mayor aprendizaje esperado. Si aún empatan, gana el de numeración menor.

**Salida del paso:**

- Un único cambio seleccionado, con la tabla de scoring completa publicada (todos los candidatos, todos los puntajes).
- Justificación en una frase: por qué se eligió ese, no por qué los otros no.
- Lista de candidatos descartados con su score y un motivo corto ("no alinea", "riesgo alto", "costo fuera de alcance").

### Pasos siguientes de Diseñar (no desarrollados aún)

- Definición detallada de la solución elegida (objetivos, restricciones, trade-offs, modelo del dominio impactado, agregar/seguir existentes). *(Pendiente.)*
- Especificación de los criterios de salida de Diseñar, artefactos que produce, y errores comunes. *(Pendiente.)*

---

## Etapas siguientes (no desarrolladas aún)

- **Construir** — materializa el diseño en código. *(Pendiente.)*
- **Aprender** — extrae lecciones del resultado. *(Pendiente.)*
- **Preservar** — filtra y persiste el conocimiento. *(Pendiente.)*
- **Reutilizar** — activa el conocimiento preservado cuando vuelve a ser útil. *(Pendiente.)*

Cada una se desarrollará en su propia iteración, con el mismo formato: objetivo, qué recibe, qué produce, preguntas, mecanismos, workflow, artefactos, criterios de salida, errores comunes.

---

## Tensiones con lo aprendido construyendo el PKS de PosWeb

Dos cosas que Project Companion cambia respecto del PKS original.

**El Knowledge Filter del PKS asumía que ya había conocimiento.** Sus tres preguntas (¿reutilizable?, ¿no evidente del código?, ¿costoso de reconstruir?) servían para decidir *si preservar* algo. Pero daban por sentado que lo que evaluabas era conocimiento. Project Companion sitúa el Knowledge Filter en la etapa Preservar, no en la epistémica. El paso previo —decidir si algo es conocimiento o apenas hipótesis— vive en Comprender y Aprender, antes y separado de si se preserva.

**El ciclo de status del PKS (Draft → Active → Canonical → Deprecated) describía el lifecycle de una unidad ya preservada.** Es válido, pero es el lifecycle de un *artefacto*, no de una idea. Project Companion necesita el ciclo previo —Observación → Hipótesis → Validado → Conocimiento— que corre dentro de Comprender y Aprender, antes y separado de si el resultado termina preservado.

Lo que sobrevive intacto: **Captura Progresiva** se eleva de criterio de redacción a principio epistémico. No se promueve hipótesis a conocimiento sin evidencia. No se preserva sin validar. Calidad sobre cantidad ya no es un criterio de escritura; es la frontera misma entre lo que entra al sistema y lo que no.

---