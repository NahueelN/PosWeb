# PosWeb — Sistema POS

Sistema de punto de venta (POS) para comercios minoristas.
Arquitectura por capas: Domain → Application → API.
Frontend web + escritorio con Tauri.

## Stack

| Capa | Tecnología |
|------|-----------|
| Backend | .NET 8 (ASP.NET Core) + EF Core 8 |
| Base de datos | MySQL 8.4 |
| Frontend | React 19 + TypeScript 6 + Vite 8 |
| Desktop | Tauri v2 (opcional, requiere Rust) |
| Estilos | Tailwind CSS 4 |
| Autenticación | JWT + BCrypt |

## Base de datos — 19 tablas

```
CATEGORIAS       → Categorías de productos (hierarchy self-ref)
UNIDADES_MEDIDA  → Unidades (UNIDAD, KILO, LITRO...)
PRODUCTOS        → Catálogo de productos con código de barras
PROVEEDORES      → Proveedores de mercadería
COMPRAS          → Órdenes de compra
RENGLONES_COMPRA → Detalle de cada compra
STOCK_POR_SUCURSAL → Stock por producto + sucursal (PK compuesta)
SUCURSALES       → Locales físicos
EMPRESAS         → Empresas (una puede tener varias sucursales)
SUSCRIPCIONES    → Planes de suscripción
USUARIOS         → Usuarios del sistema (admin, vendedores)
CAJAS            → Apertura / cierre de caja
CLIENTES         → Clientes con documento
VENTAS           → Ventas realizadas
RENGLONES_VENTA  → Detalle de cada venta
MEDIOS_PAGO      → Formas de pago (Efectivo, Débito, etc.)
PAGOS            → Pagos aplicados a una venta
GASTOS           → Gastos registrados en una caja
DEUDAS           → Cuentas corrientes / deudas
```

Todas las columnas monetarias usan `decimal(18,2)`.
Nombres en SCREAMING_SNAKE_CASE.

## Requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js](https://nodejs.org/) (20+)
- MySQL 8.x *(el `setup.ps1` lo instala automáticamente)*

## Setup rápido

Solo la primera vez:

```powershell
# 1. Clonar
git clone <url>
cd PosWeb

# 2. Setup completo (instala MySQL, migra DB, seed, npm install)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\setup.ps1
```

Después, cada vez que quieras trabajar:

```powershell
# Si recién prendiste la PC, arrancá MySQL primero:
.\iniciar-mysql.ps1

# Terminal 1 — Backend
dotnet run --project PosWeb

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Abrir http://localhost:5173

> **Nota**: `setup.ps1` solo se corre **una vez** (instala MySQL, crea la DB, migra, seedea).
> Después usá `.\iniciar-mysql.ps1` para arrancar MySQL y `.\stop-mysql.ps1` para apagarlo.

### Credenciales

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | 123 | SuperAdmin |

## Scripts útiles

| Comando | Cuándo usarlo |
|---------|---------------|
| `.\setup.ps1` | **Una sola vez**: instala MySQL, DB, migra, seedea, npm install |
| `.\iniciar-mysql.ps1` | Cada vez que prendés la PC (arranca MySQL con los datos del proyecto) |
| `.\stop-mysql.ps1` | Al terminar de trabajar (apaga MySQL) |
| `dotnet run --project PosWeb` | Backend API (Swagger en http://localhost:5196/swagger) |
| `cd frontend && npm run dev` | Frontend web (http://localhost:5173) |
| `cd frontend && npm run tauri dev` | App desktop (requiere Rust) |

## Arquitectura

```
PosWeb.Domain/        → Entidades, excepciones, lógica de negocio
PosWeb.Contracts/     → DTOs compartidos
PosWeb.Application/   → Servicios de aplicación
PosWeb/Controllers/   → API endpoints
PosWeb/Data/          → DbContext, config Fluent API
PosWeb/Migrations/     → Migraciones EF Core
frontend/             → React + Vite + Tailwind
frontend/src-tauri/   → Configuración Tauri
```

Reglas de negocio validadas siempre en el backend:
- ❌ El frontend no calcula totales
- ❌ El frontend no descuenta stock
- ❌ El frontend no genera IDs
- ✅ El backend valida todo

## Seed data incluido

- **5 medios de pago**: Efectivo, Débito, Crédito, Transferencia, QR
- **3 unidades de medida**: Unidad, Kilogramo, Litro
- **1 admin**: admin / 123
- **Suscripción Premium + Empresa + Sucursal Principal** (setup.ps1)

## Testing

```bash
dotnet test PosWeb.sln
```

Backend: xUnit + EF Core InMemory. Frontend: type-check con `npx tsc -b`.
