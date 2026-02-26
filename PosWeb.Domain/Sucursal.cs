using PosWeb.Domain.Exceptions;
using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Sucursal
{
    [Key]
    public int ID_SUCURSAL { get; private set; }

    public int NUMERO { get; private set; }

    public string CODIGO { get; private set; } = null!;

    public string NOMBRE { get; private set; } = null!;

    public bool ACTIVO { get; private set; }

    public Sucursal(int numero, string codigo, string nombre)
    {
        CambiarNumero(numero);
        CambiarCodigo(codigo);
        CambiarNombre(nombre);

        ACTIVO = true;
    }

    protected Sucursal()
    {
    }

    public void CambiarNumero(int numero)
    {
        if (numero <= 0)
        {
            throw new NumeroSucursalInvalidoException(numero);
        }

        NUMERO = numero;
    }

    public void CambiarCodigo(string codigo)
    {
        if (string.IsNullOrWhiteSpace(codigo))
        {
            throw new CodigoSucursalInvalidoException(codigo);
        }

        CODIGO = codigo;
    }

    public void CambiarNombre(string nombre)
    {
        if (string.IsNullOrWhiteSpace(nombre))
        {
            throw new NombreSucursalInvalidoException(nombre);
        }

        NOMBRE = nombre;
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