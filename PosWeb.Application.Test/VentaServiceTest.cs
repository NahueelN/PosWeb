using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Application.StockSucursales;
using PosWeb.Application.Ventas;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Domain.Exceptions;
using PosWeb.Testing;

namespace PosWeb.Application.Test;

public class VentaServiceTest
{
    private static PosDbContextLocal CrearContexto()
    {
        DbContextOptions<PosDbContextLocal> options =
            new DbContextOptionsBuilder<PosDbContextLocal>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

        return new PosDbContextLocal(options);
    }

    private static VentaService CrearService(PosDbContextLocal context)
    {
        StockSucursalService stockService = new StockSucursalService(context);
        return new VentaService(context, stockService);
    }

    private static void AgregarSucursal(
        PosDbContextLocal context,
        int id,
        int numero,
        bool activa = true)
    {
        Sucursal sucursal = new Sucursal(
            $"COD{numero}",
            $"Sucursal {numero}",
            1
        );

        if (!activa)
        {
            sucursal.Desactivar();
        }

        TestHelpers.SetId(sucursal, id, "ID_SUCURSAL");

        context.Sucursal.Add(sucursal);
        context.SaveChanges();
    }

    private static void AgregarProducto(
        PosDbContextLocal context,
        int id,
        int stock,
        bool activo = true)
    {
        Producto producto = new Producto(
            $"BAR{id}",
            $"BAR{id}",
            $"Producto {id}",
            100m,
            80m
        );

        if (!activo)
        {
            producto.Desactivar();
        }

        TestHelpers.SetId(producto, id, "ID_PRODUCTO");

        context.Producto.Add(producto);
        context.SaveChanges();
    }

    private static void AgregarUsuario(PosDbContextLocal context, int id)
    {
        Usuario usuario = new Usuario(id, "test_user", "$2a$11$dummyhash", "UsuarioComun");
        context.Usuario.Add(usuario);
        context.SaveChanges();
    }

    private static void AgregarCajaActiva(PosDbContextLocal context, int sucursalId)
    {
        if (!context.Usuario.Any())
        {
            AgregarUsuario(context, 1);
        }
        if (!context.MedioPago.Any())
        {
            AgregarMedioPago(context, 1, "Efectivo", true);
        }
        int userId = context.Usuario.First().ID_USUARIO;
        Caja caja = new Caja(sucursalId, 1000, userId);
        TestHelpers.SetId(caja, 1, "ID_CAJA");
        context.Caja.Add(caja);
        context.SaveChanges();
    }

    private static void AgregarStockSucursal(
        PosDbContextLocal context,
        int id,
        int productoId,
        int sucursalId,
        int stock)
    {
        StockSucursal stockSuc = new StockSucursal(productoId, sucursalId, stock);
        context.StockSucursal.Add(stockSuc);
        context.SaveChanges();
    }

    private static void AgregarMedioPago(PosDbContextLocal context, int id, string descripcion, bool pagaVuelto)
    {
        string codigo = descripcion.ToUpper().Replace(" ", "_");
        context.MedioPago.Add(new MedioPago(id, codigo, descripcion, pagaVuelto));
        context.SaveChanges();
    }

    private static VentaDto CrearVentaDto(
        int sucursalId,
        VentaItemDto[] items,
        List<PagoVentaDto>? pagos = null)
    {
        return new VentaDto
        {
            SucursalId = sucursalId,
            Items = items.ToList(),
            Pagos = pagos
        };
    }

    [Fact]
    public void CrearVenta_Valida_CreaVentaCorrectamente()
    {
        using PosDbContextLocal context = CrearContexto();
        VentaService service = CrearService(context);

        AgregarSucursal(context, 1, 1);
        AgregarProducto(context, 1, 10);
        AgregarStockSucursal(context, 1, 1, 1, 10);
        AgregarCajaActiva(context, 1);

        VentaDto dto = CrearVentaDto(
            1,
            new[] { new VentaItemDto { ProductoId = 1, Cantidad = 2 } },
            new List<PagoVentaDto> { new PagoVentaDto { MedioPagoId = 1, Monto = 200 } }
        );

        VentaResultadoDto resultado = service.CrearVenta(dto);

        Assert.Equal(200m, resultado.Total);
        Assert.Single(context.Venta);
        Assert.Single(context.RenglonVenta);
    }

    [Fact]
    public void CrearVenta_SinItems_LanzaExcepcion()
    {
        using PosDbContextLocal context = CrearContexto();
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
        using PosDbContextLocal context = CrearContexto();
        VentaService service = CrearService(context);

        VentaDto dto = CrearVentaDto(
            99,
            new[] { new VentaItemDto { ProductoId = 1, Cantidad = 1 } }
        );

        Assert.Throws<SucursalNoExisteException>(() =>
        {
            service.CrearVenta(dto);
        });
    }

    [Fact]
    public void CrearVenta_SucursalInactiva_LanzaExcepcion()
    {
        using PosDbContextLocal context = CrearContexto();
        VentaService service = CrearService(context);

        AgregarSucursal(context, 1, 1, false);

        VentaDto dto = CrearVentaDto(
            1,
            new[] { new VentaItemDto { ProductoId = 1, Cantidad = 1 } }
        );

        Assert.Throws<SucursalInactivaException>(() =>
        {
            service.CrearVenta(dto);
        });
    }

    [Fact]
    public void CrearVenta_ProductoNoExiste_LanzaExcepcion()
    {
        using PosDbContextLocal context = CrearContexto();
        VentaService service = CrearService(context);

        AgregarSucursal(context, 1, 1);
        AgregarCajaActiva(context, 1);

        VentaDto dto = CrearVentaDto(
            1,
            new[] { new VentaItemDto { ProductoId = 99, Cantidad = 1 } },
            new List<PagoVentaDto> { new PagoVentaDto { MedioPagoId = 1, Monto = 100 } }
        );

        Assert.Throws<ProductoNoExisteException>(() =>
        {
            service.CrearVenta(dto);
        });
    }

    [Fact]
    public void CrearVenta_ProductoInactivo_LanzaExcepcion()
    {
        using PosDbContextLocal context = CrearContexto();
        VentaService service = CrearService(context);

        AgregarSucursal(context, 1, 1);
        AgregarProducto(context, 1, 10, false);
        AgregarCajaActiva(context, 1);

        VentaDto dto = CrearVentaDto(
            1,
            new[] { new VentaItemDto { ProductoId = 1, Cantidad = 1 } },
            new List<PagoVentaDto> { new PagoVentaDto { MedioPagoId = 1, Monto = 100 } }
        );

        Assert.Throws<ProductoInactivoException>(() =>
        {
            service.CrearVenta(dto);
        });
    }

    [Fact]
    public void CrearVenta_StockSucursalInsuficiente_LanzaExcepcion()
    {
        using PosDbContextLocal context = CrearContexto();
        VentaService service = CrearService(context);

        AgregarSucursal(context, 1, 1);
        AgregarProducto(context, 1, 100);
        // Per-sucursal stock is insufficient
        AgregarStockSucursal(context, 1, 1, 1, 2);
        AgregarCajaActiva(context, 1);

        VentaDto dto = CrearVentaDto(
            1,
            new[] { new VentaItemDto { ProductoId = 1, Cantidad = 5 } },
            new List<PagoVentaDto> { new PagoVentaDto { MedioPagoId = 1, Monto = 500 } }
        );

        Assert.Throws<StockSucursalInsuficienteException>(() =>
        {
            service.CrearVenta(dto);
        });
    }

    [Fact]
    public void CrearVenta_DescuentaStockSucursalCorrectamente()
    {
        using PosDbContextLocal context = CrearContexto();
        VentaService service = CrearService(context);

        AgregarSucursal(context, 1, 1);
        AgregarProducto(context, 1, 10);
        AgregarStockSucursal(context, 1, 1, 1, 10);
        AgregarCajaActiva(context, 1);

        VentaDto dto = CrearVentaDto(
            1,
            new[] { new VentaItemDto { ProductoId = 1, Cantidad = 3 } },
            new List<PagoVentaDto> { new PagoVentaDto { MedioPagoId = 1, Monto = 300 } }
        );

        service.CrearVenta(dto);

        StockSucursal stockSuc = context.StockSucursal.First();

        Assert.Equal(7, stockSuc.STOCK);
    }
}
