namespace PosWeb.Domain.Exceptions;

public class CodigoSucursalInvalidoException : DomainException
{
    public string? Codigo { get; }

    public CodigoSucursalInvalidoException(string? codigo)
        : base("El código de la sucursal es inválido")
    {
        Codigo = codigo;
    }
}
