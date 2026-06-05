using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using PosWeb.Application.Exceptions;
using PosWeb.Application.Compras;
using PosWeb.Application.Deudas;
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
        Sucursal sucursal = new Sucursal("001", "Sucursal Test", 1);
        sucursal.Activar();
        context.Sucursales.Add(sucursal);
        
        Usuario usuario = new Usuario(1, "testuser", "hashed", "UsuarioComun");
        usuario.Activar();
        context.Usuarios.Add(usuario);

        // Seed a proveedor
        context.Proveedores.Add(new Proveedor("TESTPROV", "Proveedor Test"));
        
        context.SaveChanges();
        return context;
    }

    private static CompraService CrearService(PosDbContext context)
    {
        var deudaService = new DeudaService(context);
        return new CompraService(context, deudaService);
    }

    private static Caja CrearCajaAbierta(PosDbContext context, int sucursalId, int usuarioId)
    {
        var caja = new Caja(sucursalId, 1000, usuarioId);
        context.Cajas.Add(caja);
        context.SaveChanges();
        return caja;
    }

    private static Producto CrearProducto(PosDbContext context, int id, string codigo, string nombre, decimal precio, decimal costo)
    {
        Producto producto = new Producto(codigo, codigo, nombre, precio, costo);
        TestHelpers.SetId(producto, id, "ID_PRODUCTO");
        context.Productos.Add(producto);
        context.SaveChanges();
        return producto;
    }

    private static int SeedProveedor(PosDbContext context)
    {
        return context.Proveedores.First().ID_PROVEEDOR;
    }

    [Fact]
    public void CrearCompra_ConItemsValidos_CreaCompraGastoYActualizaStockAtomico()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_ConItemsValidos_CreaCompraGastoYActualizaStockAtomico));
        CompraService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        int proveedorId = SeedProveedor(context);
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        Producto producto = CrearProducto(context, 1, "COD001", "Producto Test", 100m, 80m);

        // Act
        CompraResponseDto resultado = service.CrearCompra(
            sucursal.ID_SUCURSAL,
            proveedorId,
            usuario.ID_USUARIO,
            new List<CompraItemDto>
            {
                new() { ProductoId = producto.ID_PRODUCTO, Cantidad = 5, CostoUnitario = 75 }
            });

        // Assert
        Assert.NotNull(resultado);
        Assert.NotEqual(0, resultado.CompraId);
        Assert.NotEqual(0, resultado.GastoId);
        Assert.Equal(5 * 75, resultado.TotalGasto);
        Assert.NotEmpty(resultado.Items);

        // Verify Compra was created
        Compra compra = context.Compras.First();
        Assert.Equal(sucursal.ID_SUCURSAL, compra.ID_SUCURSAL);
        Assert.Equal(proveedorId, compra.ID_PROVEEDOR);
        Assert.Equal(usuario.ID_USUARIO, compra.ID_USUARIO);
        Assert.Equal(resultado.GastoId, compra.ID_GASTO);

        // Verify Gasto was created with ID_COMPRA
        Gasto gasto = context.Gastos.First();
        Assert.Equal(caja.ID_CAJA, gasto.ID_CAJA);
        Assert.Equal(5 * 75, gasto.MONTO);
        Assert.Contains("Proveedor Test", gasto.DETALLE);

        // Verify stock was updated atomically
        StockSucursal stock = context.StockSucursales.First();
        Assert.Equal(producto.ID_PRODUCTO, stock.ID_PRODUCTO);
        Assert.Equal(sucursal.ID_SUCURSAL, stock.ID_SUCURSAL);
        Assert.Equal(5, stock.STOCK);

        // Verify RenglonCompra was created
        RenglonCompra renglon = context.RenglonesCompra.First();
        Assert.Equal(compra.ID_COMPRA, renglon.ID_COMPRA);
        Assert.Equal(producto.ID_PRODUCTO, renglon.ID_PRODUCTO);
        Assert.Equal(5, renglon.CANTIDAD);
        Assert.Equal(75, renglon.PRECIO_UNITARIO);
    }

    [Fact]
    public void CrearCompra_SinCajaActiva_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_SinCajaActiva_LanzaExcepcion));
        CompraService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        int proveedorId = SeedProveedor(context);
        // No active caja

        // Act & Assert
        Assert.Throws<CompraSinCajaActivaException>(() =>
        {
            service.CrearCompra(sucursal.ID_SUCURSAL, proveedorId, usuario.ID_USUARIO,
                new List<CompraItemDto> { new() { ProductoId = 1, Cantidad = 1, CostoUnitario = 10 } });
        });
    }

    [Fact]
    public void CrearCompra_ProveedorInexistente_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_ProveedorInexistente_LanzaExcepcion));
        CompraService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        // Act & Assert — proveedorId 999 doesn't exist
        Assert.Throws<ProveedorNoEncontradoException>(() =>
        {
            service.CrearCompra(sucursal.ID_SUCURSAL, 999, usuario.ID_USUARIO,
                new List<CompraItemDto> { new() { ProductoId = 1, Cantidad = 1, CostoUnitario = 10 } });
        });

        // Verify no partial state
        Assert.Empty(context.Compras);
        Assert.Empty(context.Gastos);
    }

    [Fact]
    public void CrearCompra_ItemsVacios_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_ItemsVacios_LanzaExcepcion));
        CompraService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        int proveedorId = SeedProveedor(context);
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        // Act & Assert
        Assert.Throws<CompraSinItemsException>(() =>
        {
            service.CrearCompra(sucursal.ID_SUCURSAL, proveedorId, usuario.ID_USUARIO,
                new List<CompraItemDto>());
        });
    }

    [Fact]
    public void CrearCompra_ConNuevosProductos_CreaProductosAtomicos()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_ConNuevosProductos_CreaProductosAtomicos));
        CompraService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        int proveedorId = SeedProveedor(context);
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        // Act
        CompraResponseDto resultado = service.CrearCompra(
            sucursal.ID_SUCURSAL,
            proveedorId,
            usuario.ID_USUARIO,
            new List<CompraItemDto>
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
            });

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal(3 * 20, resultado.TotalGasto);
        Assert.Single(resultado.Items);
        Assert.Equal("Producto Nuevo", resultado.Items[0].ProductoNombre);

        Producto productoCreado = context.Productos.First(p => p.CODIGO_BARRAS == "NUEVO001");
        Assert.Equal("Producto Nuevo", productoCreado.DESC_PRODUCTO);
        Assert.Equal(30, productoCreado.PRECIO);
        Assert.Equal(20, productoCreado.COSTO);

        StockSucursal stock = context.StockSucursales.First();
        Assert.Equal(productoCreado.ID_PRODUCTO, stock.ID_PRODUCTO);
        Assert.Equal(3, stock.STOCK);
    }

    [Fact]
    public void CrearCompra_CodigoBarraDuplicado_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_CodigoBarraDuplicado_LanzaExcepcion));
        CompraService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        int proveedorId = SeedProveedor(context);
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        Producto productoExistente = CrearProducto(context, 1, "DUPLICADO", "Producto Existente", 100m, 80m);

        // Act & Assert
        Assert.Throws<ProductoCodigoDuplicadoException>(() =>
        {
            service.CrearCompra(sucursal.ID_SUCURSAL, proveedorId, usuario.ID_USUARIO,
                new List<CompraItemDto>
                {
                    new()
                    {
                        ProductoId = 0,
                        Cantidad = 1,
                        CostoUnitario = 50,
                        CodigoBarra = "DUPLICADO",
                        Nombre = "Producto Duplicado",
                        Precio = 60,
                        Costo = 50
                    }
                });
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
        int proveedorId = SeedProveedor(context);
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        Producto producto = CrearProducto(context, 1, "ACT001", "Producto Actualizable", 100m, 80m);

        // Act
        service.CrearCompra(sucursal.ID_SUCURSAL, proveedorId, usuario.ID_USUARIO,
            new List<CompraItemDto>
            {
                new()
                {
                    ProductoId = producto.ID_PRODUCTO,
                    Cantidad = 2,
                    CostoUnitario = 90,
                    Precio = 120,
                    Costo = 85
                }
            });

        // Assert
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
        int proveedorId = SeedProveedor(context);
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        Producto producto = CrearProducto(context, 1, "SINCMBIO", "Producto Sin Cambio", 100m, 80m);

        // Act
        service.CrearCompra(sucursal.ID_SUCURSAL, proveedorId, usuario.ID_USUARIO,
            new List<CompraItemDto>
            {
                new()
                {
                    ProductoId = producto.ID_PRODUCTO,
                    Cantidad = 2,
                    CostoUnitario = 75,
                    Precio = 0,
                    Costo = null
                }
            });

        // Assert
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
        int proveedorId = SeedProveedor(context);
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        // Act & Assert
        Assert.Throws<ArgumentException>(() =>
            service.CrearCompra(sucursal.ID_SUCURSAL, proveedorId, usuario.ID_USUARIO,
                new List<CompraItemDto>
                {
                    new()
                    {
                        ProductoId = 0, Cantidad = 1, CostoUnitario = 10,
                        CodigoBarra = "", Nombre = "Sin Codigo", Precio = 50, Costo = 10
                    }
                }));
    }

    [Fact]
    public void CrearCompra_InlineCreation_SinNombre_LanzaExcepcion()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_InlineCreation_SinNombre_LanzaExcepcion));
        CompraService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        int proveedorId = SeedProveedor(context);
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        // Act & Assert
        Assert.Throws<ArgumentException>(() =>
            service.CrearCompra(sucursal.ID_SUCURSAL, proveedorId, usuario.ID_USUARIO,
                new List<CompraItemDto>
                {
                    new()
                    {
                        ProductoId = 0, Cantidad = 1, CostoUnitario = 10,
                        CodigoBarra = "SINNOMBRE", Nombre = "", Precio = 50, Costo = 10
                    }
                }));
    }

    [Fact]
    public void CrearCompra_StockNoInicializado_CreayActualizaStock()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_StockNoInicializado_CreayActualizaStock));
        CompraService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        int proveedorId = SeedProveedor(context);
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);

        Producto producto = CrearProducto(context, 1, "SINSTOCK", "Producto Sin Stock", 100m, 80m);

        // Act
        CompraResponseDto resultado = service.CrearCompra(
            sucursal.ID_SUCURSAL,
            proveedorId,
            usuario.ID_USUARIO,
            new List<CompraItemDto>
            {
                new() { ProductoId = producto.ID_PRODUCTO, Cantidad = 4, CostoUnitario = 70 }
            });

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal(4 * 70, resultado.TotalGasto);

        StockSucursal stock = context.StockSucursales.First();
        Assert.Equal(producto.ID_PRODUCTO, stock.ID_PRODUCTO);
        Assert.Equal(sucursal.ID_SUCURSAL, stock.ID_SUCURSAL);
        Assert.Equal(4, stock.STOCK);
    }

    [Fact]
    public void CrearCompra_ConProveedor_CreaDeuda()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(CrearCompra_ConProveedor_CreaDeuda));
        CompraService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Sucursal sucursal = context.Sucursales.First();
        int proveedorId = SeedProveedor(context);
        Caja caja = CrearCajaAbierta(context, sucursal.ID_SUCURSAL, usuario.ID_USUARIO);
        Producto producto = CrearProducto(context, 1, "CONDEUDA", "Producto con deuda", 150m, 100m);

        // Act
        CompraResponseDto resultado = service.CrearCompra(
            sucursal.ID_SUCURSAL,
            proveedorId,
            usuario.ID_USUARIO,
            new List<CompraItemDto>
            {
                new() { ProductoId = producto.ID_PRODUCTO, Cantidad = 3, CostoUnitario = 80 }
            });

        // Assert
        Assert.NotNull(resultado);
        Deuda? deuda = context.Deudas.FirstOrDefault();
        Assert.NotNull(deuda);
        Assert.Equal(proveedorId, deuda!.ID_PROVEEDOR);
        Assert.Equal(resultado.CompraId, deuda.ID_COMPRA);
        Assert.Equal(3 * 80, deuda.MONTO_DEUDA);
        Assert.False(deuda.PAGO);
    }
}
