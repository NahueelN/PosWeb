namespace PosWeb.Domain.Exceptions;

public class CantidadInvalidaException : DomainException
{
    public decimal Cantidad { get; }

    public CantidadInvalidaException(decimal cantidad)
        : base($"La cantidad '{cantidad}' es inválida")
    {
        Cantidad = cantidad;
    }
}
