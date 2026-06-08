namespace PosWeb.Application.Exceptions;

public class ProveedorCodigoDuplicadoException : ServiceException
{
    public string Codigo { get; }

    public ProveedorCodigoDuplicadoException(string codigo)
        : base($"Ya existe un proveedor activo con el código '{codigo}'")
    {
        Codigo = codigo;
    }
}
