namespace PosWeb.Application.Exceptions;

public class ProveedorNoEncontradoException : ServiceException
{
    public int ProveedorId { get; }

    public ProveedorNoEncontradoException(int proveedorId)
        : base($"No se encontró un proveedor con ID {proveedorId}")
    {
        ProveedorId = proveedorId;
    }
}
