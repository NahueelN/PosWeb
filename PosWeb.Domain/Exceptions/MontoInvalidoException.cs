namespace PosWeb.Domain.Exceptions;

public class MontoInvalidoException : DomainException
{
    public MontoInvalidoException(decimal monto, string mensaje = "Monto inválido")
        : base($"{mensaje}: {monto}")
    {
    }
}
