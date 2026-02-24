namespace PosWeb.Domain.Exceptions;

public class NombreInvalidoException : DomainException
{
    public string? Nombre { get; }

    public NombreInvalidoException(string? nombre)
        : base("El nombre es inválido")
    {
        Nombre = nombre;
    }
}
