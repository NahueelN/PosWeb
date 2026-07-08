using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Application.Sucursales;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Testing;

namespace PosWeb.Application.Test;

public class SucursalServiceTest
{
    private static PosDbContextLocal CrearContexto()
    {
        DbContextOptions<PosDbContextLocal> options =
            new DbContextOptionsBuilder<PosDbContextLocal>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

        return new PosDbContextLocal(options);
    }

    private static SucursalService CrearService(PosDbContextLocal context)
    {
        return new SucursalService(context);
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

    [Fact]
    public void ObtenerActivas_SoloDevuelveSucursalesActivas()
    {
        using PosDbContextLocal context = CrearContexto();
        SucursalService service = CrearService(context);

        AgregarSucursal(context, 1, 1, true);
        AgregarSucursal(context, 2, 2, false);
        AgregarSucursal(context, 3, 3, true);

        List<SucursalDto> resultado = service.ObtenerActivas();

        Assert.Equal(2, resultado.Count);
        Assert.All(resultado, s => Assert.True(s.Activo));
    }

    [Fact]
    public void CrearSucursal_CreaCorrectamente()
    {
        using PosDbContextLocal context = CrearContexto();
        SucursalService service = CrearService(context);

        SucursalDto dto = new SucursalDto
        {
            Numero = 1,
            Codigo = "CENTRO",
            Nombre = "Sucursal Centro"
        };

        SucursalDto creada = service.Crear(dto);

        Assert.NotEqual(0, creada.Id);
        Assert.True(creada.Activo);
        Assert.Equal("CENTRO", creada.Codigo);
    }

    [Fact]
    public void ObtenerPorId_ExistenteYActiva_DevuelveSucursal()
    {
        using PosDbContextLocal context = CrearContexto();
        SucursalService service = CrearService(context);

        AgregarSucursal(context, 1, 1);

        SucursalDto dto = service.ObtenerPorId(1);

        Assert.Equal(1, dto.Id);
        Assert.True(dto.Activo);
    }

    [Fact]
    public void ObtenerPorId_NoExiste_LanzaExcepcion()
    {
        using PosDbContextLocal context = CrearContexto();
        SucursalService service = CrearService(context);

        Assert.Throws<SucursalNoExisteException>(() =>
        {
            service.ObtenerPorId(99);
        });
    }

    [Fact]
    public void EliminarSucursal_DesactivaSucursal()
    {
        using PosDbContextLocal context = CrearContexto();
        SucursalService service = CrearService(context);

        AgregarSucursal(context, 1, 1);

        service.Eliminar(1);

        Sucursal sucursal = context.Sucursal.First();

        Assert.False(sucursal.ACTIVO);
    }

    [Fact]
    public void EliminarSucursal_NoExiste_LanzaExcepcion()
    {
        using PosDbContextLocal context = CrearContexto();
        SucursalService service = CrearService(context);

        Assert.Throws<SucursalNoExisteException>(() =>
        {
            service.Eliminar(10);
        });
    }
}
