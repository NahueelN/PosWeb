using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Http;
using Microsoft.Extensions.Logging.Abstractions;
using PosWeb.Application.Exceptions;
using PosWeb.Application.MercadoPago;
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
        return new VentaService(context, stockService, CrearMercadoPagoService(context));
    }

    private static MercadoPagoService CrearMercadoPagoService(PosDbContextLocal context)
    {
        IConfiguration config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>())
            .Build();
        TokenEncryptionService encryption = new TokenEncryptionService(Convert.ToBase64String(new byte[32]));
        return new MercadoPagoService(context, encryption, new StubHttpClientFactory(), config, NullLogger<MercadoPagoService>.Instance);
    }

    private sealed class StubHttpClientFactory : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new();
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

    private static void AgregarCliente(PosDbContextLocal context, int id)
    {
        Cliente cliente = new Cliente($"Cliente {id}", "ConsumidorFinal", "0");
        TestHelpers.SetId(cliente, id, "ID_CLIENTE");
        context.Cliente.Add(cliente);
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
    public async Task CrearVenta_Valida_CreaVentaCorrectamente()
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

        VentaResultadoDto resultado = await service.CrearVenta(dto);

        Assert.Equal(200m, resultado.Total);
        Assert.Single(context.Venta);
        Assert.Single(context.RenglonVenta);
    }

    [Fact]
    public async Task CrearVenta_SinItems_LanzaExcepcion()
    {
        using PosDbContextLocal context = CrearContexto();
        VentaService service = CrearService(context);

        VentaDto dto = new VentaDto
        {
            SucursalId = 1,
            Items = new List<VentaItemDto>()
        };

        await Assert.ThrowsAsync<VentaSinItemsException>(() =>
        {
            return service.CrearVenta(dto);
        });
    }

    [Fact]
    public async Task CrearVenta_SucursalNoExiste_LanzaExcepcion()
    {
        using PosDbContextLocal context = CrearContexto();
        VentaService service = CrearService(context);

        VentaDto dto = CrearVentaDto(
            99,
            new[] { new VentaItemDto { ProductoId = 1, Cantidad = 1 } }
        );

        await Assert.ThrowsAsync<SucursalNoExisteException>(() =>
        {
            return service.CrearVenta(dto);
        });
    }

    [Fact]
    public async Task CrearVenta_SucursalInactiva_LanzaExcepcion()
    {
        using PosDbContextLocal context = CrearContexto();
        VentaService service = CrearService(context);

        AgregarSucursal(context, 1, 1, false);

        VentaDto dto = CrearVentaDto(
            1,
            new[] { new VentaItemDto { ProductoId = 1, Cantidad = 1 } }
        );

        await Assert.ThrowsAsync<SucursalInactivaException>(() =>
        {
            return service.CrearVenta(dto);
        });
    }

    [Fact]
    public async Task CrearVenta_ProductoNoExiste_LanzaExcepcion()
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

        await Assert.ThrowsAsync<ProductoNoExisteException>(() =>
        {
            return service.CrearVenta(dto);
        });
    }

    [Fact]
    public async Task CrearVenta_ProductoInactivo_LanzaExcepcion()
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

        await Assert.ThrowsAsync<ProductoInactivoException>(() =>
        {
            return service.CrearVenta(dto);
        });
    }

    [Fact]
    public async Task CrearVenta_StockSucursalInsuficiente_LanzaExcepcion()
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

        await Assert.ThrowsAsync<StockSucursalInsuficienteException>(() =>
        {
            return service.CrearVenta(dto);
        });
    }

    [Fact]
    public async Task CrearVenta_DescuentaStockSucursalCorrectamente()
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

        await service.CrearVenta(dto);

        StockSucursal stockSuc = context.StockSucursal.First();

        Assert.Equal(7, stockSuc.STOCK);
    }

    [Fact]
    public async Task CrearVenta_PagoParcial_CreaDeudaConSaldoPendienteCorrecto()
    {
        using PosDbContextLocal context = CrearContexto();
        VentaService service = CrearService(context);

        AgregarSucursal(context, 1, 1);
        AgregarProducto(context, 1, 10);
        AgregarStockSucursal(context, 1, 1, 1, 10);
        AgregarCajaActiva(context, 1);
        AgregarCliente(context, 1);

        VentaDto dto = CrearVentaDto(
            1,
            new[] { new VentaItemDto { ProductoId = 1, Cantidad = 2 } }, // total: 200
            new List<PagoVentaDto> { new PagoVentaDto { MedioPagoId = 1, Monto = 50 } }
        );
        dto.ClienteId = 1;

        VentaResultadoDto resultado = await service.CrearVenta(dto);

        Deuda deuda = context.Deuda.Single();
        Assert.Equal(200m, deuda.MONTO_DEUDA);
        Assert.Equal(50m, deuda.MONTO_PAGADO);
        Assert.False(deuda.PAGO);
        Assert.Equal(150m, resultado.DeudaMonto);
    }
}
