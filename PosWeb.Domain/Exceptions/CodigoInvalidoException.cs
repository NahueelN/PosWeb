namespace PosWeb.Domain.Exceptions;

public class CodigoInvalidoException : DomainException
{
    public CodigoInvalidoException(string entityName, string? codigo)
        : base($"El código '{codigo ?? "(nulo)"}' no es válido para {entityName}")
    {
    }
}
