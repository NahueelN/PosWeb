# Entity Pages — Arquitectura del patrón

> Estándar de desarrollo para pantallas de administración de entidades en PosWeb.
> Workflow-first. Los componentes implementan etapas del flujo, no al revés.

---

## Problema que resuelve

PosWeb tiene 7 pantallas que administran entidades (Clientes, Proveedores, Productos, Sucursales, Combos, Gastos, Usuarios). Cada una implementa su propio ciclo de carga, búsqueda, formulario, paginación y gestión de foco. No existe un estándar — cada pantalla decide independientemente su arquitectura.

Este documento define el **workflow canónico** que toda Entity Page debe seguir. Los componentes y hooks existen para implementar ese workflow, no para reemplazarlo.

---

## Workflow

```
                         ENTER
                           │
                           ▼
                       ┌───────┐
                       │ LOAD  │ ◄── búsqueda / paginación / refresh
                       └───┬───┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          ┌───────┐   ┌────────┐   ┌───────┐
          │ EMPTY │   │ READY  │   │ ERROR │
          └───┬───┘   └───┬────┘   └───┬───┘
              │           │            │ dismiss
              │      ┌────┼────┐       │
              │      │    │    │       │
              │  ┌───▼──┐┌─▼──┐│       │
              │  │CREATE││EDIT││       │
              │  └───┬──┘└─┬──┘│       │
              │      │     │   │       │
              │      └──┬──┘   │       │
              │         │      │       │
              │    ┌────▼──┐   │       │
              │    │SAVING │   │       │
              │    └────┬──┘   │       │
              │         │      │       │
              │    ┌────▼──┐   │       │
              │    │DONE   │   │       │
              │    └────┬──┘   │       │
              │         │      │       │
              └─────────┴──────┘       │
                        │              │
                   ┌────▼────┐         │
                   │ REFRESH │◄────────┘
                   └────┬────┘
                        │
                   ┌────▼────┐
                   │  FOCUS  │
                   │  BACK   │
                   └────┬────┘
                        │
                   ┌────▼────┐
                   │  READY  │  ← ciclo completo
                   └─────────┘
```

## Estados

| Estado | Significado |
|---|---|
| `LOAD` | Carga inicial, búsqueda en curso, cambio de página. |
| `READY` | Datos disponibles, entidades visibles. |
| `EMPTY` | Datos cargados, cero resultados. |
| `ERROR` | La API devolvió error. Recuperable. |
| `CREATE` | Modal abierto para crear una entidad nueva. |
| `EDIT` | Modal abierto para editar una entidad existente. |
| `SAVING` | El formulario está enviándose a la API. |
| `DONE` | Operación completada con éxito. Transición inmediata a REFRESH. |
| `REFRESH` | Recarga de datos post-operación. |
| `FOCUS BACK` | El foco vuelve al elemento activo antes de la operación. |

## Etapas del workflow

### 1. ENTER → LOAD

La página monta. Se dispara la carga inicial. Búsqueda vacía, página 1.

### 2. LOAD → READY / EMPTY / ERROR

La API responde. Tres resultados posibles.

### 3. READY → Buscar

El operador escribe en el search. Debounce de 300ms. Se vuelve a LOAD con el término.

### 4. READY → Seleccionar

El operador elige una entidad (click en fila, Enter en card). Se abre CREATE o EDIT según corresponda.

### 5. CREATE / EDIT → SAVING

El operador completa el formulario y confirma. El formulario se envía a la API.

### 6. SAVING → ERROR / DONE

La API responde. Si error, se muestra en el modal (no se cierra). Si éxito: DONE.

### 7. DONE → REFRESH

Transición inmediata. Se recarga la lista para reflejar el cambio.

### 8. REFRESH → FOCUS BACK → READY

Tras recargar, el foco vuelve al search (o al elemento que tenía el foco antes de la operación). La página queda lista para la siguiente operación.

### 9. CREATE / EDIT → READY (cancelar)

Escape o click en Cancelar cierra el modal sin guardar. El foco vuelve al search.

---

## Contrato de Entity Page

Toda Entity Page debe poder responder:

| Pregunta | Responsable |
|---|---|
| ¿Cómo carga? | `EntityList` — hook de datos |
| ¿Cómo busca? | `EntitySearch` — hook de búsqueda |
| ¿Cómo identifica una entidad? | El dominio define un `id` o clave única |
| ¿Cómo crea? | `EntityForm` — hook de formulario + API POST |
| ¿Cómo actualiza? | `EntityForm` — hook de formulario + API PUT |
| ¿Cómo elimina? | `EntityForm` — hook + confirmación + API DELETE |
| ¿Cómo valida? | El dominio. Validación mínima: campo requerido. |
| ¿Cómo recupera el foco? | `EntityForm.closeForm()` → `searchRef.focus()` |

---

## Obligatorio — Todo Entity Page debe cumplir

1. **Workflow completo.** La página debe implementar todas las etapas del flujo, incluso si algunas son no-op (ej: sin paginación, sin eliminación).
2. **PageShell como wrapper.** Header, subtítulo con contador de entidades.
3. **EntityToolbar.** Search + botón "Nuevo".
4. **Búsqueda con debounce (300ms).** Consistente en todas las Entity Pages.
5. **Modal con Dialog.** Escape, focus trap, consistencia visual.
6. **Footer del modal: Cancelar / Guardar.** Nomenclatura estándar.
7. **AlertBanner para errores de carga.** Dismissible.
8. **EmptyState con mensaje contextual.** Diferencia "sin resultados" de "no hay entidades".
9. **Foco al search al cerrar modal.** Sin pérdida de foco.
10. **Tres estados de carga.** loading → ready / empty / error.

## Opcional — Depende del dominio

- **Paginación.** Cuando la entidad puede superar 50 registros.
- **Tabs.** Cuando la pantalla agrupa entidades relacionadas.
- **Cards.** Cuando la entidad tiene representación visual rica.
- **Resúmenes / totales.** Cuando el dominio tiene agregados.
- **Delete con confirmación.** Cuando la entidad soporta eliminación.
- **Filtros adicionales.** Cuando búsqueda por texto no alcanza.

## No pertenece al patrón — Específico del dominio

- Campos del formulario.
- Validaciones específicas.
- Columnas de la lista.
- Llamadas a API concretas.
- Reglas de negocio.

---

## Ownership — Separación de responsabilidades

| Módulo | Conoce | No conoce |
|---|---|---|
| `EntityList` | Datos, loading, error | Formularios, búsqueda |
| `EntitySearch` | Búsqueda, debounce | API, entidades |
| `EntityForm` | Formulario, edición, saving | Búsqueda, paginación |
| `EntityPagination` | Página actual, total | Búsqueda, formularios |

---

## EntityList — Representación

`EntityList` es el contenedor de representación. No asume que siempre es una tabla. La representación es un slot:

- **Tabla**: `columns` + `rows`.
- **Cards**: `renderItem`.
- **Árbol**, **lista**, etc.

El patrón no cierra la puerta a otras representaciones.

---

## Implementación de referencia

ClientesPage y ProveedoresPage son las implementaciones canónicas de este patrón. Cualquier nueva Entity Page (Marcas, Categorías, Sucursales, Rubros, Depósitos) debe seguir este workflow y reutilizar los mismos hooks y componentes.
