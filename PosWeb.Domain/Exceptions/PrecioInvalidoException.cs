namespace PosWeb.Domain.Exceptions;

public class PrecioInvalidoException : DomainException
{
    public decimal Precio { get; }

    public PrecioInvalidoException(decimal precio)
        : base($"El precio '{precio}' es inválido")
    {
        Precio = precio;
    }
}
