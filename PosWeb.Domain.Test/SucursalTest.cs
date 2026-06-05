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
            "CENTRO",
            "Sucursal Centro",
            1
        );

        Assert.True(sucursal.ACTIVO);
    }

    [Fact]
    public void DesactivarSucursal_QuedaInactiva()
    {
        Sucursal sucursal = new Sucursal(
            "CENTRO",
            "Sucursal Centro",
            1
        );

        sucursal.Desactivar();

        Assert.False(sucursal.ACTIVO);
    }

    [Fact]
    public void CrearSucursal_CodigoVacio_LanzaExcepcion()
    {
        Assert.Throws<CodigoSucursalInvalidoException>(() =>
        {
            new Sucursal(
                "",
                "Sucursal Centro",
                1
            );
        });
    }

    [Fact]
    public void CrearSucursal_DescripcionVacia_LanzaExcepcion()
    {
        Assert.Throws<NombreSucursalInvalidoException>(() =>
        {
            new Sucursal(
                "CENTRO",
                "",
                1
            );
        });
    }

    [Fact]
    public void CambiarCodigo_CodigoVacio_LanzaExcepcion()
    {
        Sucursal sucursal = new Sucursal(
            "CENTRO",
            "Sucursal Centro",
            1
        );

        Assert.Throws<CodigoSucursalInvalidoException>(() =>
        {
            sucursal.CambiarCodigo("");
        });
    }

    [Fact]
    public void CambiarDescripcion_DescripcionVacia_LanzaExcepcion()
    {
        Sucursal sucursal = new Sucursal(
            "CENTRO",
            "Sucursal Centro",
            1
        );

        Assert.Throws<NombreSucursalInvalidoException>(() =>
        {
            sucursal.CambiarDescripcion("");
        });
    }
}
