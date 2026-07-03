# Propuesta de Unificación — PosWeb

## Objetivo

Unificar criterios visuales y de arquitectura en todas las solapas de PosWeb, eliminando código duplicado y garantizando consistencia mediante componentes compartidos, hooks genéricos y tests automatizados.

---

## Estado actual

| Componente | Estado |
|---|---|
| `PageShell` | Creado. Usado por Caja, Deudas, Ventas |
| `CartPanel` | Creado. Usado por Ventas, Compras |
| `PaymentFooter` | Creado. Usado por Ventas, Compras |
| `MontoInput` | Creado. Usado por Ventas, Compras |
| `useCart` hook | No existe. Lógica duplicada en Ventas y Compras |
| `useCrud` hook | No existe. Lógica duplicada en 6 ABM |
| Tests | Cero en frontend |
| Páginas sin `PageShell` | 12 de 17 |

---

## Arquitectura propuesta

```
src/
├── components/
│   ├── shared/           ← componentes visuales compartidos
│   │   ├── PageShell     ← cascarón obligatorio para toda página
│   │   ├── CartPanel     ← panel derecho de ventas/compras
│   │   ├── PaymentFooter ← sección de pago unificada
│   │   └── MontoInput    ← input de monto estándar
│   └── hosts/            ← componentes de alto nivel (nuevo)
│       ├── CartHost      ← host para procesos tipo carrito
│       └── CrudHost      ← host para ABM (tabla + modal + paginación)
├── hooks/
│   ├── useCart.ts        ← lógica de carrito genérica <T>
│   └── useCrud.ts        ← lógica de ABM genérica <T>
├── cart/
│   └── cart-logic.ts     ← funciones puras de carrito (testeables sin React)
├── crud/
│   └── crud-logic.ts     ← funciones puras de CRUD (testeables sin React)
├── test-utils.tsx        ← mocks y helpers para tests
└── test-setup.ts         ← configuración de testing-library
```

---

## Plan de ejecución

### Fase 0 — Infraestructura de testing

| # | Tarea | Tiempo |
|---|---|---|
| 0.1 | `npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom` | 5 min |
| 0.2 | Configurar vitest en `vite.config.ts` (`environment: 'jsdom'`) | 10 min |
| 0.3 | Crear `src/test-setup.ts` | 2 min |
| 0.4 | Crear `src/test-utils.tsx` con mocks de `useOutletContext`, `api`, `useNotification`, `localStorage` | 30 min |

**Subtotal: ~1 h**

---

### Fase 1 — `useCart<T>` hook

Extraer lógica duplicada de VentasPage y CompraPage a un hook genérico. Testear antes de migrar.

| # | Tarea | Tiempo |
|---|---|---|
| 1.1 | Extraer funciones puras de Ventas (`addItem`, `removeItem`, `updateQuantity`, `calcTotal`) a `src/cart/cart-logic.ts` | 30 min |
| 1.2 | Tests de lógica pura — ~12 tests (add, remove, update, total, persistencia) | 1 h |
| 1.3 | Tests de regresión — ~6 tests (bugs ya arreglados: combo doble, stock, auto-combo, focus) | 45 min |
| 1.4 | Crear `src/hooks/useCart.ts` — hook genérico `<T>` | 1 h |
| 1.5 | Tests del hook con `renderHook` — ~8 tests | 45 min |
| 1.6 | Migrar VentasPage a `useCart` | 45 min |
| 1.7 | Migrar CompraPage a `useCart` | 45 min |
| 1.8 | Verificar tests en verde, validar visualmente | 30 min |

**Subtotal: ~5.5 h**

---

### Fase 2 — `useCrud<T>` hook

Extraer lógica duplicada de los 6 ABM.

| # | Tarea | Tiempo |
|---|---|---|
| 2.1 | Extraer funciones puras de ClientesPage (`load`, `handleSubmit`, `openEdit`, `resetForm`) a `src/crud/crud-logic.ts` | 30 min |
| 2.2 | Tests de lógica pura — ~10 tests (crear, editar, eliminar, búsqueda, paginación) | 1 h |
| 2.3 | Crear `src/hooks/useCrud.ts` — hook genérico `<T>` | 1 h |
| 2.4 | Tests del hook con `renderHook` — ~8 tests | 45 min |
| 2.5 | Migrar ClientesPage (251 → ~80 líneas) | 30 min |
| 2.6 | Migrar ProveedoresPage (207 → ~70 líneas) | 20 min |
| 2.7 | Migrar SucursalesPage (127 → ~50 líneas) | 15 min |
| 2.8 | Migrar CombosPage (slot para sub-form de items) | 30 min |
| 2.9 | Migrar ProductosPage (`renderItem` custom para cards) | 30 min |
| 2.10 | Migrar AltaUsuarioPage | 20 min |
| 2.11 | Migrar GastosPage (slots para caja/fuente) | 30 min |
| 2.12 | Verificar tests en verde, validar visualmente | 30 min |

**Subtotal: ~6.5 h**

---

### Fase 3 — CartHost

| # | Tarea | Tiempo |
|---|---|---|
| 3.1 | Crear `src/components/hosts/CartHost.tsx` — usa `useCart` + `CartPanel` + `PaymentFooter` + `MontoInput` | 1.5 h |
| 3.2 | Tests de integración — ~6 tests (renderiza con mocks, slots en posición correcta, focus) | 1 h |
| 3.3 | Migrar VentasPage a `CartHost` (1500 → ~80 líneas) | 1 h |
| 3.4 | Migrar CompraPage a `CartHost` (700 → ~80 líneas) | 45 min |
| 3.5 | Verificar visualmente: misma posición, atajos de teclado, comportamiento | 30 min |

**Subtotal: ~4.5 h**

---

### Fase 4 — CrudHost

| # | Tarea | Tiempo |
|---|---|---|
| 4.1 | Crear `DataTable` genérico — columnas configurables, ordenamiento, filas clickeables | 1 h |
| 4.2 | Crear `CrudModal` genérico — formulario desde definición de campos | 45 min |
| 4.3 | Crear `src/components/hosts/CrudHost.tsx` | 1 h |
| 4.4 | Tests de integración — ~8 tests (tabla, modal, búsqueda, paginación) | 1 h |
| 4.5 | Migrar ClientesPage | 20 min |
| 4.6 | Migrar ProveedoresPage | 15 min |
| 4.7 | Migrar SucursalesPage | 10 min |
| 4.8 | Migrar CombosPage | 30 min |
| 4.9 | Migrar ProductosPage | 25 min |
| 4.10 | Migrar AltaUsuarioPage | 15 min |
| 4.11 | Migrar GastosPage | 25 min |
| 4.12 | Verificar tests en verde, validar visualmente | 30 min |

**Subtotal: ~6.5 h**

---

### Fase 5 — PageShell en páginas restantes

Migrar las páginas que todavía no usan PageShell. Cambio puramente estructural.

| # | Tarea | Tiempo |
|---|---|---|
| 5.1 | ProductosPage | 10 min |
| 5.2 | ClientesPage | 10 min |
| 5.3 | ProveedoresPage | 10 min |
| 5.4 | CombosPage | 10 min |
| 5.5 | SucursalesPage | 10 min |
| 5.6 | GastosPage | 15 min |
| 5.7 | PedidosPage | 15 min |
| 5.8 | EstadisticasPage | 10 min |
| 5.9 | HistorialVentasPage | 10 min |
| 5.10 | ConfiguracionPage | 10 min |
| 5.11 | StockPage | 10 min |
| 5.12 | AltaUsuarioPage | 10 min |

**Subtotal: ~2 h**

---

### Fase 6 — Validación y limpieza

| # | Tarea | Tiempo |
|---|---|---|
| 6.1 | `npm test` — todos los tests en verde | 15 min |
| 6.2 | `npm run build` — sin errores ni warnings | 10 min |
| 6.3 | Test cross-process: venta → historial → caja | 30 min |
| 6.4 | Verificar bugs arreglados no regresan (combo doble, stock, 401 redirect, auto-combo) | 20 min |
| 6.5 | Limpiar imports no usados | 15 min |
| 6.6 | `App.tsx` — revisar rutas | 10 min |

**Subtotal: ~1.5 h**

---

## Resumen de tiempos

```
Fase 0: Testing infra          █░░░░  1 h
Fase 1: useCart hook           ████░  5.5 h
Fase 2: useCrud hook           █████  6.5 h
Fase 3: CartHost               ███░░  4.5 h
Fase 4: CrudHost               █████  6.5 h
Fase 5: PageShell remaining    █░░░░  2 h
Fase 6: Validación             █░░░░  1.5 h
                               ──────
                        Total: ~27 horas (~3.5 días)
```

---

## Resultado esperado

| Métrica | Antes | Después |
|---|---|---|
| Líneas totales | ~8000 | ~4500 |
| Líneas duplicadas | ~2000 | ~0 |
| Tests frontend | 0 | ~50 |
| Nueva solapa cart | 1500 líneas | ~80 líneas |
| Nuevo ABM | 250 líneas | ~60 líneas |
| Cambio de diseño global | Manual por página | Automático vía hosts |
| Consistencia visual | Por página | Garantizada por `PageShell` + hosts |

---

## Páginas que NO se migran a hosts

Estas páginas tienen flujos únicos que no encajan en `CartHost` ni `CrudHost`. Se quedan como están con `PageShell`:

- **CajaPage** — ya refactorizada, usa `PageShell`
- **DeudaPage** — ya migrada a `PageShell` con tabs
- **PedidosPage** — wizard multi-paso (crear → recibir → cancelar)
- **EstadisticasPage** — dashboard con gráficos
- **HistorialVentasPage** — tabla de solo lectura con filtros
- **ConfiguracionPage** — settings
- **StockPage** — gestión de inventario por sucursal
- **LoginPage** — autenticación

---

## Cómo crear una solapa nueva después de la unificación

### Proceso tipo carrito (ej: Presupuestos)
```tsx
const cart = useCart<Item>({ storageKey: 'presupuesto_cart' })
return (
  <CartHost
    cart={cart}
    products={productos}
    acceptCombos={false}
    paymentControls={<MediosPago />}
    onConfirm={crearPresupuesto}
    confirmLabel="Crear presupuesto"
  />
)
```

### ABM (ej: Categorías)
```tsx
const crud = useCrud<CategoriaDto>({ api: api.categorias, defaultForm: {...} })
return (
  <CrudHost
    crud={crud}
    title="Categorías"
    columns={[{ key: 'descripcion', header: 'Descripción' }]}
    fields={[{ key: 'descripcion', label: 'Descripción', required: true }]}
  />
)
```

### Página estándar (ej: Dashboard nuevo)
```tsx
<PageShell title="Dashboard" subtitle="Resumen del día">
  <MiContenido />
</PageShell>
```
