# KI-ux-dialog-rationale — Decisiones de UX para Diálogos

## Metadata

```yaml
ID: KI-ux-dialog-rationale
Type: UX Rationale
Name: Decisiones de UX para Diálogos
Status: Canonical
Priority: Critical
Level: Project
Sources:
  - frontend/src/components/ui/Dialog.tsx
  - frontend/src/components/ui/DialogHeader.tsx
  - frontend/src/components/ui/DialogSection.tsx
  - frontend/src/components/ui/DialogSectionHeader.tsx
  - frontend/src/components/ui/DialogPrimaryField.tsx
  - frontend/src/components/ui/DialogDashboard.tsx
  - frontend/src/components/ui/DialogFooter.tsx
  - docs/knowledge/projects/posweb/DS-dialog-popup.md
  - docs/PROJECT_COMPANION.md
  - frontend/src/components/ProductFormModal.tsx
Created: 2026-07-09
Updated: 2026-07-10
Owner: UX
Tags:
  - UX
  - Dialog
  - VisualHierarchy
  - DesignDecision
  - Migration
```

---

## Contexto

Hasta julio 2026, los popups del sistema POS no compartían un lenguaje visual común. Cada popup definía sus propios estilos: algunos tenían título flotante sin marco, otros usaban banners de colores distintos, los campos se veían todos iguales sin jerarquía, y la información económica aparecía mezclada con el formulario.

Cuando se desarrolló `ProductFormModal`, se tomó la decisión consciente de no diseñar "un popup más", sino de establecer el **modelo de UX** que todos los popups del sistema deben seguir. Este Knowledge Item captura el razonamiento detrás de cada decisión para que el Companion lo recupere automáticamente durante futuras migraciones y no tenga que re-discutir lo que ya está resuelto.

---

## Decisiones de UX

Cada decisión incluye: **qué se decidió**, **por qué**, **qué alternativas se consideraron** (aunque sea informalmente), y **cómo impacta al usuario**.

---

### D1. Header del Dialog con identidad visual

**Decisión:** El popup completo debe tener un header propio con fondo `var(--color-primary)`, texto blanco, icono Lucide, y botón X integrado.

**Razonamiento:**

> El usuario primero identifica la acción que está realizando. Después identifica el contenido.

El Dialog no es un contenedor invisible — es el **marco visual** de la operación. El header le dice al usuario "estás acá, esto es lo que estás haciendo". Sin ese marco visual, el popup se siente como un div flotante más.

**Alternativas descartadas:**

| Alternativa | Motivo de descarte |
|-------------|-------------------|
| Título flotante sin header | El usuario no identifica la acción inmediatamente |
| Header solo con borde superior (sin fondo de color) | No hay suficiente identidad visual, el popup se mezcla con el fondo |
| Header con color secundario (gris, slate) | No se diferencia de las cards internas. El popup debe ser el nivel jerárquico superior |

**Jerarquía visual resultante:**

```
Nivel 1: Dialog (marco principal) — header con color primario
Nivel 2: DialogSection (cards internas) — header con color primario
           → Mismo color, pero las cards se distinguen por su borde, sombra y padding
Nivel 3: Contenido del formulario — inputs, labels, datos
```

---

### D2. Header unificado para todas las cards internas

**Decisión:** Todas las secciones internas del popup usan exactamente el mismo componente `DialogSectionHeader`. No existen variantes por sección (Información usa uno distinto a Inventario, etc.).

**Razonamiento:**

> Información, Inventario, Precios, Contacto, Configuración — todas representan exactamente el mismo concepto: "una sección del formulario".

Si cada sección tuviera un estilo distinto, el usuario tendría que aprender visualmente cada una. Al compartir el mismo componente, el usuario reconoce instantáneamente "esto es una sección" sin importar su contenido.

**Alternativas descartadas:**

| Alternativa | Motivo de descarte |
|-------------|-------------------|
| Estilos distintos por sección (colores, íconos distintos) | Mayor carga cognitiva. El usuario aprende un patrón único y lo aplica a todas las secciones |
| Sin header de sección, solo texto de label | No hay agrupación visual clara. El formulario se siente como una lista plana de campos |
| Header con íconos distintos por sección | Los íconos son contextuales pero el componente es el mismo. La diferencia está en el ícono que se pasa como prop, no en el estilo |

**Nota:** Los íconos de las cards SÍ varían por sección (`Tag`, `Package`, `DollarSign`) porque ayudan a identificar el contenido. El **componente** es el mismo — el ícono es un prop.

---

### D3. Jerarquía visual del popup

**Decisión:** Cada popup debe identificar automáticamente tres niveles: (1) qué acción estoy realizando, (2) sobre qué entidad estoy trabajando, (3) cuál es el dato más importante.

**Razonamiento:**

> No todos los campos tienen el mismo peso visual.

En un sistema POS, la velocidad es crítica. El usuario no debe escanear todo el formulario para encontrar lo que necesita. Debe llegar al popup y en **menos de 1 segundo** saber:

1. **Acción:** "Estoy creando un producto" → lo dice el header del Dialog
2. **Entidad:** "Sobre Coca Cola 2.25L" → lo dice el context/highlight
3. **Dato clave:** "El nombre del producto" → lo dice el DialogPrimaryField

**Alternativas descartadas:**

| Alternativa | Motivo de descarte |
|-------------|-------------------|
| Todos los campos iguales | El usuario pierde tiempo identificando el campo principal |
| El dato principal se destaca con color llamativo | Rompe la paleta del sistema. Mejor usar tamaño y posición (tipografía) |

---

### D4. Highlight como mecanismo genérico

**Decisión:** El DialogHeader soporta `title` (la acción) y `highlight` (sobre qué entidad), sin importar cómo se llame la entidad. Es completamente genérico.

**Razonamiento:**

> El título explica la acción. El highlight explica sobre qué objeto se está trabajando.

El usuario necesita identificar ambas cosas inmediatamente, pero no tienen el mismo peso:

- **La acción** es contexto: "estoy editando" → texto secundario
- **La entidad** es el protagonista: "Coca Cola 2.25L" → texto principal

Al ser genérico, el mismo mecanismo funciona para Producto (`highlight={producto.nombre}`), Cliente (`highlight={cliente.razonSocial}`), Proveedor (`highlight={proveedor.nombre}`), etc.

**Alternativas descartadas:**

| Alternativa | Motivo de descarte |
|-------------|-------------------|
| Prop específico por tipo de entidad (`productName`, `clientName`) | Cada popup requeriría props distintas. Rompe la genericidad del Dialog |
| Sin highlight, solo título completo ("Editar producto Coca Cola") | La entidad compite con la acción. El usuario no distingue qué es contexto y qué es protagonista |
| Highlight como prop opcional con render condicional | Es exactamente lo que decidimos. No hay alternativa mejor |

**Efecto visual:**

```
┌──────────────────────────────────────────────┐
│  📦 Nuevo producto                      ✕    │  ← title: text-sm, semibold, white/80
│  Coca Cola 2.25L                             │  ← highlight: text-base, bold, white
├──────────────────────────────────────────────┤
```

---

### D5. Dato principal del formulario (DialogPrimaryField)

**Decisión:** Cada popup debe definir un único dato protagonista con mayor jerarquía visual.

**Razonamiento:**

> No todos los inputs deben verse iguales.

Cada entidad tiene un campo que la define:
- **Producto** → Nombre
- **Cliente** → Razón Social
- **Proveedor** → Nombre
- **Sucursal** → Nombre
- **Combo** → Nombre
- **Oferta** → Descripción
- **Caja** → Importe

Ese campo debe destacar visualmente — no con color, sino con **tamaño de input, tipografía y espaciado**.

**Mecanismo:** `DialogPrimaryField` wrapper que:
- Mantiene el mismo label que los otros campos (consistencia)
- Aumenta el input a `h-10 text-base` (vs `h-9 text-sm` del resto)
- Se posiciona primero en el formulario

**Alternativas descartadas:**

| Alternativa | Motivo de descarte |
|-------------|-------------------|
| Todos los inputs del mismo tamaño | No hay jerarquía visual. El usuario no identifica el campo principal |
| El dato principal se destaca con color de fondo | Rompe la consistencia visual. El sistema usa fondo blanco en todos los inputs |
| Input más grande pero con estilo distinto (borde, sombra) | Agrega ruido visual innecesario. La altura y tipografía son suficientes |

---

### D6. Dashboard lateral para información económica

**Decisión:** Cuando exista información económica (Costo, Precio, Ganancia, Totales, Saldo, Deuda), usar `DialogDashboard` en la columna lateral. No mezclar esos datos con el formulario.

**Razonamiento:**

La información económica tiene una naturaleza distinta al resto del formulario:
- Es **informativa**, no es editable (o se edita indirectamente)
- Suele ser el resultado de cálculos
- El usuario la consulta para tomar decisiones, no para completar campos

Mezclarla con el formulario obliga al usuario a filtrar visualmente "esto es un dato que cargo" vs "esto es un dato que consulto".

**Alternativas descartadas:**

| Alternativa | Motivo de descarte |
|-------------|-------------------|
| Datos económicos dentro de DialogSection | Se mezclan con los campos editables. El usuario no distingue qué edita y qué consulta |
| Datos económicos en fila separada sin card | No hay agrupación visual. Los datos pierden contexto |
| Sin dashboard, solo labels | Información económica presentada sin jerarquía |

---

### D7. Evaluación pre-migración para futuros popups

**Decisión:** Antes de migrar cualquier popup, el Companion debe evaluar explícitamente un conjunto de preguntas. No aplicar las decisiones automáticamente — evaluar cada popup según su contexto.

**Razonamiento:**

> No todos los popups son iguales. El estándar existe, pero cada popup necesita su propio análisis.

Si las decisiones se aplicaran automáticamente, se correría el riesgo de:
- Forzar un `DialogPrimaryField` donde no existe un dato protagonista claro
- Forzar un `DialogDashboard` donde no hay información económica
- Forzar un `highlight` cuando el popup es una confirmación simple

El Companion debe evaluar y **justificar** cada respuesta. Si una no aplica, debe explicar por qué.

---

### D8. Un único formulario por entidad

**Decisión:** Cada entidad del sistema debe tener un único formulario. Las variaciones de comportamiento se resuelven mediante controles internos (checkbox, select, toggle), no mediante formularios duplicados.

**Razonamiento:**

> Producto normal y Producto por peso no son dos entidades distintas. Son la misma entidad con una característica diferente.

Se eliminó la separación visual entre "Producto normal" y "Producto por peso" (anteriormente un toggle de dos botones) y se reemplazó por un único checkbox "Se vende por peso". El mismo formulario se adapta según el estado del checkbox:

| Característica | Checkbox desmarcado | Checkbox marcado |
|----------------|-------------------|------------------|
| Unidad de medida | Seleccionable por el usuario | Forzado a KG, disabled |
| Código de barras | Obligatorio | Opcional |
| Contenido | Visible | Oculto |
| Venta | Por unidad | Por peso |

**Alternativas descartadas:**

| Alternativa | Motivo de descarte |
|-------------|-------------------|
| Dos formularios separados (ProductoNormalForm, ProductoPesoForm) | Duplicación de código, doble mantenimiento, inconsistencias inevitables |
| Toggle visual con dos modos (el anterior) | Ocupaba espacio innecesario en el header del formulario y sugería dos tipos distintos de producto |
| Página separada para configuración de pesables | Agrega complejidad innecesaria para un atributo que pertenece al producto |

**Consecuencias para el sistema:**

Este patrón — un formulario por entidad con comportamiento adaptable — debe aplicarse siempre que una entidad tenga variaciones que puedan resolverse mediante el estado de un campo:
- Si la diferencia es **comportamental** (validaciones, obligatoriedad, visibilidad) → checkbox/select dentro del mismo formulario.
- Si la diferencia es **estructural** (campos completamente distintos, flujos diferentes) → evaluar si realmente es la misma entidad.

---

### D9. Progressive Completion

**Decisión:** Cuando el sistema ya conoce parte de la información de la entidad, el popup debe saltar automáticamente al primer dato pendiente en lugar de pedirle al usuario que repita lo ya resuelto.

**Razonamiento:**

> El usuario no debería volver a escribir lo que el sistema ya sabe.

Esto reduce fricción en flujos con APIs precargadas, ediciones parciales y cargas masivas. La heurística no depende de OpenFoodFacts: aplica a cualquier fuente que entregue datos parciales.

**Alternativas descartadas:**

| Alternativa | Motivo de descarte |
|-------------|-------------------|
| Foco fijo siempre igual | Obliga al usuario a recorrer campos ya resueltos |
| Saltar solo para OpenFoodFacts | La heurística quedaría acoplada a una API concreta |
| Mostrar todo como editable aunque ya venga completo | Rompe el ritmo de carga y duplica trabajo |

---

### D10. Adaptive Focus

**Decisión:** El foco inicial debe depender del contexto de apertura del popup. No existe un foco universal correcto.

**Razonamiento:**

> El mejor foco inicial es el que preserva el ritmo de trabajo del usuario en ese escenario.

El foco cambia según cómo se abrió el popup: carga manual, escáner, datos precargados, edición. Si el contexto es inequívoco, el sistema decide solo. Si no lo es, debe usar la heurística más conservadora para el trabajo del usuario.

**Alternativas descartadas:**

| Alternativa | Motivo de descarte |
|-------------|-------------------|
| Siempre Nombre | Sirve para carga manual, pero rompe el flujo de escáner |
| Siempre Código de barras | Sirve para escáner, pero rompe la carga manual |
| Foco fijo por tipo de entidad | No contempla diferencias entre flujos de entrada |

---

### D11. Spatial Navigation Model

**Decisión:** La navegación con flechas debe seguir la posición física de los controles en pantalla y no un array lineal único.

**Razonamiento:**

> El usuario recorre una interfaz, no una lista.

En popups de dos columnas o layouts complejos, las flechas deben moverse como en una grilla bidimensional. Esto mantiene la navegación natural, reduce backtracking y respeta la lectura espacial del usuario.

**Alternativas descartadas:**

| Alternativa | Motivo de descarte |
|-------------|-------------------|
| Solo FIELD_ORDER | Ignora la posición visual real |
| Flechas como Tab duplicado | Pierde la intención espacial |
| Navegación implícita sin estándar | Inconsistencias entre popups futuros |

**Ejemplos de aplicación futura:**
- Cliente → Persona física / Jurídica (checkbox "Es empresa" → cambia validaciones de CUIT, razón social)
- Comprobante → Factura A / Factura B (select tipo → cambia cálculos de IVA)

## Evaluación pre-migración

Antes de migrar cualquier popup existente, el Companion DEBE responder estas preguntas y documentar cada respuesta en el plan de migración:

```yaml
# Evaluación pre-migración — responder antes de implementar
popup: nombre del popup (ej: ClientesPage, ProveedoresPage)

questions:
  - id: protagonista
    text: "¿Existe un dato protagonista?"
    expected: siempre que la entidad tenga un campo definitorio
    examples:
      Producto: true → Nombre
      Cliente: true → Razón Social
      Proveedor: true → Nombre
      Confirmación simple: false → no aplica
    action: si true, usar DialogPrimaryField. Si false, justificar por qué no aplica.

  - id: highlight
    text: "¿Conviene usar context debajo del título?"
    expected: true cuando el popup opera sobre una entidad existente (editar, eliminar)
    examples:
      Editar producto: true → producto.nombre
      Nuevo producto: false → no hay entidad existente
      Confirmación genérica: false → no hay entidad específica
    action: si true, usar highlight prop en Dialog. Si false, justificar.

  - id: dashboard
    text: "¿Existe información económica que deba ir a un Dashboard?"
    expected: true cuando el popup muestra Costo, Precio, Ganancia, Totales, Saldo, Deuda
    examples:
      Producto: true → Costo, Precio, Ganancia estimada
      Cliente: false → no hay datos económicos en el popup de edición
      Caja: true → Importe, Saldo
      Combo: true → Costo total, Precio total
    action: si true, usar DialogDashboard en columna lateral. Si false, justificar.

  - id: columnas
    text: "¿El popup necesita dos columnas?"
    expected: true cuando hay 3+ secciones o el formulario es largo
    examples:
      Producto: true → Información + Precios | Inventario + Descripción
      Cliente: true → Información + Contacto
      Confirmación simple: false → una columna, un mensaje
    action: si true, diseñar layout con dos columnas. Si false, justificar.

  - id: sections
    text: "¿Puede reutilizar DialogSection?"
    expected: true siempre que el popup tenga secciones agrupables
    examples:
      Producto: true → Información, Precios, Inventario, Descripción
      Cliente: true → Información, Contacto
      Confirmación simple: false → no hay secciones
    action: si true, identificar cada sección con icon + title. Si false, justificar.

  - id: primary_field
    text: "¿Puede reutilizar DialogPrimaryField?"
    expected: idéntico a "protagonista"
    action: si true, el campo protagonista usa DialogPrimaryField en lugar de input común.

  - id: dashboard_component
    text: "¿Puede reutilizar DialogDashboard?"
    expected: idéntico a "dashboard"
    action: si true, los datos económicos se muestran en DialogDashboard.
```

**Regla:** Si alguna respuesta es `false` y el flag `expected` era `true` para ese tipo de popup, el Companion DEBE justificar explícitamente por qué no aplica en este caso particular. No se acepta "no aplica" sin explicación.

**Ejemplo de justificación válida:**

> Popup: ConfirmarEliminarProducto
> - protagonista: `false` — "No hay un campo protagonista porque es un popup de confirmación con solo un mensaje y botones. El protagonista visual es el mensaje de advertencia, no un campo de formulario."
> - highlight: `true` — "Se usa highlight con el nombre del producto para que el usuario confirme visualmente qué está eliminando."
> - dashboard: `false` — "No hay información económica en una confirmación de eliminación."
> - columnas: `false` — "No necesita dos columnas porque solo hay un mensaje central."

---

## Heurísticas de decisión

Las preguntas de evaluación pre-migración verifican **qué** tiene el popup. Las heurísticas de decisión verifican **cómo** debe pensar el Companion antes de reutilizar cualquier patrón del popup de Productos o de cualquier implementación existente.

Estas heurísticas son el **filtro de razonamiento** que evita copiar ciegamente una pantalla en lugar de reutilizar un patrón.

> No migrar pantallas. Migrar conocimiento.

### H1. ¿Esta decisión mejora la comprensión del usuario?

Si la decisión ayuda al usuario a entender más rápido qué está viendo o qué tiene que hacer:

→ **reutilizar el patrón.**

Si no:

→ **no aplicarlo.**

*Fundamento:* Toda decisión de UX existe para reducir la fricción del usuario. Si no la reduce, no tiene sentido replicarla.

---

### H2. ¿Esta decisión reduce la cantidad de clics o tiempo de búsqueda?

Si la decisión acelera la operación del usuario:

→ **aplicar.**

*Fundamento:* Un sistema POS se usa bajo presión de tiempo. Cada milisegundo cuenta. Si un patrón no acelera, no pertenece al sistema.

---

### H3. ¿Esta decisión aumenta la consistencia con el resto del sistema?

Si aplicar el mismo patrón en otro popup hace que el sistema sea más predecible:

→ **aplicar.**

*Fundamento:* La consistencia es el atajo cognitivo más poderoso. Cuando el usuario aprende un patrón una vez, debe poder usarlo en cualquier popup.

---

### H4. ¿Existe ya un componente del Design System que resuelva esto?

Si el componente existe:

→ **reutilizarlo. Nunca crear uno nuevo.**

Si no existe:

→ evaluar si el patrón es reutilizable antes de implementarlo. Si lo es, crear el componente en el Design System primero.

*Fundamento:* Cada componente nuevo que no pasa por el Design System es deuda técnica visual. Dos popups no deben resolver el mismo problema visual de formas distintas.

---

### H5. ¿Estoy copiando una pantalla o reutilizando un patrón?

**Siempre preferir reutilizar el patrón. Nunca copiar una implementación.**

*Distinción:*

| Copiar una pantalla | Reutilizar un patrón |
|---------------------|----------------------|
| "Productos tiene un header azul con icono, así que Clientes también lo tiene" | "Los popups necesitan un marco visual que identifique la acción → uso DialogHeader" |
| "Productos usa DialogPrimaryField para el nombre, así que Proveedores también" | "Cada entidad tiene un campo definitorio → uso DialogPrimaryField cuando existe" |
| Se copia el código, se cambian los nombres | Se identifica el concepto, se aplica el componente |

*Fundamento:* Copiar una pantalla congela el estado actual del código. Reutilizar un patrón evoluciona con el Design System. Cuando el header cambie, todos los popups que usan DialogHeader se actualizan automáticamente. Los que copiaron el código de Productos, no.

---

### H6. ¿El popup tiene un dato protagonista?

Si sí:

→ **usar DialogPrimaryField.**

Si no:

→ **justificar por qué.** (Ej: "es un popup de confirmación sin formulario")

---

### H7. ¿El popup tiene información económica?

Si sí:

→ **usar DialogDashboard.**

Si no:

→ **justificar por qué.**

---

### H8. ¿El popup necesita contexto de la entidad?

Si el usuario necesita identificar rápidamente sobre qué objeto está trabajando:

→ **usar highlight.**

Si no:

→ **no utilizarlo.**

*Guía:* En operaciones de edición o eliminación, casi siempre sí. En operaciones de creación (donde la entidad aún no existe), generalmente no.

---

### H9. ¿El popup necesita identidad visual?

**La respuesta casi siempre será sí.**

Por lo tanto:

→ **utilizar DialogHeader.**

*Excepción:* Popups embebidos (no modales), tooltips, o componentes que no son el marco principal de una operación.

---

## Flujo de decisión del Companion

Antes de migrar cualquier popup, el Companion DEBE seguir este flujo obligatorio:

```
Project Init
│
▼
Leer Project Companion
│
▼
PKS Discovery
│
▼
Leer ADR relacionados con el módulo
│
▼
Leer KI relacionados con el módulo
│
▼
Evaluación pre-migración (preguntas + heurísticas)
│
▼
Proponer la estrategia de migración
│
▼
Esperar aprobación del usuario
│
▼
Implementar
│
▼
¿Apareció un patrón reutilizable?
├── Sí → 1. Actualizar Design System (DS-*)
│        2. Actualizar KI correspondiente
│        3. Actualizar ADR si cambia una decisión arquitectónica
│        4. Recién después aplicar la mejora en el popup actual
│
└── No → Continuar
```

**Regla de oro:** Si durante la implementación se descubre un patrón que podría ser reutilizable, NO se implementa directamente en el popup. Primero se actualiza el PKS, luego se implementa en el popup.

Este flujo aplica tanto a migraciones completas como a mejoras puntuales dentro de un popup existente.

---

## Consecuencias

### Qué habilita

- **Consistencia garantizada**: Todos los popups del sistema se ven y se comportan igual, independientemente de quién los implementó o cuándo.
- **Decisiones aceleradas**: El Companion no necesita re-discutir cada decisión de UX en cada migración — solo evaluar las preguntas de la checklist.
- **Razonamiento trazable**: Cada decisión tiene un "por qué" documentado. Cuando alguien nuevo (humano o IA) llegue al proyecto, entiende no solo cómo se ve el popup, sino por qué se diseñó así.

### Qué obliga

- **Evaluación explícita**: Cada migración DEBE pasar por las 7 preguntas de evaluación. No hay migraciones sin análisis previo.
- **Justificación de excepciones**: Si una decisión no aplica, hay que explicar por qué. No se puede omitir.

### Qué limita

- El estándar asume popups de tipo formulario/edición. Popups de tipo confirmación, sheet lateral o wizard pueden necesitar extensiones de este — en ese caso, se crea un nuevo KI y se relaciona con este.

---

## Cuándo reconsiderar

- Cuando aparezca un tipo de popup que no encaje en este modelo (ej: sheet lateral, wizard multi-paso, drawer de búsqueda).
- Cuando la experiencia de usuario en producción muestre que alguna decisión causa fricción (ej: usuarios confundidos por el highlight que se superpone al título).
- Cuando el Design System agregue nuevos componentes que cambien la jerarquía visual (ej: un nuevo tipo de input protagonista).

---

## Relaciones

```yaml
RELATIONS:
  - type: DRIVES
    target: DS-dialog-popup
  - type: RELATED
    target: ADR-error-handling-dialogs
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-07-09 | Creación del KI. Documentación de 7 decisiones de UX con razonamiento y alternativas descartadas. Definición de evaluación pre-migración con 7 preguntas y regla de justificación explícita. |
| 2026-07-09 | Agregadas Heurísticas de decisión (H1-H9), flujo de decisión obligatorio del Companion, y principio rector "No migrar pantallas. Migrar conocimiento." |
| 2026-07-09 | D8: Un único formulario por entidad. Reemplazo de toggle Producto normal/peso por checkbox único. Documentación del patrón de formulario adaptable. |
