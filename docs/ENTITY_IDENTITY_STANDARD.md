# Entity Identity — Estándar conceptual

> Cómo definir una entidad antes de diseñar su pantalla.
> El dominio determina la identidad. La identidad determina la representación. La representación determina los componentes.

---

## Principio

**Toda entidad del sistema existe porque el operador necesita tomar decisiones sobre ella.**

Si una entidad no habilita ninguna decisión, no merece una pantalla.

Si una pantalla muestra datos que no ayudan a decidir, está mal diseñada.

---

## Flujo de diseño

```
Entidad del dominio
    │
    ▼
Entity Identity    ← ¿Quién es? ¿Qué decido?
    │
    ▼
Entity Representation  ← ¿Tabla o cards? ¿Qué columnas?
    │
    ▼
Entity List Standard   ← ¿Cómo se ve? ¿Qué jerarquía?
    │
    ▼
Entity Page            ← Workflow + Toolbar + Modal
    │
    ▼
Componentes            ← Consecuencia, no punto de partida
```

Los componentes son el último eslabón. No se diseña desde ellos.

---

## Qué define la identidad de una entidad

Para cada entidad del sistema, responder estas 4 preguntas antes de escribir una línea de código:

### 1. ¿Quién es?

Una frase. Qué representa esta entidad para el negocio.

### 2. ¿Qué decisiones toma el operador sobre ella?

Lista ordenada por frecuencia. Lo que el operador hace todos los días con esta entidad.

### 3. ¿Qué información necesita para decidir sin abrir el detalle?

Cuatro categorías:

| Categoría | Significado | Ejemplos |
|---|---|---|
| **Identidad** | Quién es. Lo primero que busca el ojo. | Nombre, razón social. |
| **Estado** | Cómo está. Define si se puede actuar. | Deuda, stock, activo/inactivo. |
| **Contexto** | Qué pasó. Ayuda a priorizar. | Última compra, última venta, categoría. |
| **Acción** | Qué puedo hacer. La consecuencia de la decisión. | Editar, seleccionar, eliminar. |

### 4. ¿Qué información pertenece al detalle?

Lo que solo se consulta ocasionalmente. No merece una columna.

---

## Identidades definidas

### Cliente

**¿Quién es?** Una persona o empresa que compra en el negocio. La relación es comercial: el operador necesita saber si puede venderle y si tiene deuda pendiente.

**Decisiones del operador** (por frecuencia):

1. ¿Es este el cliente que busco? → identificarlo por nombre o documento.
2. ¿Me debe plata? → decidir si venderle fiado o cobrar primero.
3. ¿Está activo? → saber si todavía compra.
4. ¿Necesito editar sus datos? → actualizar teléfono, dirección.

**Información mínima en la lista:**

| Categoría | Dato | Prioridad |
|---|---|---|
| Identidad | Nombre | ⭐⭐⭐ |
| Identidad | Documento (DNI/CUIT) | ⭐⭐⭐ |
| Estado | Deuda pendiente | ⭐⭐⭐ |
| Contexto | Última venta (fecha) | ⭐⭐ |
| Acción | Editar | ⭐⭐ |

**En el detalle:** Condición IVA, domicilio completo, teléfono, mail, fecha de alta.

---

### Proveedor

**¿Quién es?** Una empresa o persona que abastece al negocio. La relación es de compra: el operador necesita saber cuánto le debe y cuándo fue la última compra.

**Decisiones del operador** (por frecuencia):

1. ¿A quién le compro? → identificar por nombre.
2. ¿Le debo plata? → decidir si pagar antes de comprar más.
3. ¿Cuándo fue la última compra? → saber si sigue siendo un proveedor activo.
4. ¿Necesito editar sus datos? → actualizar contacto.

**Información mínima en la lista:**

| Categoría | Dato | Prioridad |
|---|---|---|
| Identidad | Nombre | ⭐⭐⭐ |
| Estado | Deuda pendiente | ⭐⭐⭐ |
| Contexto | Última compra (fecha) | ⭐⭐ |
| Acción | Editar | ⭐⭐ |

**En el detalle:** Documento, teléfono, mail, domicilio, código interno, fecha de alta.

---

### Producto

**¿Quién es?** Un artículo que el negocio vende. El operador necesita saber su precio, si hay stock suficiente, y de qué categoría es.

**Decisiones del operador** (por frecuencia):

1. ¿A qué precio lo vendo? → verificar precio actual.
2. ¿Tengo stock? → decidir si puedo venderlo o necesito reponer.
3. ¿De qué categoría es? → ubicarlo mentalmente en el catálogo.
4. ¿Es rentable? → comparar precio con costo.
5. ¿Necesito editar sus datos? → cambiar precio, stock, descripción.

**Información mínima en la lista:**

| Categoría | Dato | Prioridad |
|---|---|---|
| Identidad | Nombre | ⭐⭐⭐ |
| Estado | Precio | ⭐⭐⭐ |
| Estado | Stock (con semáforo) | ⭐⭐⭐ |
| Contexto | Categoría | ⭐⭐ |
| Acción | Editar | ⭐⭐ |

**En el detalle:** Código de barras, costo, margen, descripción, unidad de medida, contenido, fecha de última modificación.

---

## Cómo usar este estándar

Cuando se diseña una nueva entidad (Marcas, Categorías, Rubros, Depósitos):

1. Responder las 4 preguntas de identidad.
2. Clasificar la información en Identidad / Estado / Contexto / Acción.
3. Decidir representación (tabla si ≥4 columnas, cards si ≤3 datos críticos).
4. Aplicar `ENTITY_LIST_STANDARD.md` para jerarquía visual y consistencia.
5. Implementar siguiendo el workflow de `entity-pages-architecture.md`.
