using System.Security.Claims;
using Microsoft.AspNetCore.Http;
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
    private static PosDbContext CrearContexto()
    {
        DbContextOptions<PosDbContext> options =
            new DbContextOptionsBuilder<PosDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

        return new PosDbContext(options);
    }

    private static SucursalService CrearService(PosDbContext context)
    {
        return new SucursalService(context);
    }

    private static SucursalService CrearService(PosDbContext context, int userId)
    {
        var accessor = new HttpContextAccessor
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(
                    new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, userId.ToString())
                    },
                    "TestAuth"))
            }
        };

        return new SucursalService(context, accessor);
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

    [Fact]
    public void ObtenerActivas_SoloDevuelveSucursalesActivas()
    {
        using PosDbContext context = CrearContexto();
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
        using PosDbContext context = CrearContexto();
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
        Assert.Equal(1, creada.Numero);
    }

    [Fact]
    public void CrearSucursal_ConPlanBasico_LimitaCantidad()
    {
        using PosDbContext context = CrearContexto();
        Usuario admin = new Usuario("admin", BCrypt.Net.BCrypt.HashPassword("123456"), Roles.Admin, "admin@test.com");
        TestHelpers.SetId(admin, 1, "ID_USUARIO");
        context.Usuarios.Add(admin);
        context.SaveChanges();
        context.Suscripciones.Add(Suscripcion.CrearBasica(admin.ID_USUARIO));
        context.SaveChanges();

        SucursalService service = CrearService(context, 1);

        service.Crear(new SucursalDto { Numero = 1, Codigo = "SUC1", Nombre = "Sucursal 1" });

        Assert.Throws<SuscripcionSinCupoException>(() =>
        {
            service.Crear(new SucursalDto { Numero = 2, Codigo = "SUC2", Nombre = "Sucursal 2" });
        });
    }

    [Fact]
    public void CrearSucursal_NumeroDuplicado_LanzaExcepcion()
    {
        using PosDbContext context = CrearContexto();
        SucursalService service = CrearService(context);

        AgregarSucursal(context, 1, 1);

        SucursalDto dto = new SucursalDto
        {
            Numero = 1,
            Codigo = "OTRA",
            Nombre = "Otra"
        };

        Assert.Throws<SucursalNumeroDuplicadoException>(() =>
        {
            service.Crear(dto);
        });
    }

    [Fact]
    public void ObtenerPorId_ExistenteYActiva_DevuelveSucursal()
    {
        using PosDbContext context = CrearContexto();
        SucursalService service = CrearService(context);

        AgregarSucursal(context, 1, 1);

        SucursalDto dto = service.ObtenerPorId(1);

        Assert.Equal(1, dto.Id);
        Assert.True(dto.Activo);
    }

    [Fact]
    public void ObtenerPorId_NoExiste_LanzaExcepcion()
    {
        using PosDbContext context = CrearContexto();
        SucursalService service = CrearService(context);

        Assert.Throws<SucursalNoExisteException>(() =>
        {
            service.ObtenerPorId(99);
        });
    }

    [Fact]
    public void EliminarSucursal_DesactivaSucursal()
    {
        using PosDbContext context = CrearContexto();
        SucursalService service = CrearService(context);

        AgregarSucursal(context, 1, 1);

        service.Eliminar(1);

        Sucursal sucursal = context.Sucursales.First();

        Assert.False(sucursal.ACTIVO);
    }

    [Fact]
    public void EliminarSucursal_NoExiste_LanzaExcepcion()
    {
        using PosDbContext context = CrearContexto();
        SucursalService service = CrearService(context);

        Assert.Throws<SucursalNoExisteException>(() =>
        {
            service.Eliminar(10);
        });
    }
}
