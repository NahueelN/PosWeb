# PosWeb

Proyecto **POS (Point of Sale)** desarrollado en **.NET**, con foco en:
- dominio fuerte
- reglas de negocio explícitas
- tests unitarios completos
- arquitectura limpia y escalable

---

## 🧱 Arquitectura

El proyecto sigue una separación clara por capas:

- **Domain**
  - Entidades de negocio (`Producto`, `Venta`, `Sucursal`, `RenglonVenta`)
  - Reglas de negocio encapsuladas
  - Excepciones de dominio específicas
  - Sin dependencias de UI, HTTP o persistencia

- **Domain.Test**
  - Tests unitarios del dominio
  - Cobertura completa de reglas y errores
  - Helpers para simular comportamiento de EF Core

Las capas superiores (Application / API) consumen el dominio, pero **el dominio no depende de ellas**.

---

## 🧠 Principios aplicados

- Domain Driven Design (DDD liviano)
- Entidades ricas (no anémicas)
- Invariantes protegidas
- Excepciones de negocio tipadas
- Operaciones atómicas (una venta entra completa o no entra)
- Tests como contrato del dominio

---

## ⚠️ Manejo de errores

Las reglas de negocio lanzan **excepciones de dominio** (`DomainException`):

- `StockInsuficienteException`
- `CantidadInvalidaException`
- `ProductoInvalidoException`
- `SucursalInvalidaException`
- etc.

El dominio **describe el error**,  
las capas superiores **deciden qué hacer** con él.

---

## 🧪 Tests

- Todos los `if` del dominio están cubiertos
- Los tests validan:
  - comportamiento correcto
  - errores de negocio
- No se testea infraestructura ni frameworks
- Los tests no dependen de textos, sino de tipos de excepción

---

## 🎯 Objetivo del proyecto

Servir como base sólida para un sistema POS real:
- ventas
- stock
- sucursales
- extensible a pagos, clientes, reportes, etc.

Pensado para crecer sin reescribir el dominio.

---

## 🚀 Próximos pasos

- Application layer (Services)
- Persistencia con EF Core
- Middleware global de errores
- API REST
- Autenticación y permisos
