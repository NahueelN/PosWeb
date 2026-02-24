namespace PosWeb.Domain.Exceptions;

public class CantidadInvalidaException : DomainException
{
    public int Cantidad { get; }

    public CantidadInvalidaException(int cantidad)
        : base($"La cantidad '{cantidad}' es inválida")
    {
        Cantidad = cantidad;
    }
}
