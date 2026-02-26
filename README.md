🧾 PosWeb – Backend POS (ASP.NET Core)

Backend para sistema POS con manejo de productos, sucursales y ventas.
Arquitectura por capas: Domain / Application / Data / API.

Estado actual:
✅ Productos
✅ Sucursales
✅ Ventas
❌ Caja / pagos (todavía no)

🧱 Entidades principales
📦 Producto

Representa un artículo vendible.

Campo	Tipo	Descripción
ID_PRODUCTO	int	ID interno (lo genera el sistema)
CODIGO_BARRA	string	Código de barras único
NOMBRE	string	Nombre del producto
PRECIO	decimal	Precio de venta
COSTO	decimal	Costo interno
STOCK	int	Stock disponible
Activo	bool	Habilitado para vender
🏬 Sucursal

Representa un local físico.

Campo	Tipo	Descripción
ID_SUCURSAL	int	ID interno
NUMERO	int	Número de sucursal (1, 2, 3…)
CODIGO	string	Código corto (ej: CENTRO)
NOMBRE	string	Nombre descriptivo
ACTIVO	bool	Habilitada
🧾 Venta

Venta realizada en una sucursal.

Campo	Tipo	Descripción
ID_VENTA	int	ID interno
ID_SUCURSAL	int	Sucursal donde se vende
FECHA	datetime	Fecha y hora
TOTAL	decimal	Total calculado
RENGLONES	list	Detalle de productos
📄 Renglón de Venta

Detalle de un producto vendido.

Campo	Tipo
ID_RENGLON_VENTA	int
ID_PRODUCTO	int
CANTIDAD	int
PRECIO_UNITARIO	decimal
SUBTOTAL	decimal
🌐 API – Endpoints
📦 Productos
🔹 Obtener productos activos

GET

/api/productos

Respuesta:

[
  {
    "id": 1,
    "codigoBarra": "7790001000011",
    "nombre": "Coca-Cola 2.25L",
    "precio": 2800,
    "costo": 2100,
    "stock": 20,
    "activo": true
  }
]
🔹 Crear producto

POST

/api/productos

Body:

{
  "codigoBarra": "7790001000011",
  "nombre": "Coca-Cola 2.25L",
  "precio": 2800,
  "costo": 2100,
  "stock": 20
}

Errores posibles:

código duplicado

datos inválidos

🔹 Buscar producto por código de barras

GET

/api/productos/barra/{codigoBarra}

Ejemplo:

/api/productos/barra/7790001000011
🔹 Eliminar (desactivar) producto

DELETE

/api/productos/{id}

Ejemplo:

/api/productos/1
🏬 Sucursales
🔹 Obtener sucursales activas

GET

/api/sucursales
🔹 Crear sucursal

POST

/api/sucursales

Body:

{
  "numero": 1,
  "codigo": "CENTRO",
  "nombre": "Sucursal Centro"
}

Errores:

número duplicado

🔹 Obtener sucursal por ID

GET

/api/sucursales/{id}
🔹 Eliminar (desactivar) sucursal

DELETE

/api/sucursales/{id}
🧾 Ventas
🔹 Crear venta

POST

/api/ventas

Body:

{
  "sucursalId": 1,
  "items": [
    {
      "productoId": 1,
      "cantidad": 2
    },
    {
      "productoId": 3,
      "cantidad": 1
    }
  ]
}

Respuesta:

{
  "ventaId": 10,
  "fecha": "2026-02-26T14:32:00",
  "total": 8400
}

Errores posibles:

venta sin items

sucursal inexistente o inactiva

producto inexistente o inactivo

stock insuficiente

⚠️ Reglas importantes para frontend

❌ No mandar IDs en crear

❌ No calcular totales

❌ No manejar stock

✅ Backend valida todo

✅ Backend descuenta stock

✅ Backend calcula total

🚧 Pendiente (no implementado aún)

Caja (apertura / cierre)

Pagos (efectivo, tarjeta, etc.)

Clientes

Usuarios / roles

Reportes

🧪 Testing

Tests de dominio

Tests de servicios (Application)

EF Core InMemory

Cobertura de excepciones

▶️ Cómo correr el proyecto

Clonar repo

Restaurar paquetes

Ejecutar migraciones:

Update-Database

Ejecutar API

Usar Swagger
