using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using PosWeb.Application.Exceptions;
using PosWeb.Application.Compras;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Testing;
using Xunit;

namespace PosWeb.Application.Test;

public class CompraServiceTest
{
    private static PosDbContext CrearContexto(string dbName)
    {
        DbContextOptions<PosDbContext> options =
            new DbContextOptionsBuilder<PosDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;

        var context = new PosDbContext(options);
        // Seed basic data needed for tests
        Sucursal sucursal = new Sucursal(1, "001", "Sucursal Test");
        sucursal.Activar();
        context.Sucursales.Add(sucursal);
        
        Usuario usuario = new Usuario(1, "testuser", "hashed", "Vendedor");
        usuario.Activar();
        context.Usuarios.Add(usuario);
        
        context.SaveChanges();
        return context;
    }

    private static CompraService CrearService(PosDbContext context)
    {
        return new CompraService(context);
    }

    private static Caja CrearCajaAbierta(PosDbContext context, int sucursalId, int usuarioId)
    {
        var caja = new Caja(sucursalId, 1000, usuarioId);
        context.Cajas.Add(caja);
        context.SaveChanges();
        return caja;
    }

    private static Producto CrearProducto(PosDbContext context, int id, string codigo, string nombre, decimal precio, decimal costo, int stock = 0)
    {
        Producto producto = new Producto(codigo, nombre, precio, costo, stock);
        TestHelpers.SetId(producto, id, "ID_PRODUCTO");
        context.Productos.Add(producto);
        context.SaveChanges();
        return producto;
    }

    [Fact]
    public void CrearCompra_ConItemsValidos_CreaGastoYActualizaStockAtomico()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_ConItemsValidos_CreaGastoYActualizaStockAtomico));
        CompraService service = CrearService(context);

        // Create active caja
        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        // Create test product
        Producto producto = CrearProducto(context, 1, "COD001", "Producto Test", 100, 80, 10);

        // Request
        var request = new CompraRequestDto
        {
            SucursalId = sucursal.ID_SUCURSAL,
            Items = new List<CompraItemDto>
            {
                new() { ProductoId = producto.ID_PRODUCTO, Cantidad = 5, CostoUnitario = 75 }
            }
        };

        // Act
        CompraResponseDto resultado = service.CrearCompra(request);

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal(5 * 75, resultado.TotalGasto);
        Assert.NotEmpty(resultado.Items);
        
        // Verify Gasto was created
        Gasto gasto = context.Gastos.First();
        Assert.Equal(caja.ID_CAJA, gasto.ID_CAJA);
        Assert.Equal(5 * 75, gasto.MONTO);
        Assert.Equal("Compra", gasto.DETALLE);

        // Verify stock was updated atomically
        StockSucursal stock = context.StockSucursales.First();
        Assert.Equal(producto.ID_PRODUCTO, stock.IdProducto);
        Assert.Equal(sucursal.ID_SUCURSAL, stock.IdSucursal);
        Assert.Equal(15, stock.Stock); // Initial 10 + 5 purchased
    }

    [Fact]
    public void CrearCompra_SinCajaActiva_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_SinCajaActiva_LanzaExcepcion));
        CompraService service = CrearService(context);

        // No active caja
        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        // Note: No caja created

        // Request
        var request = new CompraRequestDto
        {
            SucursalId = sucursal.ID_SUCURSAL,
            Items = new List<CompraItemDto>
            {
                new() { ProductoId = 1, Cantidad = 1, CostoUnitario = 10 }
            }
        };

        // Act & Assert
        Assert.Throws<CompraSinCajaActivaException>(() =>
        {
            service.CrearCompra(request);
        });
    }

    [Fact]
    public void CrearCompra_ItemsVacios_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_ItemsVacios_LanzaExcepcion));
        CompraService service = CrearService(context);

        // Create active caja
        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        // Request with empty items
        var request = new CompraRequestDto
        {
            SucursalId = sucursal.ID_SUCURSAL,
            Items = new List<CompraItemDto>()
        };

        // Act & Assert
        Assert.Throws<CompraSinItemsException>(() =>
        {
            service.CrearCompra(request);
        });
    }

    [Fact]
    public void CrearCompra_ConNuevosProductos_CreaProductosAtomicos()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_ConNuevosProductos_CreaProductosAtomicos));
        CompraService service = CrearService(context);

        // Create active caja
        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        // Request with inline creation (ProductoId = 0 + inline fields)
        var request = new CompraRequestDto
        {
            SucursalId = sucursal.ID_SUCURSAL,
            Items = new List<CompraItemDto>
            {
                new()
                {
                    ProductoId = 0,
                    Cantidad = 3,
                    CostoUnitario = 20,
                    CodigoBarra = "NUEVO001",
                    Nombre = "Producto Nuevo",
                    Precio = 30,
                    Costo = 20
                }
            }
        };

        // Act
        CompraResponseDto resultado = service.CrearCompra(request);

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal(3 * 20, resultado.TotalGasto);
        Assert.Single(resultado.Items);
        Assert.Equal("Producto Nuevo", resultado.Items[0].ProductoNombre);

        // Verify new product was created
        Producto productoCreado = context.Productos.First(p => p.CODIGO_BARRA == "NUEVO001");
        Assert.Equal("Producto Nuevo", productoCreado.NOMBRE);
        Assert.Equal(30, productoCreado.PRECIO);
        Assert.Equal(20, productoCreado.COSTO);

        // Verify stock was created and updated
        StockSucursal stock = context.StockSucursales.First();
        Assert.Equal(productoCreado.ID_PRODUCTO, stock.IdProducto);
        Assert.Equal(sucursal.ID_SUCURSAL, stock.IdSucursal);
        Assert.Equal(3, stock.Stock); // 0 initial + 3 purchased
    }

    [Fact]
    public void CrearCompra_CodigoBarraDuplicado_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_CodigoBarraDuplicado_LanzaExcepcion));
        CompraService service = CrearService(context);

        // Create active caja
        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        // Seed existing product with same barcode
        Producto productoExistente = CrearProducto(context, 1, "DUPLICADO", "Producto Existente", 100, 80, 10);

        // Request with duplicate barcode via inline creation
        var request = new CompraRequestDto
        {
            SucursalId = sucursal.ID_SUCURSAL,
            Items = new List<CompraItemDto>
            {
                new()
                {
                    ProductoId = 0,
                    Cantidad = 1,
                    CostoUnitario = 50,
                    CodigoBarra = "DUPLICADO", // Same as existing product
                    Nombre = "Producto Duplicado",
                    Precio = 60,
                    Costo = 50
                }
            }
        };

        // Act & Assert
        Assert.Throws<ProductoCodigoDuplicadoException>(() =>
        {
            service.CrearCompra(request);
        });
    }

    [Fact]
    public void CrearCompra_ProductoExistente_ActualizaPrecioYCosto()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_ProductoExistente_ActualizaPrecioYCosto));
        CompraService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        // Create product with initial values
        Producto producto = CrearProducto(context, 1, "ACT001", "Producto Actualizable", 100, 80, 10);

        // Request with different precio/costo
        var request = new CompraRequestDto
        {
            SucursalId = sucursal.ID_SUCURSAL,
            Items = new List<CompraItemDto>
            {
                new()
                {
                    ProductoId = producto.ID_PRODUCTO,
                    Cantidad = 2,
                    CostoUnitario = 90,
                    Precio = 120,  // changed from 100
                    Costo = 85     // changed from 80
                }
            }
        };

        // Act
        service.CrearCompra(request);

        // Assert — product was updated
        Producto actualizado = context.Productos.Find(producto.ID_PRODUCTO)!;
        Assert.Equal(120, actualizado.PRECIO);
        Assert.Equal(85, actualizado.COSTO);
    }

    [Fact]
    public void CrearCompra_ProductoExistente_PrecioCostoIguales_NoActualiza()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_ProductoExistente_PrecioCostoIguales_NoActualiza));
        CompraService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        // Create product with initial values
        Producto producto = CrearProducto(context, 1, "SINCMBIO", "Producto Sin Cambio", 100, 80, 10);

        // Request with same precio/costo (Precio=0 means skip price update)
        var request = new CompraRequestDto
        {
            SucursalId = sucursal.ID_SUCURSAL,
            Items = new List<CompraItemDto>
            {
                new()
                {
                    ProductoId = producto.ID_PRODUCTO,
                    Cantidad = 2,
                    CostoUnitario = 75,
                    Precio = 0,      // 0 means "don't update price"
                    Costo = null     // null means "don't update cost"
                }
            }
        };

        // Act
        service.CrearCompra(request);

        // Assert — product values unchanged
        Producto actualizado = context.Productos.Find(producto.ID_PRODUCTO)!;
        Assert.Equal(100, actualizado.PRECIO);
        Assert.Equal(80, actualizado.COSTO);
    }

    [Fact]
    public void CrearCompra_InlineCreation_SinCodigoBarra_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_InlineCreation_SinCodigoBarra_LanzaExcepcion));
        CompraService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        // Request with inline creation but missing CodigoBarra
        var request = new CompraRequestDto
        {
            SucursalId = sucursal.ID_SUCURSAL,
            Items = new List<CompraItemDto>
            {
                new()
                {
                    ProductoId = 0,
                    Cantidad = 1,
                    CostoUnitario = 10,
                    CodigoBarra = "",     // empty
                    Nombre = "Sin Codigo",
                    Precio = 50,
                    Costo = 10
                }
            }
        };

        // Act & Assert
        Assert.Throws<ArgumentException>(() => service.CrearCompra(request));
    }

    [Fact]
    public void CrearCompra_InlineCreation_SinNombre_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_InlineCreation_SinNombre_LanzaExcepcion));
        CompraService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        // Request with inline creation but missing Nombre
        var request = new CompraRequestDto
        {
            SucursalId = sucursal.ID_SUCURSAL,
            Items = new List<CompraItemDto>
            {
                new()
                {
                    ProductoId = 0,
                    Cantidad = 1,
                    CostoUnitario = 10,
                    CodigoBarra = "SINNOMBRE",
                    Nombre = "",          // empty
                    Precio = 50,
                    Costo = 10
                }
            }
        };

        // Act & Assert
        Assert.Throws<ArgumentException>(() => service.CrearCompra(request));
    }

    [Fact]
    public void CrearCompra_StockNoInicializado_CreayActualizaStock()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_StockNoInicializado_CreayActualizaStock));
        CompraService service = CrearService(context);

        // Create active caja
        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        // Create product with no stock tracking
        Producto producto = CrearProducto(context, 1, "SINSTOCK", "Producto Sin Stock", 100, 80);

        // Request
        var request = new CompraRequestDto
        {
            SucursalId = sucursal.ID_SUCURSAL,
            Items = new List<CompraItemDto>
            {
                new() { ProductoId = producto.ID_PRODUCTO, Cantidad = 4, CostoUnitario = 70 }
            }
        };

        // Act
        CompraResponseDto resultado = service.CrearCompra(request);

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal(4 * 70, resultado.TotalGasto);

        // Verify StockSucursal was created and updated
        StockSucursal stock = context.StockSucursales.First();
        Assert.Equal(producto.ID_PRODUCTO, stock.IdProducto);
        Assert.Equal(sucursal.ID_SUCURSAL, stock.IdSucursal);
        Assert.Equal(4, stock.Stock); // Created with 0 + 4 purchased
    }
}