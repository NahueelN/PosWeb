using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Application.Gastos;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Testing;

namespace PosWeb.Application.Test.Gastos;

public class GastoServiceTest
{
    private static PosDbContext CrearContexto(string dbName)
    {
        DbContextOptions<PosDbContext> options =
            new DbContextOptionsBuilder<PosDbContext>()
                .UseInMemoryDatabase(dbName)
                .Options;

        var context = new PosDbContext(options);

        // Seed basic data
        Sucursal sucursal = new Sucursal("001", "Sucursal Test", 1);
        sucursal.Activar();
        context.Sucursales.Add(sucursal);

        Usuario usuario = new Usuario(1, "testuser", "hashed", "UsuarioComun");
        usuario.Activar();
        context.Usuarios.Add(usuario);

        context.SaveChanges();
        return context;
    }

    private static GastoService CrearService(PosDbContext context)
    {
        return new GastoService(context);
    }

    private static Caja CrearCajaAbierta(PosDbContext context, int usuarioId)
    {
        var caja = new Caja(1, 1000, usuarioId);
        context.Cajas.Add(caja);
        context.SaveChanges();
        return caja;
    }

    [Fact]
    public void Crear_ConMontoYDetalleValidos_CreaGastoVinculadoACajaActiva()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(Crear_ConMontoYDetalleValidos_CreaGastoVinculadoACajaActiva));
        GastoService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Caja caja = CrearCajaAbierta(context, usuario.ID_USUARIO);

        // Act
        GastoDto resultado = service.Crear(150.50m, "Flete", usuario.ID_USUARIO);

        // Assert
        Assert.NotNull(resultado);
        Assert.Equal(caja.ID_CAJA, resultado.CajaId);
        Assert.Equal(150.50m, resultado.Monto);
        Assert.Equal("Flete", resultado.Detalle);
        Assert.NotEqual(default, resultado.Fecha);

        // Verify persisted in DB
        Gasto gastoDb = context.Gastos.First();
        Assert.Equal(caja.ID_CAJA, gastoDb.ID_CAJA);
        Assert.Equal(150.50m, gastoDb.MONTO);
        Assert.Equal("Flete", gastoDb.DETALLE);
    }

    [Fact]
    public void Crear_MontoCeroOLanzar_LanzaArgumentException()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(Crear_MontoCeroOLanzar_LanzaArgumentException));
        GastoService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        CrearCajaAbierta(context, usuario.ID_USUARIO);

        // Act & Assert — monto cero
        var ex = Assert.Throws<ArgumentException>(() =>
            service.Crear(0, "Detalle", usuario.ID_USUARIO));
        Assert.Contains("positivo", ex.Message.ToLower());

        // Act & Assert — monto negativo
        ex = Assert.Throws<ArgumentException>(() =>
            service.Crear(-10, "Detalle", usuario.ID_USUARIO));
        Assert.Contains("positivo", ex.Message.ToLower());
    }

    [Fact]
    public void Crear_DetalleVacio_LanzaArgumentException()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(Crear_DetalleVacio_LanzaArgumentException));
        GastoService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        CrearCajaAbierta(context, usuario.ID_USUARIO);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            service.Crear(100, "", usuario.ID_USUARIO));
        Assert.Contains("detalle", ex.Message.ToLower());
    }

    [Fact]
    public void Crear_DetalleSoloEspacios_LanzaArgumentException()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(Crear_DetalleSoloEspacios_LanzaArgumentException));
        GastoService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        CrearCajaAbierta(context, usuario.ID_USUARIO);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            service.Crear(100, "   ", usuario.ID_USUARIO));
        Assert.Contains("detalle", ex.Message.ToLower());
    }

    [Fact]
    public void Crear_DetalleExcede500Caracteres_LanzaArgumentException()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(Crear_DetalleExcede500Caracteres_LanzaArgumentException));
        GastoService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        CrearCajaAbierta(context, usuario.ID_USUARIO);

        string detalleLargo = new string('X', 501);

        // Act & Assert
        var ex = Assert.Throws<ArgumentException>(() =>
            service.Crear(100, detalleLargo, usuario.ID_USUARIO));
        Assert.Contains("500", ex.Message);
    }

    [Fact]
    public void Crear_SinCajaActiva_LanzaGastoSinCajaActivaException()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(Crear_SinCajaActiva_LanzaGastoSinCajaActivaException));
        GastoService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        // No caja created

        // Act & Assert
        Assert.Throws<GastoSinCajaActivaException>(() =>
            service.Crear(100, "Detalle", usuario.ID_USUARIO));
    }

    [Fact]
    public void ObtenerPorCaja_ConGastos_RetornaFiltradosYOrdenadosDesc()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(ObtenerPorCaja_ConGastos_RetornaFiltradosYOrdenadosDesc));
        GastoService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Caja caja = CrearCajaAbierta(context, usuario.ID_USUARIO);

        // Create second caja to test filtering
        var caja2 = new Caja(1, 2000, usuario.ID_USUARIO);
        TestHelpers.SetId(caja2, 2, "ID_CAJA");
        context.Cajas.Add(caja2);
        context.SaveChanges();

        // Create gastos with controlled timestamps via direct reflection
        Gasto gasto1 = new Gasto(caja.ID_CAJA, 100, "Primero");
        TestHelpers.SetId(gasto1, 1, "ID_GASTO");
        context.Gastos.Add(gasto1);

        Gasto gasto2 = new Gasto(caja.ID_CAJA, 200, "Segundo");
        TestHelpers.SetId(gasto2, 2, "ID_GASTO");
        context.Gastos.Add(gasto2);

        // Gasto for caja2 (should be filtered out)
        Gasto gasto3 = new Gasto(caja2.ID_CAJA, 300, "Otra caja");
        TestHelpers.SetId(gasto3, 3, "ID_GASTO");
        context.Gastos.Add(gasto3);

        context.SaveChanges();

        // Act
        List<GastoDto> resultados = service.ObtenerPorCaja(caja.ID_CAJA);

        // Assert
        Assert.Equal(2, resultados.Count);
        Assert.DoesNotContain(resultados, g => g.Id == 3);
        Assert.All(resultados, g => Assert.Equal(caja.ID_CAJA, g.CajaId));

        // Verify ordering: most recent first (Fecha was set via DateTime.Now, so the order should be desc)
        Assert.True(resultados[0].Fecha >= resultados[1].Fecha);
    }

    [Fact]
    public void ObtenerPorCaja_SinGastos_RetornaListaVacia()
    {
        // Arrange
        PosDbContext context = CrearContexto(nameof(ObtenerPorCaja_SinGastos_RetornaListaVacia));
        GastoService service = CrearService(context);

        Usuario usuario = context.Usuarios.First();
        Caja caja = CrearCajaAbierta(context, usuario.ID_USUARIO);

        // Act
        List<GastoDto> resultados = service.ObtenerPorCaja(caja.ID_CAJA);

        // Assert
        Assert.Empty(resultados);
    }
}
