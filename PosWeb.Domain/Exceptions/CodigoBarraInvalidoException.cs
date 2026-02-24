namespace PosWeb.Domain.Exceptions;

public class CodigoBarraInvalidoException : DomainException
{
    public string? CodigoBarra { get; }

    public CodigoBarraInvalidoException(string? codigoBarra)
        : base("El código de barras es inválido")
    {
        CodigoBarra = codigoBarra;
    }
}
