namespace PosWeb.Domain.Exceptions;

public class IvaCondicionInvalidaException : DomainException
{
    public IvaCondicionInvalidaException(string ivaCondicion)
        : base($"Condición IVA inválida: {ivaCondicion}. Debe ser ResponsableInscripto, Monotributo, Exento o ConsumidorFinal")
    {
    }
}
