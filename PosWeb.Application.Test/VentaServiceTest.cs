using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Application.Ventas;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Domain.Exceptions;
using PosWeb.Testing;

namespace PosWeb.Application.Test;

public class VentaServiceTest
{
    private static PosDbContext CrearContexto()
    {
        DbContextOptions<PosDbContext> options =
            new DbContextOptionsBuilder<PosDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

        return new PosDbContext(options);
    }

    private static VentaService CrearService(PosDbContext context)
    {
        return new VentaService(context);
    }

    private static void AgregarSucursal(
        PosDbContext context,
        int id,
        int numero,
        bool activa = true)
    {
        Sucursal sucursal = new Sucursal(
            numero,
            $"COD{numero}",
            $"Sucursal {numero}"
        );

        if (!activa)
        {
            sucursal.Desactivar();
        }

        TestHelpers.SetId(sucursal, id, "ID_SUCURSAL");

        context.Sucursales.Add(sucursal);
        context.SaveChanges();
    }

    private static void AgregarProducto(
        PosDbContext context,
        int id,
        int stock,
        bool activo = true)
    {
        Producto producto = new Producto(
            $"BAR{id}",
            $"Producto {id}",
            100,
            80,
            stock
        );

        if (!activo)
        {
            producto.Desactivar();
        }

        TestHelpers.SetId(producto, id, "ID_PRODUCTO");

        context.Productos.Add(producto);
        context.SaveChanges();
    }

    private static VentaDto CrearVentaDto(
        int sucursalId,
        params VentaItemDto[] items)
    {
        return new VentaDto
        {
            SucursalId = sucursalId,
            Items = items.ToList()
        };
    }

    [Fact]
    public void CrearVenta_Valida_CreaVentaCorrectamente()
    {
        using PosDbContext context = CrearContexto();
        VentaService service = CrearService(context);

        AgregarSucursal(context, 1, 1);
        AgregarProducto(context, 1, 10);

        VentaDto dto = CrearVentaDto(
            1,
            new VentaItemDto { ProductoId = 1, Cantidad = 2 }
        );

        VentaResultadoDto resultado = service.CrearVenta(dto);

        Assert.Equal(200, resultado.Total);
        Assert.Single(context.Ventas);
        Assert.Single(context.RenglonesVenta);
    }

    [Fact]
    public void CrearVenta_SinItems_LanzaExcepcion()
    {
        using PosDbContext context = CrearContexto();
        VentaService service = CrearService(context);

        VentaDto dto = new VentaDto
        {
            SucursalId = 1,
            Items = new List<VentaItemDto>()
        };

        Assert.Throws<VentaSinItemsException>(() =>
        {
            service.CrearVenta(dto);
        });
    }

    [Fact]
    public void CrearVenta_SucursalNoExiste_LanzaExcepcion()
    {
        using PosDbContext context = CrearContexto();
        VentaService service = CrearService(context);

        VentaDto dto = CrearVentaDto(
            99,
            new VentaItemDto { ProductoId = 1, Cantidad = 1 }
        );

        Assert.Throws<SucursalNoExisteException>(() =>
        {
            service.CrearVenta(dto);
        });
    }

    [Fact]
    public void CrearVenta_SucursalInactiva_LanzaExcepcion()
    {
        using PosDbContext context = CrearContexto();
        VentaService service = CrearService(context);

        AgregarSucursal(context, 1, 1, false);

        VentaDto dto = CrearVentaDto(
            1,
            new VentaItemDto { ProductoId = 1, Cantidad = 1 }
        );

        Assert.Throws<SucursalInactivaException>(() =>
        {
            service.CrearVenta(dto);
        });
    }

    [Fact]
    public void CrearVenta_ProductoNoExiste_LanzaExcepcion()
    {
        using PosDbContext context = CrearContexto();
        VentaService service = CrearService(context);

        AgregarSucursal(context, 1, 1);

        VentaDto dto = CrearVentaDto(
            1,
            new VentaItemDto { ProductoId = 99, Cantidad = 1 }
        );

        Assert.Throws<ProductoNoExisteException>(() =>
        {
            service.CrearVenta(dto);
        });
    }

    [Fact]
    public void CrearVenta_ProductoInactivo_LanzaExcepcion()
    {
        using PosDbContext context = CrearContexto();
        VentaService service = CrearService(context);

        AgregarSucursal(context, 1, 1);
        AgregarProducto(context, 1, 10, false);

        VentaDto dto = CrearVentaDto(
            1,
            new VentaItemDto { ProductoId = 1, Cantidad = 1 }
        );

        Assert.Throws<ProductoInactivoException>(() =>
        {
            service.CrearVenta(dto);
        });
    }

    [Fact]
    public void CrearVenta_StockInsuficiente_LanzaExcepcion()
    {
        using PosDbContext context = CrearContexto();
        VentaService service = CrearService(context);

        AgregarSucursal(context, 1, 1);
        AgregarProducto(context, 1, 1);

        VentaDto dto = CrearVentaDto(
            1,
            new VentaItemDto { ProductoId = 1, Cantidad = 5 }
        );

        Assert.Throws<StockInsuficienteException>(() =>
        {
            service.CrearVenta(dto);
        });
    }

    [Fact]
    public void CrearVenta_DescuentaStockCorrectamente()
    {
        using PosDbContext context = CrearContexto();
        VentaService service = CrearService(context);

        AgregarSucursal(context, 1, 1);
        AgregarProducto(context, 1, 10);

        VentaDto dto = CrearVentaDto(
            1,
            new VentaItemDto { ProductoId = 1, Cantidad = 3 }
        );

        service.CrearVenta(dto);

        Producto producto = context.Productos.First();

        Assert.Equal(7, producto.STOCK);
    }
}