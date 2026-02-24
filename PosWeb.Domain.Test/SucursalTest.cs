using PosWeb.Domain;
using PosWeb.Domain.Exceptions;
using Xunit;

namespace PosWeb.Domain.Test;

public class SucursalTest
{
    [Fact]
    public void CrearSucursal_QuedaActiva()
    {
        Sucursal sucursal = new Sucursal(
            1,
            "CENTRO",
            "Sucursal Centro"
        );

        Assert.True(sucursal.ACTIVO);
    }

    [Fact]
    public void DesactivarSucursal_QuedaInactiva()
    {
        Sucursal sucursal = new Sucursal(
            1,
            "CENTRO",
            "Sucursal Centro"
        );

        sucursal.Desactivar();

        Assert.False(sucursal.ACTIVO);
    }

    [Fact]
    public void CrearSucursal_NumeroInvalido_LanzaExcepcion()
    {
        Assert.Throws<NumeroSucursalInvalidoException>(() =>
        {
            new Sucursal(
                0,
                "CENTRO",
                "Sucursal Centro"
            );
        });
    }

    [Fact]
    public void CrearSucursal_CodigoVacio_LanzaExcepcion()
    {
        Assert.Throws<CodigoSucursalInvalidoException>(() =>
        {
            new Sucursal(
                1,
                "",
                "Sucursal Centro"
            );
        });
    }

    [Fact]
    public void CrearSucursal_NombreVacio_LanzaExcepcion()
    {
        Assert.Throws<NombreSucursalInvalidoException>(() =>
        {
            new Sucursal(
                1,
                "CENTRO",
                ""
            );
        });
    }

    [Fact]
    public void CambiarNumero_NumeroInvalido_LanzaExcepcion()
    {
        Sucursal sucursal = new Sucursal(
            1,
            "CENTRO",
            "Sucursal Centro"
        );

        Assert.Throws<NumeroSucursalInvalidoException>(() =>
        {
            sucursal.CambiarNumero(0);
        });
    }

    [Fact]
    public void CambiarCodigo_CodigoVacio_LanzaExcepcion()
    {
        Sucursal sucursal = new Sucursal(
            1,
            "CENTRO",
            "Sucursal Centro"
        );

        Assert.Throws<CodigoSucursalInvalidoException>(() =>
        {
            sucursal.CambiarCodigo("");
        });
    }

    [Fact]
    public void CambiarNombre_NombreVacio_LanzaExcepcion()
    {
        Sucursal sucursal = new Sucursal(
            1,
            "CENTRO",
            "Sucursal Centro"
        );

        Assert.Throws<NombreSucursalInvalidoException>(() =>
        {
            sucursal.CambiarNombre("");
        });
    }
}