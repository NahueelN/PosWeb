# PAT-alta-cruzada — Alta Cruzada Pattern

## Metadata

```yaml
ID: PAT-alta-cruzada
Type: Pattern
Name: Alta Cruzada (Cross-entity Creation)
Status: Active
Priority: High
Level: Project
Sources:
  - frontend/src/pages/CompraPage.tsx
  - frontend/src/pages/VentasPage.tsx
  - frontend/src/pages/venta/VentaDialogs.tsx
  - frontend/src/pages/GastosPage.tsx
  - frontend/src/components/ProductFormModal.tsx
  - frontend/src/components/ui/Dialog.tsx
Template: pattern-v1
Created: 2026-07-12
Updated: 2026-07-12
Tags:
  - UX
  - Producto
  - Proveedor
  - Cliente
  - Keyboard
  - Compras
```

---

## Overview

Alta Cruzada permite crear una entidad relacionada (proveedor, producto, cliente, categoría, etc.) desde el lookup de un formulario padre, sin interrumpir el flujo de trabajo. El usuario nunca debería abandonar el formulario actual para crear un registro que necesita y que todavía no existe.

Este patrón existe porque los usuarios necesitan crear entidades hijas sobre la marcha durante flujos de alta intensidad (compras, ventas, gastos). Sin Alta Cruzada, el usuario debe cancelar su operación actual, ir a la pantalla de la entidad, crearla, volver, y retomar — una secuencia que rompe el momentum y pierde contexto.

---

## When to use

- Cuando un lookup permite seleccionar una entidad y existe la posibilidad de que el usuario necesite una que no esté en la lista.
- Cuando el formulario padre representa un flujo intensivo (compra, venta, gasto, pedido, combo) donde cada interrupción tiene costo.
- Cuando el lookup tiene un botón "+" o "Nuevo" inmediatamente accesible.

## When NOT to use

- Cuando la entidad es un valor fijo del sistema que no debería crearse desde la UI (ej: tipos de documento, configuraciones globales).
- Cuando la entidad hija requiere datos que el usuario no puede completar en el contexto del formulario padre (ej: requiere configuración previa).
- Cuando el lookup representa una lista cerrada y controlada (ej: selección de sucursal activa).

---

## Architecture

```
┌─────────────────────────────────────┐
│        Formulario Padre             │
│  ┌──────────────────────────────┐   │
│  │  Lookup con búsqueda         │   │
│  │  ┌──────────────────┐ [+]──│   │  Trigger: botón "+"
│  │  │ Input + dropdown  │      │   │  dentro/pegado al input
│  │  └──────────────────┘       │   │
│  └──────────────────────────────┘   │
│                   ↓                 │
│  ┌──────────────────────────────┐   │
│  │  Dialog / Modal de creación  │   │  Formulario de entidad hija
│  │  ┌────────────────────────┐  │   │
│  │  │  Campos del formulario │  │   │
│  │  │  [Cancelar] [Crear]    │  │   │
│  │  └────────────────────────┘  │   │
│  └──────────────────────────────┘   │
│                   ↓                 │
│  ┌──────────────────────────────┐   │
│  │  1. Refrescar lookup        │   │
│  │  2. Auto-seleccionar nuevo  │   │  Post-creación
│  │  3. Cerrar modal            │   │
│  │  4. Reset form              │   │
│  │  5. Continuar flujo (focus) │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Rules

### R1 — Ciclo completo obligatorio

Toda implementación de Alta Cruzada debe ejecutar estas 5 etapas en orden, sin saltarse ninguna:

| # | Etapa | Implementación |
|---|-------|---------------|
| 1 | **Refrescar lookup** | `setLista(prev => [...prev, nuevo])` |
| 2 | **Auto-seleccionar** | `setId(nuevo.id)`, `setNombre(nuevo.nombre)` |
| 3 | **Cerrar modal** | `setShowModal(false)` |
| 4 | **Reset form** | Limpiar todos los campos del formulario de creación |
| 5 | **Continuar flujo** | `focus()` en el siguiente input del formulario padre |

### R2 — Trigger visual

El botón debe ser un icono "+" posicionado **dentro** o **inmediatamente al lado** del input del lookup. No al final de la página ni en un menú oculto.

### R3 — Modal de creación

Usar `<Dialog>` con formulario inline (como en CompraPage proveedor, línea 617), o un componente dedicado si la entidad es compleja y reusable (como `ProductFormModal` para producto).

### R4 — No implementar mecanismos nuevos

No implementar Alta Cruzada con un mecanismo distinto (toast, sidebar, slide-over, inline expand) sin comparar primero con el patrón Dialog de CompraPage. Si el mecanismo existente no es adecuado, proponer la variante con justificación explícita.

### R5 — Persistencia de contexto

Cuando el formulario padre represente un flujo que puede interrumpirse (navegación, cierre accidental), la selección actual debe persistirse (ej: `localStorage` en CompraPage para el proveedor seleccionado).

---

## Checklist de auditoría (AC)

Para cada lookup en un popup, responder:

| # | Pregunta | Sí | No |
|---|----------|----|-----|
| AC1 | ¿El usuario podría necesitar una entidad que no existe? | Implementar Alta Cruzada | Justificar |
| AC2 | ¿Ya existe implementación similar en otro popup? | Reutilizar el mismo patrón | Evaluar si es nuevo |
| AC3 | ¿Puede reutilizar el patrón de CompraPage (Dialog inline + refresh + auto-select + continuar)? | Usar el patrón estándar | Justificar |
| AC4 | ¿Hay 3+ instancias del mismo lookup en el proyecto? | Extraer COMP-Lookup{Entidad} compartido | No hace falta aún |

Las respuestas negativas deben justificarse explícitamente. No implementar sin pasar por esta checklist.

---

## Implementaciones existentes

| # | Padre | Entidad creada | Archivo | Líneas trigger | Handler |
|---|-------|---------------|---------|---------------|---------|
| 1 | Compra | Proveedor | `CompraPage.tsx` | 514-518 | `crearProveedor()` (250-276) |
| 2 | Compra | Producto | `CompraPage.tsx` | 548 | `handleProductCreatedInModal()` (239-248) |
| 3 | Venta | Cliente | `VentaDialogs.tsx` / `VentasPage.tsx` | 180-181 | `crearClienteYRevertir()` (192-219) |
| 4 | Gasto | Categoría | `GastosPage.tsx` | 340-345 (inline dropdown) | `handleCrearCategoria()` (158-171) |

### Candidatos sin implementar

| Padre | Entidad | Archivo | Líneas lookup |
|-------|---------|---------|--------------|
| Pedido | Proveedor | `PedidosPage.tsx` | 519-585 |
| Pedido | Producto | `PedidosPage.tsx` | 587-700 |
| Combo | Producto | `CombosPage.tsx` | 685-700 |
| Producto | Marca | `ProductosPage.tsx` | 360-376 |

---

## Referencia — CompraPage proveedor (implementación canónica)

```typescript
// frontend/src/pages/CompraPage.tsx

// 1. Estado del modal (línea 103-105)
const [showNewProvModal, setShowNewProvModal] = useState(false);
const [newProvNombre, setNewProvNombre] = useState('');
const [newProvForm, setNewProvForm] = useState({ ... });

// 2. Trigger: botón "+" dentro del input (línea 514-519)
<button onClick={() => setShowNewProvModal(true)}
  className="absolute right-1 top-1/2 -translate-y-1/2 ...">
  <Plus size={16} />
</button>

// 3. Handler de creación (línea 250-276)
async function crearProveedor(e: React.FormEvent) {
  e.preventDefault();
  const nuevo = await api.proveedores.crear(dto);

  setProveedores(prev => [...prev, nuevo]);  // ← refrescar
  setProveedorId(nuevo.id);                   // ← auto-seleccionar
  setProveedorNombre(nuevo.nombre);           // ← auto-seleccionar
  setProveedorSearch('');                     // ← reset
  setShowProvDropdown(false);                 // ← cerrar dropdown
  setShowNewProvModal(false);                 // ← cerrar modal
  setNewProvNombre('');                       // ← reset form
  setNewProvForm({ ... });                    // ← reset form

  setTimeout(() => searchRef.current?.focus(), 50);  // ← continuar flujo
}
```

---

## Relations

- `USES` → `COMP-Dialog` (contenedor del modal de creación)
- `USES` → `COMP-ProductFormModal` (para creación de productos)
- `IMPLEMENTS` → `PRD-alta-cruzada` (regla de producto que este patrón implementa)
- `RELATED` → `STAND-pr-narrative` (narrativa de PR donde se detectó el patrón)
- `INSPIRED_BY` → `PAT-cart-flow` (misma filosofía de composición por patrones)
- `RELATED` → `PAT-ux-dialog-rationale` (decisiones de UX para popups)
