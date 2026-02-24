namespace PosWeb.Domain.Exceptions;

public class CostoInvalidoException : DomainException
{
    public decimal Costo { get; }

    public CostoInvalidoException(decimal costo)
        : base($"El costo '{costo}' es inválido")
    {
        Costo = costo;
    }
}
