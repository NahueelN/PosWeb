namespace PosWeb.Domain.Exceptions;

public class NombreSucursalInvalidoException : DomainException
{
    public string? Nombre { get; }

    public NombreSucursalInvalidoException(string? nombre)
        : base("El nombre de la sucursal es inválido")
    {
        Nombre = nombre;
    }
}
