namespace PosWeb.Application.Exceptions;

public class SucursalNumeroDuplicadoException : ServiceException
{
    public int Numero { get; }

    public SucursalNumeroDuplicadoException(int numero)
        : base($"Ya existe una sucursal con el número {numero}")
    {
        Numero = numero;
    }
}
