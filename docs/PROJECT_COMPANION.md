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

### 6b. Regla especial para modificaciones de UI

Cuando el cambio involucre **cualquier modificación visual** (popup, pantalla, componente, layout, colores, tipografía, espaciado, navegación), aplicar este flujo adicional después del paso 5 (Propuesta) y antes del paso 7 (Implementación):

> **Principio rector de migraciones: No migrar pantallas. Migrar conocimiento.**
>
> Cada popup nuevo debe construirse reutilizando el **conocimiento acumulado** del proyecto, no copiando el código del popup anterior.
>
> Cuando una mejora sea reutilizable:
> 1. Actualizar el Design System (DS-*).
> 2. Actualizar el KI correspondiente.
> 3. Actualizar el ADR si cambia una decisión arquitectónica.
> 4. Recién después aplicar la mejora en el popup actual.

```
1. Leer PROJECT_COMPANION (este documento).
2. Cargar los PKS relacionados (registry → DS-*, COMP-*).
3. Identificar el estándar existente (DS-dialog-popup si es un popup).
4. Identificar componentes canónicos aplicables (COMP-DialogSection, etc.).
5. Si el popup a migrar tiene un modelo de referencia (ej: ProductFormModal):
   a. Identificar los patrones de UX que implementa.
   b. Aplicar las heurísticas de decisión (KI-ux-dialog-rationale → Heurísticas de decisión).
   c. NO copiar el código — reutilizar los patrones.
6. Si la mejora es reutilizable: actualizar primero el PKS y luego implementarla.
7. Si no existe estándar o componente: proponer crearlo antes de la implementación.
```

**Principio: el estándar nunca nace dentro de un popup. Primero se crea o actualiza en el PKS, luego se aplica a la pantalla.**

Esto garantiza que:
- El conocimiento crece junto con el proyecto, no después.
- Dos popups diferentes no resuelven el mismo problema visual de formas distintas.
- Las mejoras aprobadas se heredan automáticamente en futuros popups.

**Flujo detallado para migraciones de popups:** Ver `KI-ux-dialog-rationale` → Flujo de decisión del Companion → para el orden completo incluyendo lectura de ADRs, KIs, evaluación pre-migración, y aprobación del usuario.

### 6e. Heurísticas de decisión para migraciones (OBLIGATORIO)

Cuando el Companion deba migrar un popup existente o crear uno nuevo, DEBE aplicar las **9 heurísticas de decisión** documentadas en `KI-ux-dialog-rationale`:

| # | Heurística | Acción si sí | Acción si no |
|---|-----------|--------------|--------------|
| H1 | ¿Mejora la comprensión del usuario? | Reutilizar el patrón | No aplicarlo |
| H2 | ¿Reduce clics o tiempo de búsqueda? | Aplicar | No aplicar |
| H3 | ¿Aumenta la consistencia del sistema? | Aplicar | No aplicar |
| H4 | ¿Ya existe un componente del DS? | Reutilizarlo. Nunca crear uno nuevo | Evaluar si crear componente DS |
| H5 | ¿Es patrón o copia de pantalla? | Reutilizar el patrón | No copiar código |
| H6 | ¿Tiene dato protagonista? | Usar DialogPrimaryField | Justificar |
| H7 | ¿Tiene info económica? | Usar DialogDashboard | Justificar |
| H8 | ¿Necesita contexto de entidad? | Usar highlight | No usar |
| H9 | ¿Necesita identidad visual? | Usar DialogHeader | Casi siempre sí |

Estas heurísticas no son optativas. El Companion debe responder cada una y documentar las respuestas antes de implementar. La justificación de respuestas negativas es obligatoria.

### 6c. Manejo de errores en popups (OBLIGATORIO)

Todo popup del sistema debe manejar errores distinguiendo **cuatro categorías**:

```
1. Error de render (React exception)
   → capturado por ErrorBoundary dentro de COMP-Dialog
   → COMP-Dialog decide: notifyError() + cierra el popup
   → El ErrorBoundary NO conoce notificaciones ni dialogs.
      Solo reporta vía onUnexpectedError?.(error) (callback opcional).

2. Error inesperado (network, timeout, excepción no controlada en catch)
   → siempre usar notifyError() para mostrar el popup de error genérico
   → cada popup decide si cierra o no según el contexto

3. Error de negocio esperado (cliente duplicado, stock insuficiente, CUIT repetido)
   → no son errores técnicos, son parte del flujo normal
   → usar notifyError() para mostrar el popup genérico
   → cada popup decide autónomamente si permanece abierto:
     - Crear Producto → puede cerrarse si esa experiencia tiene sentido
     - Editar Cliente → normalmente permanece abierto
     - Nuevo Proveedor → probablemente permanece abierto
     - Configuración → permanece abierto

4. Validación de formulario (campo obligatorio, precio inválido)
   → usar notifyError()
   → prohibido banners rojos inline o setError local
```

**Reglas:**
- **Prohibido** usar `setError` local o carteles de error inline dentro de un popup.
- **Obligatorio** usar `notifyError()` para todos los errores visibles al usuario.
- **Error de render** el cierre lo decide COMP-Dialog (comportamiento global).
- **Error de negocio y validación** cada popup decide autónomamente si cierra o no.
- Ver `ADR-error-handling-dialogs` para el razonamiento completo y alternativas descartadas.

### 6d. Evaluación pre-migración de popups (OBLIGATORIO)

Antes de migrar cualquier popup existente (Clientes, Proveedores, Sucursales, Ventas, Combos, etc.) o crear uno nuevo, el Companion DEBE ejecutar la **evaluación pre-migración** definida en `KI-ux-dialog-rationale`.

**Flujo obligatorio durante PKS Discovery:**

```
1. Cargar KI-ux-dialog-rationale (docs/knowledge/projects/posweb/KI-ux-dialog-rationale.md)
2. Responder las 7 preguntas de evaluación para el popup específico:
   a. ¿Existe un dato protagonista? → DialogPrimaryField
   b. ¿Conviene usar context debajo del título? → highlight
   c. ¿Existe info económica? → DialogDashboard
   d. ¿Necesita dos columnas?
   e. ¿Puede reutilizar DialogSection?
   f. ¿Puede reutilizar DialogPrimaryField? (idéntico a a)
   g. ¿Puede reutilizar DialogDashboard? (idéntico a c)
3. Documentar cada respuesta con justificación.
4. Si alguna respuesta es false y expected era true, justificar EXPLÍCITAMENTE por qué no aplica.
5. Presentar la evaluación al usuario antes de comenzar la implementación.
```

**Reglas:**
- La evaluación no es opcional. No se migra un popup sin pasar por la checklist.
- No se aplican las decisiones automáticamente. Cada popup se evalúa según su contexto.
- Si una decisión no aplica (ej: popup de confirmación sin formulario), el Companion DEBE justificar por qué no aplica en ese caso particular.
- Ver `KI-ux-dialog-rationale` para el detalle completo de cada decisión, alternativas descartadas y ejemplos de justificación.

### 6f. UX Popup Audit (OPCIONAL)

**Propósito:** Auditoría opcional de experiencia de usuario para popups y formularios del sistema. No busca errores de código — busca oportunidades para mejorar la productividad del usuario en un sistema de gestión (POS/ERP/CRM).

**Activación:** Solo se ejecuta cuando el usuario la solicita explícitamente con frases como:
- "Auditemos este popup."
- "Hacé una UX Audit."
- "Revisá este formulario."
- "Analizá oportunidades de mejora."
- "Hacé una revisión de UX."

**Rol del Companion durante la auditoría:** Actuar simultáneamente como:

| Rol | Qué aporta |
|-----|-----------|
| **UX Lead** | Detecta fricción en el flujo, jerarquía visual, organización conceptual |
| **Product Designer** | Cuestiona si el diseño resuelve el problema real del usuario |
| **Especialista POS/ERP/CRM** | Sabe que un usuario puede cargar 200 productos por día y diseña para eficiencia |
| **Arquitecto del Design System** | Asegura consistencia, reutilización y evolución del DS |

Pensar como un usuario que trabaja **ocho horas por día** con el sistema. No como un desarrollador. No como un revisor de código. La pregunta rectora no es "¿hay bugs?" sino "¿el usuario completó la tarea con la menor fricción posible?".

---

#### Context Audit (OBLIGATORIO antes de auditar)

Esta etapa se ejecuta **siempre antes** de comenzar la auditoría. Su objetivo es entender el contexto de negocio del popup para que las recomendaciones sean específicas para la entidad, no genéricas.

No se puede auditar un popup sin antes responder estas preguntas:

##### 1. ¿Qué entidad estoy auditando?

Identificar la entidad de negocio del popup: Producto, Cliente, Proveedor, Venta, Caja, Compra, Comprobante, etc.

Cada entidad tiene un flujo, un ritmo y un usuario diferente. Las recomendaciones para un Producto no sirven para un Cliente.

##### 2. ¿Quién utiliza este popup?

Identificar el perfil del usuario real: Cajero, Administrador, Compras, Ventas, Contador, Encargado de depósito.

La auditoría debe pensar para **ese usuario**, no para un desarrollador ni para un usuario genérico.

##### 3. ¿Con qué frecuencia se usa?

Clasificar el popup en una de estas categorías:

| Frecuencia | Características |
|------------|----------------|
| **Uso intensivo** | Muchas veces al día. Cada milisegundo cuenta. Priorizar shortcuts, automatización, cero fricción. |
| **Uso frecuente** | Varias veces por semana. Balance entre velocidad y claridad. |
| **Uso ocasional** | Cada tanto. Priorizar legibilidad y guía visual sobre velocidad. |
| **Configuración** | Se usa una vez y rara vez se vuelve. Priorizar claridad extrema, hint texts, evitar errores. |

La frecuencia cambia completamente el peso de cada recomendación.

##### 4. ¿Cuál es el objetivo principal del usuario?

No describir el formulario. Describir qué quiere **lograr** el usuario al usar este popup.

> ❌ "Completar los campos del formulario."
> ✅ "Dar de alta un producto nuevo en el sistema lo más rápido posible."

##### 5. ¿Qué información necesita ver inmediatamente?

Identificar:

- **Dato protagonista** — lo que el usuario busca o completa primero.
- **Datos secundarios** — necesarios pero no urgentes.
- **Configuraciones** — se usan poco, pueden colapsarse.

##### 6. ¿Qué información puede ocultarse o colapsarse?

Buscar:

- Campos de uso poco frecuente.
- Configuraciones avanzadas que la mayoría de los usuarios no toca.
- Información opcional que agrega ruido visual.

No todo debe estar visible todo el tiempo.

##### 7. ¿Qué acciones pueden automatizarse?

Antes de pedirle input al usuario, preguntar:

- ¿Esto se puede **autocalcular**? (precio desde costo + margen)
- ¿Esto se puede **autocompletar**? (unidad desde categoría)
- ¿Esto se puede **sugerir**? (código auto-generado)
- ¿Esto se puede **inferir**? (margen desde categoría)
- ¿Esto se puede **ocultar** cuando no aplica? (contenido solo si aplica)

La mejor UX es la que evita trabajo innecesario.

##### 8. ¿Qué fricciones específicas de negocio existen?

No solamente fricciones técnicas. También fricciones de **proceso de negocio**:

> "El usuario normalmente escanea el código de barras para buscar un producto. ¿Por qué el foco está en el nombre?"

> "El margen se calcula desde el costo, pero el usuario tiene que completar precio manualmente."

> "El comerciante carga 50 productos por lote y tiene que escribir 'Unidad' 50 veces."

##### 9. ¿Qué oportunidades existen para el usuario intensivo?

Pensar en el 20% de usuarios que genera el 80% del uso. Preguntar:

- ¿Qué hace este usuario todo el día con este popup?
- ¿Qué campos completa siempre con el mismo valor?
- ¿Qué secuencia de acciones podría comprimirse en un shortcut?
- ¿Qué información podría persistirse entre productos (ej: misma categoría para el lote)?

##### 10. Domain Knowledge

Antes de recomendar un cambio, analizar cómo trabaja realmente el usuario de esa entidad. Preguntar según el perfil:

| Perfil | Preguntas guía |
|--------|---------------|
| **Comerciante** | ¿Cómo agrupa los productos? (por categoría, por proveedor, por lote). ¿Usa escáner o escribe? ¿Carga muchos similares seguidos? |
| **Cajero** | ¿Prioriza velocidad o precisión? ¿Usa teclado o pantalla táctil? ¿Qué información consulta sin modificar? |
| **Comprador** | ¿Necesita ver precios de varios proveedores? ¿Compara productos antes de decidir? ¿Qué datos usa para decidir? |
| **Administrador** | ¿Revisa informes? ¿Ajusta precios masivamente? ¿Qué configuraciones cambia regularmente? |

No asumir cómo trabaja el usuario. Preguntarse primero, recomendar después.

**Regla:** No imponer un único comportamiento. Identificar los distintos **escenarios de uso** del popup (carga manual, escaneo, importación, edición) y evaluar qué comportamiento es más conveniente para cada uno. Si existen varios escenarios válidos, proponer una solución adaptable o configurable en lugar de un único comportamiento fijo.

##### 11. Cuestionar el proceso de negocio

Antes de optimizar el formulario, preguntar si el **proceso** debería ser diferente:

- "¿El usuario realmente carga productos por categoría, o los agrupa por proveedor?"
- "¿La optimización correcta es recordar el último valor, o permitir trabajar con un contexto persistente (ej: un proveedor específico)?"
- "¿Estoy mejorando el formulario o estoy mejorando la forma en la que trabaja el usuario?"
- "¿El diseño actual refleja cómo piensa el usuario, o cómo se modeló la base de datos?"

La mejor optimización no siempre es técnica. A veces es repensar el flujo completo.

**Determinación del peso de las recomendaciones:**

| Tipo de propuesta | Acción |
|-------------------|--------|
| **Sin evidencia** | Documentar como hipótesis. No recomendar cambios. |
| **Evidencia observada** | Recomendar con cautela. Priorizar datos antes de implementar. |
| **Evidencia confirmada** (métrica, dato de uso) | Recomendar con prioridad. |

No recomendar cambios sin evidencia cuando el beneficio no está claro. Documentar como oportunidad y seguir adelante.

##### 12. Evidence types y Trade-offs

Cada recomendación debe incluir:

**Evidencia** — elegir una o varias:

| Tipo | Significado |
|------|-------------|
| ✅ Confirmado por el usuario | El usuario lo pidió o validó explícitamente |
| ✅ Implementado en software similar | Otro sistema de gestión similar lo resuelve así |
| ✅ Heurística UX | Principio de diseño reconocido (Fitts, Hicks, etc.) |
| ✅ Flujo observado | Se observó al usuario trabajando |
| ⚠ Hipótesis | Sospecha fundamentada pero sin confirmar |
| ❌ Descartado anteriormente | Ya se evaluó y se descartó por alguna razón |

**Trade-offs** — antes de recomendar, analizar:

| Aspecto | Preguntas guía |
|---------|---------------|
| **Beneficios** | ¿Qué gana el usuario? ¿Es medible? |
| **Riesgos** | ¿Qué puede salir mal? ¿Hay costo cognitivo? ¿Aumenta la complejidad? |
| **Caso contrario** | ¿Qué pasa si NO implementamos esto? |
| **Conclusión** | ¿Implementar, investigar, o descartar? |

**Clasificación** — cada propuesta debe terminar con un estado visible:

| Estado | Significado |
|--------|-------------|
| ✅ Confirmado | Se puede implementar |
| 🟡 Probable | Alta probabilidad, implementar con validación rápida |
| 🔵 Heurística UX | Respaldo teórico, implementar si aplica |
| 🟠 Hipótesis | Requiere investigación antes de decidir |
| ❌ Descartado | No implementar |

##### 13. Progressive Completion

Principio: nunca pedirle al usuario información que el sistema ya conoce.

- Antes de decidir el foco o el flujo, identificar qué datos ya existen, qué datos se autocompletaron y qué información falta.
- El foco debe ir siempre al **primer dato pendiente**, no a un campo fijo.
- Si una API ya devolvió parte de la entidad, el formulario debe saltar directamente a lo que falta completar.
- Esta heurística debe ser genérica: no depende de OpenFoodFacts, sino de cualquier fuente de datos precargados.

##### 14. Adaptive Focus

No existe un foco inicial universal.

- El foco inicial depende de cómo se abrió el popup, qué datos ya existen y cuál es el siguiente dato útil.
- No usar reglas absolutas como "siempre Nombre" o "siempre Código de barras".
- Si el contexto es inequívoco, el foco se adapta automáticamente.
- Si el contexto es ambiguo, elegir la opción que mejor preserve el ritmo de trabajo del usuario.

##### 15. Flow Continuity, Momentum y Zero Friction

- **Flow Continuity:** analizar el recorrido completo desde que el usuario abre el popup hasta que vuelve a la grilla o al siguiente ítem.
- **Momentum:** detectar todo lo que rompe el ritmo de trabajo (esperas, mouse innecesario, cambios de columna, reabrir ventanas, volver a buscar foco).
- **Zero Friction:** cuestionar cada acción manual: ¿puede eliminarse, inferirse, recordarse, autocompletarse o sugerirse?

---

#### Áreas de análisis

> **Principio:** Antes de recomendar un comportamiento, identificar los distintos escenarios de uso (carga manual, escaneo, importación, edición, integración con APIs externas). Evaluar qué comportamiento es más conveniente para cada escenario. Si existen varios escenarios válidos, proponer una solución adaptable —no un único comportamiento absoluto.
>
> Ejemplo: El foco inicial de un formulario de productos depende del escenario. Si el usuario escribe manualmente, conviene Nombre. Si usa escáner, conviene Código de barras. Si viene de OpenFoodFacts, conviene Nombre (para corregir). No existe una respuesta única.

##### 1. Flujo visual

- ¿Se entiende qué acción está realizando el usuario al ver el popup?
- ¿Cuál es el dato protagonista? ¿Se identifica en menos de 1 segundo?
- ¿Cuál es el siguiente paso después de abrir el popup?
- ¿El recorrido visual es natural (arriba → abajo, izquierda → derecha)?
- ¿El usuario puede escanear el formulario y saber qué se espera de él sin leer cada label?

##### 2. Jerarquía visual

Analizar si existe una jerarquía clara entre:
- Dato principal (protagonista)
- Datos secundarios
- Configuraciones
- Acciones (guardar, cancelar, cerrar)
- Información de solo lectura

Si todos los controles tienen el mismo peso visual, proponer mejoras. El peso visual debe guiar la atención, no decorar.

##### 3. Organización de campos

Evaluar si los campos están correctamente agrupados. Preguntarse:
- "¿Estos controles pertenecen al mismo concepto?"
- "¿La agrupación actual ayuda o confunde al usuario?"
- "¿El orden de los grupos sigue el orden mental del usuario, no el orden técnico?"

Si los grupos no son coherentes, proponer una mejor organización. Preferir agrupación por **concepto de negocio** antes que por **tipo de dato**.

##### 4. Recorrido físico del teclado

No alcanza con verificar que `FIELD_ORDER` existe. Analizar el recorrido físico que realiza el usuario:

- ¿El foco avanza siguiendo el orden visual natural (arriba → abajo, izquierda → derecha)?
- ¿Obliga al usuario a subir nuevamente (backtrack)?
- ¿Hace cambiar constantemente de columna?
- ¿Podría reducir movimientos reorganizando el orden de campos?
- ¿El foco inicial está en el campo correcto? (el que el usuario toca primero)

**Objetivo:** Minimizar el movimiento de las manos. No solamente verificar que el orden sea correcto.

| Problema | Señal |
|----------|-------|
| Backtrack | El usuario completa un campo y el foco vuelve a una fila superior |
| Salto de columna innecesario | El usuario está en columna izquierda y el foco salta a la derecha sin motivo |
| Foco inicial incorrecto | El primer campo con foco no es el que el usuario completa primero |

##### 5. Recorrido del mouse

Analizar también el uso del mouse (aunque el sistema priorice teclado):

- ¿Cuántos clics necesita el usuario para completar la operación principal?
- ¿Hay movimientos largos entre controles (Fitts' Law — a mayor distancia + menor tamaño, más lento)?
- ¿Los botones principales están donde naturalmente termina el recorrido visual?
- ¿El usuario cambia de columna muchas veces? (cada cambio de columna es un movimiento de ojos + mouse)
- ¿Los botones de acción (Guardar, Cancelar) tienen el tamaño mínimo recomendado para clics rápidos?

**Fitts' Law aplicado:** El tiempo para alcanzar un objetivo depende de la distancia y el tamaño. Botones principales deben ser grandes y estar cerca del punto donde el usuario termina de completar el formulario.

##### 6. Automatización

Buscar oportunidades para eliminar trabajo manual del usuario:

- Campos que puedan **calcularse automáticamente** (ej: precio desde costo + margen)
- Campos que puedan **autocompletarse** (ej: unidad de medida desde categoría)
- Campos que puedan **sugerirse** (ej: código interno auto-generado, categoría sugerida desde datos externos)
- Configuraciones que puedan **inferirse** (ej: margen desde categoría)
- Datos que puedan **ocultarse hasta ser necesarios** (ej: contenido solo cuando aplica)

La mejor UX es la que evita trabajo innecesario. Si un campo siempre puede completarse con un valor por defecto, no debería requerir interacción.

##### 7. Frecuencia de uso

Analizar qué campos utiliza realmente el usuario en su día a día:

- ¿Este campo se completa siempre? → debe estar visible y accesible.
- ¿Se usa pocas veces? → podría estar colapsado, secundario, o al final.
- ¿Podría ser opcional sin afectar la operación? → marcar como opcional explícitamente.
- ¿Está ocupando espacio innecesario para la mayoría de los casos? → reconsiderar su posición.
- ¿Hay campos que casi siempre tienen el mismo valor? → preseleccionar ese valor.

No todos los controles tienen la misma importancia. El layout debe reflejar la frecuencia de uso, no el orden en que se modeló la base de datos.

##### 8. Modo experto

Evaluar el popup pensando en un **usuario intensivo**. Un comerciante que carga cientos de productos por día:

- ¿Qué movimientos repetitivos podría eliminar?
- ¿Qué acciones podrían automatizarse con defaults inteligentes?
- ¿Qué shortcut sería útil para un power user?
- ¿Qué campo debería tener foco por defecto (el que más se completa)?
- ¿El usuario necesita pausar su flujo mental para completar el formulario, o puede hacerlo casi en automático?

No pensar únicamente en usuarios ocasionales. El 80% del tiempo de uso del sistema proviene del 20% de usuarios más intensivos.

##### 9. Pasos innecesarios

Detectar pasos que podrían eliminarse sin perder funcionalidad:

- Checkboxes que casi siempre quedan marcados (¿por qué no marcados por defecto?)
- Campos que siempre tienen el mismo valor (¿por qué no preseleccionados?)
- Confirmaciones innecesarias (¿realmente necesita confirmar antes de guardar?)
- Datos redundantes (¿dos campos que siempre coinciden?)
- Pasos que requieren cambiar de pantalla cuando podrían resolverse en el mismo popup

La auditoría debe **cuestionar el flujo**. No asumir que el diseño actual es correcto porque "siempre fue así".

##### 10. Consistencia

Evaluar desde tres niveles:

**Con el Design System:**
| Componente | ¿Se usa correctamente? |
|------------|----------------------|
| COMP-Dialog | Header, highlight, icon, footer |
| DialogHeader | Título, highlight, icon |
| DialogSection | Cards internas con header |
| DialogDashboard | Info económica en columna lateral |
| DialogPrimaryField | Dato protagonista |
| DialogFooter | Botón cancelar + confirmar |
| ErrorBoundary | Captura errores de render |
| Variables CSS | `var(--color-primary)`, etc. |

**Entre pantallas del proyecto:**
- ¿Este popup se siente parte del mismo sistema que los demás?
- ¿Clientes resolvería esto de la misma forma?
- Si Proveedores implementa un patrón diferente para el mismo problema, ¿cuál debería estandarizarse?

**Con el conocimiento del proyecto (PKS):**
- Revisar `PROJECT_COMPANION.md`, `docs/knowledge/projects/posweb/`, ADR y KI relacionados.
- No volver a proponer decisiones ya descartadas.
- Si el PKS ya decidió algo, reportar si el popup cumple o no con esa decisión.

##### 11. Componentes reutilizables

Detectar oportunidades para crear nuevos componentes del Design System, pero con criterio estricto. No basta con que algo se repita visualmente.

- ¿Representa un **patrón de interacción** o solo un layout?
- ¿Es reutilizable en distintos dominios (Productos, Clientes, Proveedores, Compras, Ventas, Caja, Configuración)?
- ¿Reduce conocimiento duplicado o solo reduce JSX duplicado?
- ¿Mantiene consistencia si mañana cambia el patrón?
- ¿Existe evidencia real? (ya aparece en varios módulos, ya fue reutilizado varias veces, el usuario pidió convertirlo en estándar, solo aparece en un popup, o es una hipótesis)

**Clasificación de promoción:**

| Estado | Cuándo usarlo |
|--------|---------------|
| 🟢 Listo para Design System | Patrón de interacción reutilizable, multi-dominio, con evidencia suficiente |
| 🟡 Reutilizar primero en más módulos | Aún no hay suficiente evidencia transversal |
| 🟠 Hipótesis | Puede ser reusable pero todavía no está demostrado |
| 🔴 No corresponde al Design System | Solo sirve para este popup o es mero layout |

No limitarse a decir "usa DialogSection". Analizar si el popup revela un concepto reusable que merece vivir como estándar.

##### 12. Productividad

Analizar cuantitativamente:

- **Cantidad de Tabs** para completar el formulario completo
- **Cantidad de clics** necesarios (incluyendo selects, checkboxes, botones)
- **Cambios de columna** durante el recorrido
- **Distancia recorrida** por el mouse entre el último campo y el botón de acción
- **Acciones repetitivas** (ej: limpiar un campo que siempre tiene el mismo valor)

Proponer mejoras concretas con métricas antes/después cuando sea posible.

##### 13. Shortcuts

No solamente revisar si existen shortcuts. Evaluar y proponer nuevos cuando aporten productividad real:

| Shortcut | Cuándo sugerirlo |
|----------|-----------------|
| Ctrl+Enter | Formularios donde el usuario envía sin llevar las manos al mouse |
| Ctrl+S | Formularios donde el usuario guarda repetidamente (facturación, carga masiva) |
| F2 | Popups con foco en búsqueda o captura de código |
| Alt+{letra} | Navegación rápida entre secciones del popup |
| Ctrl+N | Creación rápida de una nueva entidad desde otro popup |

No implementarlos automáticamente. Sugerirlos con justificación del beneficio para un usuario intensivo.

##### 14. Navegación espacial (Spatial Navigation)

No alcanza con un `FIELD_ORDER` lineal. El usuario no recorre un array — recorre una **interfaz**. Las flechas del teclado deben simular el movimiento físico del usuario sobre la pantalla.

**Principio:** Cada popup debe definir un mapa espacial de navegación. Las flechas ArrowUp/ArrowDown/ArrowLeft/ArrowRight deben comportarse como si el usuario se moviera por una grilla bidimensional, no como un índice secuencial.

```
Nombre [col izq, fila 1]              Costo [col der, fila 1]
    ↓                                       ↓
Código [col izq, fila 2]               Precio [col der, fila 2]
    ↓                                       ↓
Marca [col izq, fila 3]                 Margen [col der, fila 3]
```

Preguntas de auditoría:

- ¿Las flechas siguen el layout visual o un orden arbitrario?
- ¿Hay saltos ilógicos (ej: flecha abajo lleva a un campo visualmente arriba)?
- ¿Se puede llegar a cualquier control del popup usando solo flechas?
- ¿Hay ciclos? (ej: flecha derecha → flecha izquierda no devuelve al mismo control)
- ¿Hay backtracking con flechas que no existe con Tab?
- ¿El mapa espacial está documentado o implícito en el orden de render?
- ¿Existe una forma más natural de navegar según el layout?

**Estándar PKS propuesto:** `Spatial Navigation Model`

Cada popup que lo requiera deberá declarar su mapa de controles con coordenadas (fila, columna). La navegación con flechas deberá utilizar ese mapa, no un FIELD_ORDER lineal.

```
Ejemplo conceptual de SpatialNavMap:
{
  nombre:     { row: 0, col: 0 },
  codigoBarra:{ row: 1, col: 0 },
  codigoProd: { row: 2, col: 0 },
  marca:      { row: 3, col: 0 },
  categoria:  { row: 4, col: 0 },
  costo:      { row: 0, col: 1 },
  margen:     { row: 1, col: 1 },
  precio:     { row: 2, col: 1 },
}
```

ArrowDown desde `nombre` (row+1, col+0) → `codigoBarra`
ArrowUp desde `costo` (row-1, col+0) → `nombre`
ArrowRight desde `marca` (row+0, col+1) → `margen`

Este estándar debe documentarse en el PKS y aplicarse a todos los popups nuevos.

#### UX Score

Al finalizar la auditoría, asignar un puntaje del 1 al 5 en cada dimensión. El objetivo no es "aprobar o desaprobar", sino poder **comparar** la evolución del popup y de futuras migraciones.

| Dimensión | 1 | 2 | 3 | 4 | 5 |
|-----------|---|---|---|---|---|
| **Productividad** | Muchos pasos innecesarios | Algunos pasos prescindibles | Aceptable | Fluido | Mínimo esfuerzo posible |
| **Legibilidad** | Confuso, difícil de escanear | Algo desordenado | Aceptable | Claro | Obvio en <1s |
| **Navegación teclado** | No funciona o salta al azar | Funciona con backtrack | Correcta | Fluida | Óptima (cero backtrack) |
| **Navegación mouse** | Movimientos largos, clics excesivos | Algunos movimientos largos | Aceptable | Pocos movimientos | Clics mínimos, Fitts óptimo |
| **Consistencia DS** | No usa componentes del DS | Uso parcial | Mayormente consistente | Totalmente consistente | Mejora el DS |
| **Reutilización** | Código duplicado manual | Patrón replicado sin componente | Algo reusable | Patrón documentado | Es estándar del DS |
| **Automatización** | Todo manual | Pocos campos auto-calculados | Algunas automatizaciones | Mayormente automático | Mínima intervención |
| **Mantenibilidad** | Lógica y vista acopladas | Separación parcial | Aceptable | Buena separación | Componentes puros |

---

#### Formato del informe

La auditoría debe entregar un informe estructurado:

```
## UX Popup Audit: {nombre del popup}

### Context Audit
**Entidad:** {Producto / Cliente / Venta / ...}
**Usuario:** {Cajero / Administrador / Compras / ...}
**Frecuencia:** {Uso intensivo / Frecuente / Ocasional / Configuración}
**Objetivo:** {Qué quiere lograr el usuario en menos tiempo}

### UX Score
| Dimensión | Puntaje | Notas |
|-----------|---------|-------|
| Productividad | /5 | ... |
| Legibilidad | /5 | ... |
| Navegación teclado | /5 | ... |
| Navegación mouse | /5 | ... |
| Consistencia DS | /5 | ... |
| Reutilización | /5 | ... |
| Automatización | /5 | ... |
| Mantenibilidad | /5 | ... |
| **Total** | **/40** | |

### Fortalezas
- ...

### Oportunidades de mejora (priorizadas)
| # | Impacto | Esfuerzo | Problema | Acción | Evidencia | Estado |
|---|---------|----------|----------|--------|-----------|--------|
| 1 | 🔴 Alto | Bajo | ... | ... | {tipo} | {estado} |
| 2 | 🟡 Medio | Bajo | ... | ... | {tipo} | {estado} |
| 3 | 🟢 Bajo | Medio | ... | ... | {tipo} | {estado} |

### Context Audit insights
- {Hallazgos del análisis de contexto que impactan las recomendaciones}

### Trade-offs destacados
- {Para cada recomendación principal, incluir Beneficios / Riesgos / Conclusión}
- {Solo para las recomendaciones que tienen trade-off no trivial}

### Domain Knowledge
- {Cómo trabaja realmente el usuario de esta entidad — perfiles, escenarios, proceso de negocio}

### Flow Continuity
- {Desde la apertura del popup hasta el retorno a la grilla o siguiente paso}

### Momentum
- {Qué rompe el ritmo del usuario y dónde}

### Zero Friction
- {Qué acciones manuales podrían eliminarse, inferirse, recordarse o autocompletarse}

### Workflow Suggestions

Propuesta de flujo optimizado completo. No una lista de parches — un proceso repensado.

```
{Paso 1}
    ↓
{Paso 2}
    ↓
{...}
    ↓
{Paso N}
```

Ejemplo para Productos (carga con escáner):
```
Escanear código de barras
    ↓
Validar código (unicidad + OFF lookup)
    ↓
Autocompletar datos (categoría, unidad, marca desde OFF o desde contexto del lote)
    ↓
Completar únicamente la información faltante (nombre si no vino de OFF, precio, costo)
    ↓
Calcular precio automáticamente
    ↓
Guardar
    ↓
Preparar automáticamente el siguiente producto (persistir contexto del lote)
```

### Workflow Opportunities (no implementar sin aprobación)
- {Oportunidades de proceso de negocio descubiertas durante la auditoría}
- {Por ejemplo: alta por proveedor, carga masiva, importación, etc.}

### Promoción al Design System
| Candidato | Patrón de interacción | Multi-dominio | Conocimiento duplicado | Evidencia | Estado |
|-----------|----------------------|---------------|------------------------|-----------|--------|
| ... | ... | ... | ... | ... | ... |

### Escenarios de uso detectados

### Escenarios de foco inicial
- Escenario 1 — Producto nuevo manual → Nombre → Código de barras → resto
- Escenario 2 — Producto con escáner → Código de barras → validación → Nombre → resto
- Escenario 3 — Producto con datos precargados (OFF) → siguiente dato pendiente (ej: Costo → Margen → Precio → Stock)

### Recorrido físico del teclado
- ...

### Recorrido del mouse (Fitts)
- ...

### Navegación espacial
- ...

### Shortcuts sugeridos
- ...

### Automatización
- ...

### Componentes reutilizables (a proponer)
- ...

### Roadmap recomendado

**Implementar ahora** — Mejoras pequeñas con alto impacto y bajo riesgo.
- ...

**Próxima iteración** — Mejoras importantes que requieren más trabajo.
- ...

**Investigar** — Hipótesis de negocio. No implementar todavía.
- ...

**Convertir en estándar** — Si aplica al resto del sistema, proponer:
- [ ] Design System (`DS-*`)
- [ ] PKS (`KI-*`)
- [ ] ADR
- [ ] Project Companion

### Recomendación final
[ ] Sin cambios importantes
[ ] Mejoras recomendadas
[ ] Conviene rediseñar parcialmente
```

---

#### Post-auditoría

Si durante la auditoría se detecta una mejora que pueda beneficiar al resto del sistema:

1. **Sugerir** (no realizar automáticamente) actualizar:
   - El Design System (`DS-*`)
   - El Knowledge Item correspondiente (`KI-*`)
   - El ARCHITECTURE DECISION RECORD si aplica (`ADR-*`)
2. **No implementar** los cambios en el popup actual sin aprobación explícita del usuario.
3. Una vez aprobados los cambios en el PKS, recién entonces aplicarlos al popup auditado.

---

#### Filosofía

Esta auditoría es completamente opcional. Solo se ejecuta cuando el usuario la solicita explícitamente.

No es una revisión de código. No busca bugs, performance, ni calidad de implementación.

La pregunta rectora de cada auditoría debe ser:

> "Si un usuario trabaja ocho horas por día con este popup, ¿cómo puedo hacerle la vida más fácil?"

No se trata de criticar el trabajo realizado. Se trata de detectar oportunidades para que el usuario:
- haga **menos clics**
- use **menos el mouse**
- recorra **menos distancia** con el teclado
- complete formularios **más rápido**
- cometa **menos errores**
- aproveche **mejor el Design System**

**Pero no todas las entidades son iguales.** Antes de recomendar, la auditoría debe entender:

- **Qué** se está auditando (entidad de negocio).
- **Quién** lo usa realmente (perfil del usuario).
- **Cada cuánto** se usa (frecuencia).
- **Para qué** se usa (objetivo de negocio).
- **Qué se puede automatizar** (ahorrar trabajo manual).
- **Qué fricciones específicas de negocio existen** (no solo técnicas).

La misma recomendación no sirve para un Producto que para un Cliente. Una sugerencia que mejora la productividad de un cajero puede entorpecer el trabajo de un administrativo.

**Pero tampoco existe un único escenario para la misma entidad.** Una recomendación que funciona para carga manual puede ser contraproducente para escaneo. La auditoría debe:

1. Identificar los distintos **escenarios de uso** del popup.
2. Evaluar qué comportamiento conviene más a cada escenario.
3. Si hay múltiples escenarios válidos, proponer una solución **adaptable**, no un único comportamiento absoluto.

**Regla de evidencia:**

- **Sin evidencia** → documentar como hipótesis. No recomendar cambios. Marcar como oportunidad para investigar.
- **Evidencia observada** → recomendar con cautela. Priorizar obtener datos antes de implementar.
- **Evidencia confirmada** (métrica, dato de uso real) → recomendar con prioridad.

La auditoría **no impone cambios**. Descubre oportunidades y las clasifica por nivel de evidencia.

**La pregunta definitiva antes de cada recomendación:**

> "¿Estoy mejorando el formulario o estoy mejorando la forma en la que trabaja el usuario?"

Siempre priorizar la segunda opción. Si la mejora es solo para el formulario, quizá el proceso de negocio debería cuestionarse antes.

**Pensar en espacios de trabajo, no en listas de controles.**

El usuario no recorre un array de campos. Recorre una **interfaz**. La navegación debe respetar esa percepción: las flechas deben moverse como si el usuario estuviera desplazándose físicamente por una grilla bidimensional. Cada popup es un espacio de trabajo, no un formulario secuencial.

**Clasificar toda propuesta.** Cada idea debe indicar su estado para distinguir decisiones respaldadas de hipótesis:

| Estado | Cuándo usarlo |
|--------|---------------|
| ✅ Confirmado | Hay evidencia suficiente para implementar |
| 🟡 Probable | Alta probabilidad, implementar con validación rápida |
| 🔵 Heurística UX | Respaldo teórico, implementar si aplica al contexto |
| 🟠 Hipótesis | Requiere investigación antes de decidir |
| ❌ Descartado | Ya se evaluó y se descartó |

Cada mejora identificada debe evaluarse por su potencial de reutilización en el resto del sistema antes de implementarse.

El Design System no crece porque un componente aparezca dos veces. Crece cuando aparece un **concepto reutilizable** y consistente que conviene estabilizar para varios dominios.

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
