using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Cajas;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Testing;

namespace PosWeb.Application.Test.Cajas;

public class CajaServiceTest
{
    private static PosDbContextLocal CrearContexto(string dbName)
    {
        DbContextOptions<PosDbContextLocal> options =
            new DbContextOptionsBuilder<PosDbContextLocal>()
                .UseInMemoryDatabase(dbName)
                .Options;

        var context = new PosDbContextLocal(options);

        Sucursal sucursal = new Sucursal("001", "Sucursal Test", 1);
        sucursal.Activar();
        context.Sucursal.Add(sucursal);

        Usuario usuario = new Usuario(1, "testuser", "hashed", "UsuarioComun");
        usuario.Activar();
        context.Usuario.Add(usuario);

        context.SaveChanges();
        return context;
    }

    private static Caja CrearCaja(PosDbContextLocal context, int usuarioId, decimal montoInicial = 1000)
    {
        var caja = new Caja(1, montoInicial, usuarioId);
        context.Caja.Add(caja);
        context.SaveChanges();
        return caja;
    }

    private static Venta CrearVentaEnCaja(PosDbContextLocal context, Caja caja, int usuarioId, decimal monto)
    {
        var venta = new Venta(caja.ID_SUCURSAL, usuarioId);
        venta.AgregarRenglonManual("Producto de prueba", 1, monto);
        context.Venta.Add(venta);
        context.SaveChanges();

        var pago = new Pago(venta.ID_VENTA, 1, monto, usuarioId, caja.ID_CAJA);
        context.Pago.Add(pago);
        context.SaveChanges();

        return venta;
    }

    [Fact]
    public void ObtenerMovimientos_IncluyeVentasYGastosDeLaCaja()
    {
        // Arrange
        PosDbContextLocal context = CrearContexto(nameof(ObtenerMovimientos_IncluyeVentasYGastosDeLaCaja));
        var service = new CajaService(context);
        Usuario usuario = context.Usuario.First();
        Caja caja = CrearCaja(context, usuario.ID_USUARIO);

        Venta venta = CrearVentaEnCaja(context, caja, usuario.ID_USUARIO, 500);

        var gasto = new Gasto(caja.ID_CAJA, 120, "Flete", usuario.ID_USUARIO);
        context.Gasto.Add(gasto);
        context.SaveChanges();

        // Venta de otra caja — no debe aparecer
        var otraCaja = new Caja(1, 0, usuario.ID_USUARIO);
        TestHelpers.SetId(otraCaja, 99, "ID_CAJA");
        context.Caja.Add(otraCaja);
        context.SaveChanges();
        CrearVentaEnCaja(context, otraCaja, usuario.ID_USUARIO, 999);

        // Act
        List<MovimientoCajaDto> movimientos = service.ObtenerMovimientos(caja.ID_CAJA);

        // Assert
        Assert.Equal(2, movimientos.Count);
        Assert.Contains(movimientos, m => m.Tipo == "Venta" && m.ReferenciaId == venta.ID_VENTA && m.Monto == 500m && !m.Anulado);
        Assert.Contains(movimientos, m => m.Tipo == "Gasto" && m.Descripcion == "Flete" && m.Monto == 120m);
        Assert.DoesNotContain(movimientos, m => m.Monto == 999m);
    }

    [Fact]
    public void ObtenerMovimientos_MarcaAnulados()
    {
        // Arrange
        PosDbContextLocal context = CrearContexto(nameof(ObtenerMovimientos_MarcaAnulados));
        var service = new CajaService(context);
        Usuario usuario = context.Usuario.First();
        Caja caja = CrearCaja(context, usuario.ID_USUARIO);

        Venta venta = CrearVentaEnCaja(context, caja, usuario.ID_USUARIO, 300);
        venta.Anular();

        var gasto = new Gasto(caja.ID_CAJA, 50, "Gasto anulado", usuario.ID_USUARIO);
        gasto.Anular();
        context.Gasto.Add(gasto);
        context.SaveChanges();

        // Act
        List<MovimientoCajaDto> movimientos = service.ObtenerMovimientos(caja.ID_CAJA);

        // Assert
        Assert.Equal(2, movimientos.Count);
        Assert.All(movimientos, m => Assert.True(m.Anulado));
    }

    [Fact]
    public void ObtenerMovimientos_CajaSinMovimientos_RetornaVacio()
    {
        PosDbContextLocal context = CrearContexto(nameof(ObtenerMovimientos_CajaSinMovimientos_RetornaVacio));
        var service = new CajaService(context);
        Usuario usuario = context.Usuario.First();
        Caja caja = CrearCaja(context, usuario.ID_USUARIO);

        Assert.Empty(service.ObtenerMovimientos(caja.ID_CAJA));
    }
}
