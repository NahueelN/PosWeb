# DS-dialog-popup — Estándar de Diálogos y Popups

## Metadata

```yaml
ID: DS-dialog-popup
Type: Design System
Name: Estándar de Diálogos y Popups
Status: Canonical
Priority: Critical
Level: Project
Sources:
  - frontend/src/components/ui/Dialog.tsx
  - frontend/src/components/ui/DialogSection.tsx
  - frontend/src/components/ui/DialogFooter.tsx
  - frontend/src/components/ui/DialogPrimaryField.tsx
  - frontend/src/components/ui/Card.tsx
  - frontend/src/components/ui/Button.tsx
  - frontend/src/index.css
Created: 2026-07-09
Updated: 2026-07-10
Owner: UX
Tags:
  - UX
  - Keyboard
  - Dialog
  - Modal
  - DesignSystem
```

---

## Descripción

Estándar visual y de comportamiento para todos los diálogos, modales, popups, wizards y sheets del sistema POS.

Todo popup del sistema debe sentirse como si hubiera sido diseñado el mismo día, por el mismo equipo de UX, compartiendo la misma jerarquía visual, colores, tipografía, navegación y comportamiento de cierre.

---

## Filosofía

El sistema es un software comercial (POS). La prioridad es:

- velocidad
- legibilidad
- navegación por teclado
- consistencia
- mínima cantidad de clics
- cero distracciones

---

## Principios rectores

### 1. No crear estilos dentro de los popups

**No implementar mejoras visuales directamente en un popup si pueden convertirse en un componente reutilizable del Design System.**

Todo lo visual debe salir de componentes reutilizables. Un popup nuevo se construye ensamblando componentes canónicos, no copiando clases Tailwind.

Los únicos estilos permitidos dentro de un popup son los estructurales (grid, flex, layout del formulario). Colores, headers, botones, inputs, iconos, sombras, radios — todo debe venir de componentes del Design System.

### 2. Un popup nunca se diseña desde cero

Todo popup nuevo debe comenzar reutilizando el popup existente más parecido como plantilla. Solo crear un patrón nuevo cuando no exista uno equivalente documentado en el Design System.

### 3. Cada mejora fortalece el estándar

Cada mejora aprobada en un popup debe evaluarse para convertirse en un estándar global. Si mejora la experiencia y es reutilizable, primero se incorpora al Design System y luego se aplica al popup.

Nunca dejar mejoras importantes solamente en una pantalla. Si vale para un popup, vale para todos.

### 4. Diseño para 1366×768

Todo popup debe entrar completo en 1366×768 sin scroll vertical. El espaciado es compacto pero legible.

---

## Tokens / Valores

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-primary` | `oklch(0.520 0.255 278)` | Fondo de headers de cards, botón principal |
| `--color-primary-light` | `oklch(0.520 0.255 278 / 0.10)` | Fondo de tabs activos, hover suave |
| `--color-primary-hover` | `oklch(0.470 0.230 278)` | Borde inferior de headers |
| `--color-primary-ring` | `oklch(0.520 0.255 278 / 0.25)` | Focus ring de inputs y botones |
| `--shadow-card` | `0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.05)` | Sombra de cards dentro del popup |
| `--shadow-glow` | `0 1px 4px oklch(0.520 0.255 278 / 0.30)` | Sombra de enfoque en botón principal |

---

## Reglas de uso

### Jerarquía visual

Cada popup debe identificar inmediatamente:

- **acción principal** — botón primario (Guardar, Crear, Aceptar)
- **dato principal** — el campo más importante, visualmente protagonista
- **acción secundaria** — botón Cancelar o Cerrar

El dato principal se destaca mediante **tamaño, posición, tipografía y espaciado**. Nunca mediante exceso de colores.

### Cards con headers

Toda sección importante dentro de un popup usa `DialogSection`:

| Popup | Secciones típicas |
|-------|-------------------|
| Producto | Información, Precios, Inventario, Descripción |
| Cliente | Información, Contacto |
| Proveedor | Información, Contacto |
| Combo | Información, Items, Precio |

### Colores

Prohibido hardcodear colores. Todo debe usar variables CSS del theme:

- `var(--color-primary)` — headers, botón principal
- `var(--color-primary-light)` — backgrounds suaves, tabs
- `var(--color-primary-hover)` — hover de headers
- `var(--color-primary-ring)` — focus ring

No usar `indigo-500`, `indigo-600` ni ninguna clase Tailwind de color fijo.

### Iconografía

Solo Lucide React. Todos los iconos deben tener:

- mismo tamaño (`size={16}`)
- mismo stroke (default)
- mismo color (blanco en headers, `text-gray-500` en contenido)
- misma alineación (flex `items-center`)

Los iconos ayudan a identificar secciones. Nunca son decorativos.

### Layout

Preferir dos columnas con cards y agrupación lógica. Evitar formularios largos de una sola columna. No desperdiciar espacio. No dejar grandes áreas vacías.

### Dashboard lateral

Cuando exista información económica (Costo, Precio, Ganancia, Totales, Saldo, Deuda), usar `DialogDashboard` en la columna lateral. No mezclar esos datos con el resto del formulario.

### Inputs

Todos los inputs usan el mismo estilo visual base. Si un campo necesita mayor importancia (dato principal), usar `DialogPrimaryField` que aumenta tamaño y tipografía manteniendo el mismo lenguaje visual.

### Navegación por teclado

Todo popup debe poder usarse completamente con teclado. El estándar no depende solo de un `FIELD_ORDER` lineal.

- **Tab / Shift+Tab** → recorrido lógico de carga.
- **ArrowUp / ArrowDown / ArrowLeft / ArrowRight** → navegación espacial por posición visual.
- **Enter** → avanzar naturalmente o enviar si ya no hay más campos pendientes.
- **Escape** → cerrar popup.

El popup debe soportar `handleFormKeyDown` + `data-field` en cada campo, pero la navegación de flechas debe usar un **Spatial Navigation Model** cuando el layout lo justifique.

| Tecla | Acción |
|-------|--------|
| Enter / ArrowDown | Siguiente campo (según flujo lógico) |
| ArrowUp | Navegar al control espacial superior |
| Tab / Shift+Tab | Navegación lógica de captura |
| Escape | Cerrar popup |
| ArrowLeft / ArrowRight | Navegación espacial entre controles |

Ver implementación de referencia en `ProductFormModal.tsx`.

### Foco adaptativo y Progressive Completion

Cuando un popup se abre con datos precargados o con contexto conocido, el foco debe ir al **primer dato pendiente**, no a un campo fijo.

Reglas:

- Nunca pedirle al usuario información que el sistema ya conoce.
- Si el popup abrió desde una API con datos parciales, saltar automáticamente los campos ya resueltos.
- No usar reglas universales como "siempre Nombre" o "siempre Código de barras".
- El foco inicial debe depender del contexto de apertura.

Esta heurística es reutilizable para cualquier popup futuro que reciba datos precargados o tenga múltiples flujos de entrada.

### Cierre

Popups NO se cierran al hacer click fuera (`closeOnBackdrop={false}`). Solo mediante Cancelar, X o Escape.

### Botones del footer

Usar `DialogFooter` que renderiza ambos botones con `size="md"` y `min-w-[128px]`. Mismo alto y ancho para ambos.

### Tipografía

| Elemento | Clase |
|----------|-------|
| Labels de campo | `text-xs font-semibold text-gray-800` |
| Header de card | `text-sm font-bold uppercase tracking-wider text-white` |
| Input normal | `text-sm` |
| Dato principal | `text-base` |

---

## Checklist de validación

Antes de dar por terminado cualquier popup, validar:

1. **¿Se identifica el dato principal en menos de 1 segundo?**
2. **¿La acción principal (Guardar/Crear/Aceptar) es evidente?**
3. **¿Entra completo en 1366×768 sin scroll?**
4. **¿Se puede completar íntegramente con teclado (Enter, flechas, Tab, Escape)?**
5. **¿No existen colores hardcodeados?** (buscar `indigo-`, `blue-`, `red-` en clases)
6. **¿Utiliza únicamente componentes del Design System?** (DialogSection, DialogFooter, etc.)
7. **¿Respeta la jerarquía visual del sistema?** (dato principal destacado, secciones claras)

Si alguna respuesta es **No**, el popup no cumple el estándar.

---

## Componentes Canónicos

### COMP-Dialog

**Propósito:** Contenedor principal del popup. Maneja apertura, cierre, foco, portal y header visual.

**Archivo:** `frontend/src/components/ui/Dialog.tsx`

**Props:**
- `open: boolean`
- `onClose: () => void`
- `title?: string` — Contexto de la acción (ej. "Nuevo producto", "Editar cliente")
- `icon?: LucideIcon | ReactNode` — Icono Lucide (componente o elemento)
- `highlight?: string` — Nombre de la entidad, se renderiza con más peso visual debajo del título
- `description?: string` — Subtítulo opcional en el body
- `width?: 'sm' | 'md' | 'lg' | 'xl'`
- `children: ReactNode`
- `footer?: ReactNode`
- `closeOnBackdrop?: boolean` — Siempre `false` por estándar

**Comportamiento:**
- Cuando `title` está presente, renderiza `DialogHeader` con fondo `var(--color-primary)`
- Si `highlight` se provee, el título se reduce a `text-sm font-semibold text-white/80` (contexto) y el highlight se muestra debajo como `text-base font-bold text-white` (protagonista)
- El body incluye `overflow-y-auto` para scroll interno
- El contenedor usa `overflow-hidden` para que el header respete el `rounded-2xl`
- `max-h-[85vh]` con `flex flex-col` para que el body ocupe el espacio restante

**Ejemplos de uso:**

```tsx
// Sin highlight
<Dialog title="Nuevo producto" icon={Package} ... />

// Con highlight — el nombre del producto es el protagonista
<Dialog title="Editar producto" icon={Package} highlight={producto.nombre} ... />

// Confirmación
<Dialog title="Eliminar proveedor" icon={Building2} highlight={proveedor.nombre} ... />
```

---

### COMP-DialogHeader

**Propósito:** Header superior del popup con identidad visual del sistema.

**Archivo:** `frontend/src/components/ui/DialogHeader.tsx`

```tsx
<DialogHeader icon={Package} title="Nuevo producto" highlight="Coca Cola 2.25L" onClose={handleClose} />
```

**Diseño visual:**
- Fondo: `var(--color-primary)`
- Texto e iconos: blancos
- Padding: `px-4 py-[10px]`
- **Sin highlight:** título `text-base font-bold` centrado
- **Con highlight:** título `text-sm font-semibold text-white/80` (contexto secundario), highlight `text-base font-bold text-white` (protagonista, indentado 26px para alinear con el texto del título)
- Icono aceptado como componente Lucide (`icon={Package}`) o elemento React (`icon={<Package />}`)
- Botón X a la derecha con hover `var(--color-primary-hover)`

**Jerarquía visual con highlight:**

```
┌──────────────────────────────────────────────┐
│  📦 Nuevo producto                      ✕    │  ← título: contexto
│  Coca Cola 2.25L                             │  ← highlight: protagonista
├──────────────────────────────────────────────┤
```

**Uso desde Dialog:** El Dialog consume automáticamente DialogHeader cuando se provee `title`. No requiere importación manual.

---

### COMP-DialogSection

**Propósito:** Card con header coloreado para agrupar secciones del formulario.

**Archivo:** `frontend/src/components/ui/DialogSection.tsx`

```tsx
<DialogSection icon={Tag} title="Información" className="flex-1">
  {children}
</DialogSection>
```

**Comportamiento:** Renderiza el header con fondo `var(--color-primary)`, texto blanco, icono Lucide. El body usa padding compacto (`p-2`). `overflow-hidden` para respetar `rounded-xl`.

---

### COMP-DialogSectionHeader

**Propósito:** Header reutilizable para cuando se necesita personalizar el contenido fuera de DialogSection.

**Archivo:** `frontend/src/components/ui/DialogSectionHeader.tsx`

```tsx
<DialogSectionHeader icon={Tag} title="Información" />
```

**Uso:** Cuando una sección necesita estructura diferente pero mantener el mismo header visual.

---

### COMP-DialogDashboard

**Propósito:** Card lateral para información económica (Costo, Precio, Ganancia, Totales).

**Archivo:** `frontend/src/components/ui/DialogDashboard.tsx`

```tsx
<DialogDashboard>
  <DialogDashboardRow label="Costo" value="$1.200" />
  <DialogDashboardRow label="Precio" value="$1.800" variant="confirm" />
  <DialogDashboardRow label="Ganancia estimada" value="$600" variant="primary" />
</DialogDashboard>
```

**Comportamiento:** Mismo header que las cards, pero el body usa tipografía de datos: labels a izquierda, valores a derecha, filas compactas.

---

### COMP-DialogFooter

**Propósito:** Footer estándar con botón secundario (Cancelar) y primario (Guardar/Crear/Aceptar).

**Archivo:** `frontend/src/components/ui/DialogFooter.tsx`

```tsx
<DialogFooter
  onCancel={handleCancel}
  onConfirm={handleSubmit}
  confirmText="Guardar"
  confirmDisabled={!isValid}
  confirmLoading={saving}
/>
```

**Comportamiento:** Renderiza `min-w-[128px]` en ambos botones. Soportan navegación con ArrowLeft/ArrowRight.

---

### COMP-DialogPrimaryField

**Propósito:** Wrapper para el dato principal del popup. Más grande visualmente pero mismo lenguaje visual.

**Archivo:** `frontend/src/components/ui/DialogPrimaryField.tsx`

```tsx
<DialogPrimaryField label="Nombre" data-field="nombre">
  <input ... />
</DialogPrimaryField>
```

**Comportamiento:** Label con `text-xs font-semibold text-gray-800 uppercase tracking-wider mb-1`. El input envuelto recibe clases base + `h-10 text-base`.

---

### COMP-DialogTabs

**Propósito:** Toggle de tabs con estilo consistente.

**Archivo:** `frontend/src/components/ui/DialogTabs.tsx`

```tsx
<DialogTabs
  tabs={['General', 'Precios']}
  active={activeTab}
  onChange={setActiveTab}
/>
```

**Comportamiento:** Fondo `var(--color-primary-light)` para el track, texto y fondo del tab activo con `var(--color-primary)`.

---

### COMP-DialogActions

**Propósito:** Contenedor de botones de acción dentro del footer. Renderiza los botones con navegación por flechas.

**Archivo:** `frontend/src/components/ui/DialogActions.tsx`

```tsx
<DialogActions>
  <Button variant="secondary">Cancelar</Button>
  <Button variant="primary">Guardar</Button>
</DialogActions>
```

**Comportamiento:** Flex row con `gap-3`, `justify-end`. Los botones hijos reciben navegación ArrowLeft/ArrowRight automática.

---

### COMP-ErrorBoundary

**Propósito:** Captura errores de render en el contenido del popup y reporta sin acoplamiento.

**Archivo:** `frontend/src/components/ui/ErrorBoundary.tsx`

**Relación:** Se integra dentro de `COMP-Dialog` (no es un componente visible, es un wrapper).

**Props:**
- `onUnexpectedError?: (error: Error) => void` — callback opcional. NUNCA recibe notifyError, dialogs, logging, ni Sentry.
- `fallback?: ReactNode` — UI alternativa cuando hay error. Default: `null`.

**Comportamiento:**
- `componentDidCatch(error)` llama a `this.props.onUnexpectedError?.(error)`.
- No conoce notificaciones, dialogs, ni ningún sistema de logging.
- COMP-Dialog consume el callback y decide la UX: `notifyError(err.message); onClose()`.

**Reglas de evolución:**
- El ErrorBoundary NO debe modificarse para agregar logging, Sentry o telemetry. Esa lógica va en el callback de COMP-Dialog.
- El ErrorBoundary NO debe depender de NotificationContext ni de ningún hook de React.

> Ver `ADR-error-handling-dialogs` para el razonamiento completo y alternativas descartadas.

---

## Razonamiento de UX

Este estándar implementa las decisiones documentadas en `KI-ux-dialog-rationale`. Las decisiones clave que explican POR QUÉ el estándar es como es:

| Decisión | Resumen | Documento |
|----------|---------|-----------|
| Header del Dialog con identidad visual | El usuario primero identifica la acción, después el contenido. El Dialog necesita un marco visual propio. | KI-ux-dialog-rationale#D1 |
| Header unificado para cards internas | Todas las secciones representan el mismo concepto. Un único componente evita carga cognitiva. | KI-ux-dialog-rationale#D2 |
| Jerarquía visual | No todos los campos tienen el mismo peso. Acción → Entidad → Dato clave. | KI-ux-dialog-rationale#D3 |
| Highlight genérico | El título es la acción (contexto secundario). El highlight es la entidad (protagonista). | KI-ux-dialog-rationale#D4 |
| Dato principal | Cada entidad tiene un campo definitorio que debe destacar visualmente. | KI-ux-dialog-rationale#D5 |
| Dashboard lateral | Datos económicos separados del formulario para no mezclar edición con consulta. | KI-ux-dialog-rationale#D6 |

> Ver `KI-ux-dialog-rationale` para el razonamiento completo, alternativas descartadas, y la evaluación pre-migración.

---

## Relaciones

```yaml
RELATIONS:
  - type: IMPLEMENTS
    target: KI-ux-dialog-rationale
  - type: USES
    target: COMP-Dialog
  - type: USES
    target: COMP-DialogHeader
  - type: USES
    target: COMP-DialogSection
  - type: USES
    target: COMP-DialogSectionHeader
  - type: USES
    target: COMP-DialogDashboard
  - type: USES
    target: COMP-DialogFooter
  - type: USES
    target: COMP-DialogPrimaryField
  - type: USES
    target: COMP-DialogTabs
  - type: USES
    target: COMP-DialogActions
  - type: USES
    target: COMP-ErrorBoundary
  - type: RELATED
    target: ADR-error-handling-dialogs
  - type: RELATED
    target: STAND-pr-narrative
  - type: IMPLEMENTS
    target: LAYOUT-page-shell
```

---

## Historial

| Fecha | Cambio |
|-------|--------|
| 2026-07-09 | Creación del estándar. Definición de componentes canónicos, checklist, reglas de evolución. |
| 2026-07-09 | COMP-DialogHeader: nuevo header primario con icono opcional y X integrada. COMP-Dialog actualizado: overflow-hidden, icon prop, consume DialogHeader. |
| 2026-07-09 | COMP-DialogHeader: soporte para `highlight` (entidad protagonista debajo del título). Icono acepta componente Lucide o elemento React. Jerarquía visual: título como contexto secundario, highlight como protagonista. |
| 2026-07-09 | COMP-ErrorBoundary: decoupled, solo onUnexpectedError opcional. COMP-Dialog consume y decide UX. 4 categorías de error. Agregada referencia a ADR-error-handling-dialogs. |
| 2026-07-09 | Agregada sección de Razonamiento de UX referenciando KI-ux-dialog-rationale. Relación actualizada. |
