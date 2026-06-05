using PosWeb.Domain.Exceptions;
using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Sucursal
{
    [Key]
    public int ID_SUCURSAL { get; private set; }

    public string COD_SUCURSAL { get; private set; } = null!;

    public string DESC_SUCURSAL { get; private set; } = null!;

    public int ID_EMPRESA { get; private set; }

    public bool ACTIVO { get; private set; }

    public Sucursal(string codSucursal, string descSucursal, int idEmpresa)
    {
        CambiarCodigo(codSucursal);
        CambiarDescripcion(descSucursal);
        CambiarEmpresa(idEmpresa);
        ACTIVO = true;
    }

    protected Sucursal()
    {
    }

    public void CambiarCodigo(string codigo)
    {
        if (string.IsNullOrWhiteSpace(codigo))
        {
            throw new CodigoSucursalInvalidoException(codigo);
        }

        COD_SUCURSAL = codigo;
    }

    public void CambiarDescripcion(string descripcion)
    {
        if (string.IsNullOrWhiteSpace(descripcion))
        {
            throw new NombreSucursalInvalidoException(descripcion);
        }

        DESC_SUCURSAL = descripcion;
    }

    public void CambiarEmpresa(int idEmpresa)
    {
        if (idEmpresa <= 0)
        {
            throw new ArgumentException("Empresa inválida");
        }

        ID_EMPRESA = idEmpresa;
    }

    public void Activar()
    {
        ACTIVO = true;
    }

    public void Desactivar()
    {
        ACTIVO = false;
    }
}
