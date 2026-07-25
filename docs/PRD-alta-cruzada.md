# PRD-alta-cruzada — Alta Cruzada

> **Product Rule**: toda entidad comercial de PosWeb debe poder darse de alta desde su pantalla de administración y desde cualquier proceso que la consuma.
>
> Estado: `Active` — confirmado mediante implementación en Clientes y Proveedores.

---

## Metadata

```yaml
ID: PRD-alta-cruzada
Type: Product Rule
Name: Alta Cruzada de entidades comerciales
Status: Active
Priority: High
Level: Project
Sources:
  - frontend/src/pages/VentasPage.tsx
  - frontend/src/pages/CompraPage.tsx
  - frontend/src/pages/ClientesPage.tsx
  - frontend/src/pages/ProveedoresPage.tsx
Created: 2026-07-03
Updated: 2026-07-03
Tags:
  - UX
  - Cliente
  - Proveedor
```

---

## Descripción

Toda entidad comercial del sistema debe poder darse de alta desde:

- su pantalla de administración (ABM);
- cualquier proceso que la consuma (venta, compra, etc.).

No existe distinción de dominio entre "alta rápida" y "alta completa" según el contexto. La diferencia es únicamente de completitud de datos (modo rápido vs modo completo), no de proceso. Un cliente creado desde VentasPage es el mismo tipo de entidad que uno creado desde ClientesPage.

**Contraejemplo (antes de esta regla):** CompraPage no podía crear proveedores. El operador debía salir de la compra, ir a ProveedoresPage, crear el proveedor y volver. VentasPage sí podía crear clientes. Esa asimetría es lo que esta regla elimina.

---

## Problema del operador

El operador de compras necesita registrar un proveedor que no existe en el sistema. Hoy debe:

1. Abandonar la pantalla de compra.
2. Navegar a ProveedoresPage.
3. Completar el alta del proveedor.
4. Volver a CompraPage.
5. Buscar y seleccionar el proveedor recién creado.

Esto implica cambios de contexto innecesarios. En ventas, el mismo problema se resuelve en un modal sin abandonar la pantalla.

**Objetivo de esta regla:** ningún operador debe abandonar el proceso que está ejecutando para registrar una entidad que ese proceso necesita.

---

## Reglas

1. **Toda entidad comercial debe tener al menos dos puntos de alta**: su pantalla de administración y cualquier pantalla que la consuma.

2. **El alta desde un proceso consumidor debe estar integrada al buscador de la entidad**, no ser una acción separada de la pantalla. El botón "Nuevo" pertenece al lookup, no a la página.

3. **Después del alta, la entidad creada debe seleccionarse automáticamente** y el foco debe volver al flujo principal (sin pasos adicionales).

4. **El formulario de alta desde un proceso consumidor debe permitir el alta completa**, no solo datos mínimos. Si el operador tiene todos los datos, debe poder cargarlos sin cambiar de pantalla.

5. **Todos los contextos de alta deben compartir la misma entidad del dominio.** No debe crearse un tipo de entidad diferente según el contexto de origen.

---

## Entidades que deben cumplirla

| Entidad | Administración | Contexto consumidor | Alta cruzada |
|---------|---------------|-------------------|--------------|
| Cliente | ClientesPage | VentasPage | ✅ |
| Proveedor | ProveedoresPage | CompraPage | ✅ |
| Categoría de gasto | — | GastosPage | ✅ (inline) |
| Producto | ProductosPage | CompraPage, PedidosPage | ✅ Compra, ❌ Pedidos |
| Marca | ProductosPage | ProductosPage (carga masiva) | ❌ |
| Proveedor | — | PedidosPage | ❌ |

> Cuando se incorpore una nueva entidad comercial (Transportista, Vendedor, Banco, etc.), debe evaluarse qué procesos la consumen y garantizar que la regla se cumpla desde el diseño inicial.

---

## Comportamiento esperado

Para cualquier entidad que implemente esta regla:

```
Buscar entidad en el lookup
    ↓
¿Existe?
├── Sí → Seleccionar y continuar
└── No → Botón "+ Nueva [entidad]"
        ↓
    Modal con formulario de alta
        ↓
    Guardar
        ↓
    Seleccionar automáticamente
        ↓
    Continuar con el proceso
```

---

## Límites

- Esta regla no define cómo se representa visualmente el lookup. Eso pertenece a un componente genérico (PASS futura).
- Esta regla no define qué campos son obligatorios. Eso depende del tipo de entidad y la configuración del negocio.
- Esta regla no establece si el modo rápido (ocasional) debe existir. Es una decisión de UX independiente.

---

## Relaciones

```yaml
RELATIONS:
  - type: RELATED
    target: STAND-entity-identity
  - type: IMPLEMENTS
    target: PAT-alta-cruzada
```
