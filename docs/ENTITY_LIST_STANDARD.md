# Entity List — Estándar de UX

> Criterios de diseño para listas de entidades en PosWeb.
> Pensado desde el operador. No desde los componentes.

---

## Principio fundamental

**Cada lista debe ayudar al operador a tomar una decisión en menos de 3 segundos.**

Si el operador necesita abrir un registro para saber si puede vendérselo a ese cliente, la lista falló.

---

## Qué debe mostrar toda Entity List

### Información obligatoria (⭐⭐⭐)

| Dato | Por qué |
|---|---|
| **Identidad** (nombre, código visible) | El operador necesita identificar la entidad de un vistazo. Es lo primero que busca el ojo. |
| **El dato de decisión principal** | Lo que define si el operador actúa o no. Depende de la entidad: deuda para clientes/proveedores, stock para productos, estado para usuarios. |
| **Acción primaria** (editar, seleccionar) | Visible sin hover. Sin ambigüedad. |

### Información recomendada (⭐⭐)

| Dato | Cuándo |
|---|---|
| Identificador secundario (documento, código de barras) | Cuando el operador busca por ese campo. |
| Contacto (teléfono, mail) | Cuando el operador necesita contactar a la entidad. |
| Fecha de última actividad | Cuando el operador necesita saber si la entidad está activa. |

### Información que pertenece al detalle (⭐ o menos)

| Dato | Por qué no en la lista |
|---|---|
| Condición fiscal (IVA) | Solo relevante para facturación. El 90% de operaciones no lo necesita. |
| Códigos internos del sistema | El operador no busca por ID interno. |
| Campos de auditoría (fecha de alta, usuario creador) | Solo para administradores. |
| Costo (cuando el precio es lo que decide) | Dato secundario. Visible en hover o en detalle. |

---

## Jerarquía visual

1. **El nombre siempre primero**, en negrita, alineado a la izquierda.
2. **El dato de decisión principal siempre visible** y codificado con color cuando sea relevante (rojo para deuda/stock cero, verde para stock OK).
3. **Las acciones siempre a la derecha**, consistentes en todas las listas (Editar como acción primaria).
4. **Acciones destructivas ocultas en hover** (Eliminar) o con confirmación.

---

## Tabla vs Cards

| Tabla | Cards |
|---|---|
| Cuando hay ≥4 columnas de información comparable entre filas | Cuando la entidad tiene identidad visual (imagen, color) |
| Cuando el operador necesita escanear muchas filas rápido | Cuando hay ≤3 datos críticos por entidad |
| Cuando se necesita ordenamiento por columna | Cuando el espacio horizontal es limitado |
| **Clientes, Proveedores, Sucursales, Usuarios** | **Productos, Combos** |

---

## Consistencia entre listas

Toda Entity List debe:

1. **Usar el mismo espaciado** (px-4 py-3 en celdas).
2. **Usar el mismo hover** (bg-gray-50).
3. **Usar el mismo empty state** (EntityEmptyState).
4. **Usar el mismo toolbar** (EntityToolbar).
5. **Mostrar el contador de entidades en el subtítulo** de PageShell.
6. **Usar los mismos colores de semáforo** para estados (rojo/ámbar/verde).
7. **Usar Button variant="ghost" para editar** en cada fila.
8. **No mostrar más de 6 columnas**. Si hay más, mover las menos relevantes al detalle.

---

## Lo que NUNCA debe tener una Entity List

- Columnas que el operador no usa para decidir.
- Información duplicada entre columnas.
- Acciones visibles que no aplican a esa entidad.
- Diferente estilo de tabla entre páginas.
- Scroll horizontal en pantallas normales.
