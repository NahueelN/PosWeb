using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using PosWeb.Application.MercadoPago;
using PosWeb.Application.Restaurante;
using PosWeb.Application.StockSucursales;
using PosWeb.Application.Ventas;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Test;

public class RestauranteTest
{
    private sealed class HttpClientFactory : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new HttpClient();
    }

    private static PosDbContextLocal CrearContexto(string dbName)
    {
        var options = new DbContextOptionsBuilder<PosDbContextLocal>()
            .UseInMemoryDatabase(dbName)
            .Options;

        return new PosDbContextLocal(options);
    }

    private static VentaService CrearVentaService(PosDbContextLocal context)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["MercadoPago:ClientId"] = "test-client",
                ["MercadoPago:ClientSecret"] = "test-secret",
                ["MercadoPago:EncryptionKey"] = "YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY="
            })
            .Build();

        var encryption = new TokenEncryptionService("YWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXoxMjM0NTY=");
        var mp = new MercadoPagoService(
            context,
            encryption,
            new HttpClientFactory(),
            config,
            NullLogger<MercadoPagoService>.Instance);
        var stock = new StockSucursalService(context);
        return new VentaService(context, stock, mp);
    }

    private static RestauranteService CrearServicio(PosDbContextLocal context)
    {
        return new RestauranteService(context, CrearVentaService(context));
    }

    private static void SeedBasico(PosDbContextLocal context)
    {
        var empresa = new Empresa("Mi Empresa", "20111111111", 1);
        context.Empresa.Add(empresa);
        context.SaveChanges();

        var sucursal = new Sucursal("SUC1", "Central", empresa.ID_EMPRESA);
        context.Sucursal.Add(sucursal);
        context.SaveChanges();

        var admin = new Usuario("admin", BCrypt.Net.BCrypt.HashPassword("123"), Roles.Admin, "admin@test.com");
        context.Usuario.Add(admin);
        context.SaveChanges();

        context.MedioPago.Add(new MedioPago(1, "EFECTIVO", "Efectivo", true));
        context.SaveChanges();

        var p1 = new Producto("P-01", "7790000000001", "Hamburguesa", 2500m, 1500m);
        var p2 = new Producto("P-02", "7790000000002", "Pizza", 5000m, 3000m);
        context.Producto.Add(p1);
        context.Producto.Add(p2);
        context.SaveChanges();

        // Stock disponible que NO debe descontarse al cobrar una mesa.
        context.StockSucursal.Add(new StockSucursal(p1.ID_PRODUCTO, sucursal.ID_SUCURSAL, 5m));
        context.SaveChanges();

        var caja = new Caja(sucursal.ID_SUCURSAL, 1000m, admin.ID_USUARIO);
        context.Caja.Add(caja);
        context.SaveChanges();
    }

    [Fact]
    public void Config_DefaultDeshabilitado_Y_Habilitable()
    {
        var context = CrearContexto(nameof(Config_DefaultDeshabilitado_Y_Habilitable));
        var service = CrearServicio(context);

        Assert.False(service.ObtenerRestauranteHabilitado());

        context.Empresa.Add(new Empresa("E", "20111111112", 1));
        context.SaveChanges();

        service.SetRestauranteHabilitado(true);
        Assert.True(service.ObtenerRestauranteHabilitado());
    }

    [Fact]
    public void Mesa_CrearListarYEstadoOcupada()
    {
        var context = CrearContexto(nameof(Mesa_CrearListarYEstadoOcupada));
        var service = CrearServicio(context);
        SeedBasico(context);
        var sucursalId = context.Sucursal.Single().ID_SUCURSAL;

        var mesa = service.CrearMesa(new UpsertMesaRequest
        {
            SucursalId = sucursalId,
            Numero = "1",
            PosX = 20,
            PosY = 30
        });

        var listado = service.ListarMesas(sucursalId);
        Assert.Single(listado);
        Assert.False(listado[0].Ocupada);
        Assert.Equal(20m, listado[0].PosX);

        var usuarioId = context.Usuario.Single().ID_USUARIO;
        var sesion = service.AbrirSesion(mesa.Id, usuarioId);
        Assert.Equal("Abierta", sesion.Estado);

        Assert.True(service.ListarMesas(sucursalId)[0].Ocupada);
    }

    [Fact]
    public void Sesion_AgregarItems_TotalYEstados()
    {
        var context = CrearContexto(nameof(Sesion_AgregarItems_TotalYEstados));
        var service = CrearServicio(context);
        SeedBasico(context);
        var sucursalId = context.Sucursal.Single().ID_SUCURSAL;
        var usuarioId = context.Usuario.Single().ID_USUARIO;
        var p1 = context.Producto.OrderBy(p => p.ID_PRODUCTO).First();
        var p2 = context.Producto.OrderBy(p => p.ID_PRODUCTO).Last();

        var mesa = service.CrearMesa(new UpsertMesaRequest { SucursalId = sucursalId, Numero = "2" });
        var sesion = service.AbrirSesion(mesa.Id, usuarioId);

        service.AgregarItem(sesion.Id, new AgregarItemComandaRequest { ProductoId = p1.ID_PRODUCTO, Cantidad = 2, Nota = "sin cebolla" });
        var itemPizza = service.AgregarItem(sesion.Id, new AgregarItemComandaRequest { ProductoId = p2.ID_PRODUCTO, Cantidad = 1 }).Single();

        sesion = service.ObtenerSesion(sesion.Id);
        // Cantidad 2 => 2 unidades individuales + 1 pizza.
        Assert.Equal(3, sesion.Items.Count);
        Assert.Equal(p1.PRECIO * 2 + p2.PRECIO, sesion.Total);

        service.CambiarEstadoItem(itemPizza.Id, EstadosItemComanda.Servido);
        service.CambiarEstadoItem(itemPizza.Id, EstadosItemComanda.Devuelto);

        sesion = service.ObtenerSesion(sesion.Id);
        Assert.Equal(p1.PRECIO * 2, sesion.Total);
        Assert.Equal(EstadosItemComanda.Devuelto, sesion.Items.First(i => i.Id == itemPizza.Id).Estado);
    }

    [Fact]
    public void Sesion_UnificarMueveItems()
    {
        var context = CrearContexto(nameof(Sesion_UnificarMueveItems));
        var service = CrearServicio(context);
        SeedBasico(context);
        var sucursalId = context.Sucursal.Single().ID_SUCURSAL;
        var usuarioId = context.Usuario.Single().ID_USUARIO;
        var p1 = context.Producto.OrderBy(p => p.ID_PRODUCTO).First();

        var mesaA = service.CrearMesa(new UpsertMesaRequest { SucursalId = sucursalId, Numero = "A" });
        var mesaB = service.CrearMesa(new UpsertMesaRequest { SucursalId = sucursalId, Numero = "B" });
        var sesionA = service.AbrirSesion(mesaA.Id, usuarioId);
        var sesionB = service.AbrirSesion(mesaB.Id, usuarioId);

        service.AgregarItem(sesionA.Id, new AgregarItemComandaRequest { ProductoId = p1.ID_PRODUCTO, Cantidad = 1 });
        service.AgregarItem(sesionA.Id, new AgregarItemComandaRequest { ProductoId = p1.ID_PRODUCTO, Cantidad = 1 });

        var unificada = service.UnificarSesiones(sesionA.Id, sesionB.Id);
        Assert.Equal(2, unificada.Items.Count);

        var origen = service.ObtenerSesion(sesionA.Id);
        Assert.Empty(origen.Items);
    }

    [Fact]
    public async Task CobrarCuenta_CreaVentaSinDescontarStock_YMarcaCobrada()
    {
        var context = CrearContexto(nameof(CobrarCuenta_CreaVentaSinDescontarStock_YMarcaCobrada));
        var service = CrearServicio(context);
        SeedBasico(context);
        var sucursalId = context.Sucursal.Single().ID_SUCURSAL;
        var usuarioId = context.Usuario.Single().ID_USUARIO;
        var p1 = context.Producto.OrderBy(p => p.ID_PRODUCTO).First();
        var stockAntes = context.StockSucursal.Single().STOCK;

        var mesa = service.CrearMesa(new UpsertMesaRequest { SucursalId = sucursalId, Numero = "3" });
        var sesion = service.AbrirSesion(mesa.Id, usuarioId);
        service.AgregarItem(sesion.Id, new AgregarItemComandaRequest { ProductoId = p1.ID_PRODUCTO, Cantidad = 2 });

        sesion = service.ObtenerSesion(sesion.Id);
        var total = sesion.Total;

        var resultado = await service.CobrarCuenta(sesion.Id, new CobrarCuentaRequest
        {
            Pagos = new List<PagoVentaDto> { new() { MedioPagoId = 1, Monto = total } }
        }, usuarioId);

        Assert.Equal(total, resultado.Total);
        Assert.Equal("Completada", resultado.Estado);

        // La venta quedó vinculada a la sesión.
        var venta = context.Venta.Single();
        Assert.Equal(sesion.Id, venta.ID_SESION_MESA);

        // No se descontó stock (mesas no manejan stock).
        Assert.Equal(stockAntes, context.StockSucursal.Single().STOCK);

        var sesionFinal = service.ObtenerSesion(sesion.Id);
        Assert.Equal("Cobrada", sesionFinal.Estado);
        Assert.Equal(venta.ID_VENTA, sesionFinal.IdVenta);
    }

    [Fact]
    public async Task CobrarCuentaPendiente_MantieneSesionAbierta_YAlConfirmarLaCierra_SinTocarStock()
    {
        var context = CrearContexto(nameof(CobrarCuentaPendiente_MantieneSesionAbierta_YAlConfirmarLaCierra_SinTocarStock));
        var service = CrearServicio(context);
        var ventas = CrearVentaService(context);
        SeedBasico(context);
        var sucursalId = context.Sucursal.Single().ID_SUCURSAL;
        var usuarioId = context.Usuario.Single().ID_USUARIO;
        var p1 = context.Producto.OrderBy(p => p.ID_PRODUCTO).First();
        var stockAntes = context.StockSucursal.Single().STOCK;

        var mesa = service.CrearMesa(new UpsertMesaRequest { SucursalId = sucursalId, Numero = "4" });
        var sesion = service.AbrirSesion(mesa.Id, usuarioId);
        service.AgregarItem(sesion.Id, new AgregarItemComandaRequest { ProductoId = p1.ID_PRODUCTO, Cantidad = 2 });

        var resultado = await service.CobrarCuenta(sesion.Id, new CobrarCuentaRequest
        {
            EsperarTransferencia = true,
            PendienteMedioId = 4
        }, usuarioId);

        Assert.Equal("PendientePago", resultado.Estado);
        // La mesa sigue abierta mientras el pago no se confirma.
        Assert.Equal("Abierta", service.ObtenerSesion(sesion.Id).Estado);
        Assert.Equal(stockAntes, context.StockSucursal.Single().STOCK);

        // Se confirma la transferencia: la sesión se cierra y el stock sigue intacto.
        ventas.ConfirmarTransferencia(resultado.VentaId);

        var sesionFinal = service.ObtenerSesion(sesion.Id);
        Assert.Equal("Cobrada", sesionFinal.Estado);
        Assert.Equal(resultado.VentaId, sesionFinal.IdVenta);
        Assert.Equal(stockAntes, context.StockSucursal.Single().STOCK);
    }

    [Fact]
    public async Task CancelarVentaPendienteDeMesa_NoReponeStock_YDejaSesionAbierta()
    {
        var context = CrearContexto(nameof(CancelarVentaPendienteDeMesa_NoReponeStock_YDejaSesionAbierta));
        var service = CrearServicio(context);
        var ventas = CrearVentaService(context);
        SeedBasico(context);
        var sucursalId = context.Sucursal.Single().ID_SUCURSAL;
        var usuarioId = context.Usuario.Single().ID_USUARIO;
        var p1 = context.Producto.OrderBy(p => p.ID_PRODUCTO).First();
        var stockAntes = context.StockSucursal.Single().STOCK;

        var mesa = service.CrearMesa(new UpsertMesaRequest { SucursalId = sucursalId, Numero = "5" });
        var sesion = service.AbrirSesion(mesa.Id, usuarioId);
        service.AgregarItem(sesion.Id, new AgregarItemComandaRequest { ProductoId = p1.ID_PRODUCTO, Cantidad = 3 });

        var resultado = await service.CobrarCuenta(sesion.Id, new CobrarCuentaRequest
        {
            EsperarTransferencia = true,
            PendienteMedioId = 4
        }, usuarioId);

        ventas.CancelarVentaPendiente(resultado.VentaId, false);

        Assert.Equal("Anulada", ventas.ObtenerEstadoVenta(resultado.VentaId));
        // No se repuso stock porque nunca se descontó.
        Assert.Equal(stockAntes, context.StockSucursal.Single().STOCK);
        // La sesión queda abierta para reintentar el cobro.
        Assert.Equal("Abierta", service.ObtenerSesion(sesion.Id).Estado);
    }

    [Fact]
    public void AgregarItem_ConNotasPorUnidad_CreaUnidadesIndividuales()
    {
        var context = CrearContexto(nameof(AgregarItem_ConNotasPorUnidad_CreaUnidadesIndividuales));
        var service = CrearServicio(context);
        SeedBasico(context);
        var sucursalId = context.Sucursal.Single().ID_SUCURSAL;
        var usuarioId = context.Usuario.Single().ID_USUARIO;
        var p1 = context.Producto.OrderBy(p => p.ID_PRODUCTO).First();

        var mesa = service.CrearMesa(new UpsertMesaRequest { SucursalId = sucursalId, Numero = "6" });
        var sesion = service.AbrirSesion(mesa.Id, usuarioId);

        service.AgregarItem(sesion.Id, new AgregarItemComandaRequest
        {
            ProductoId = p1.ID_PRODUCTO,
            Cantidad = 2,
            Notas = new List<string?> { "sin cebolla", "con queso" }
        });

        var items = service.ObtenerSesion(sesion.Id).Items;
        Assert.Equal(2, items.Count);
        Assert.All(items, i => Assert.Equal(1m, i.Cantidad));
        Assert.Equal("sin cebolla", items[0].Nota);
        Assert.Equal("con queso", items[1].Nota);
    }

    [Fact]
    public void ActualizarItem_EditaCantidadYNota()
    {
        var context = CrearContexto(nameof(ActualizarItem_EditaCantidadYNota));
        var service = CrearServicio(context);
        SeedBasico(context);
        var sucursalId = context.Sucursal.Single().ID_SUCURSAL;
        var usuarioId = context.Usuario.Single().ID_USUARIO;
        var p1 = context.Producto.OrderBy(p => p.ID_PRODUCTO).First();

        var mesa = service.CrearMesa(new UpsertMesaRequest { SucursalId = sucursalId, Numero = "7" });
        var sesion = service.AbrirSesion(mesa.Id, usuarioId);

        var item = service.AgregarItem(sesion.Id, new AgregarItemComandaRequest { ProductoId = p1.ID_PRODUCTO, Cantidad = 1 }).Single();

        var actualizado = service.ActualizarItem(item.Id, new ActualizarItemComandaRequest { Cantidad = 3, Nota = "sin cebolla" });

        Assert.Equal(3m, actualizado.Cantidad);
        Assert.Equal("sin cebolla", actualizado.Nota);

        var sesionActualizada = service.ObtenerSesion(sesion.Id);
        Assert.Equal(p1.PRECIO * 3, sesionActualizada.Total);
    }
}