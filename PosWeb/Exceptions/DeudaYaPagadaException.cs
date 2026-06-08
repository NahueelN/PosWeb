namespace PosWeb.Application.Exceptions;

public class DeudaYaPagadaException : ServiceException
{
    public int DeudaId { get; }

    public DeudaYaPagadaException(int id)
        : base($"La deuda con ID {id} ya fue pagada")
    {
        DeudaId = id;
    }
}
