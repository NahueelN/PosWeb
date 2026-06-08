namespace PosWeb.Domain.Exceptions;

public class CodigoProductoDuplicadoException : DomainException
{
    public CodigoProductoDuplicadoException(string codigoProducto)
        : base($"El código interno '{codigoProducto}' ya está en uso")
    {
    }
}
