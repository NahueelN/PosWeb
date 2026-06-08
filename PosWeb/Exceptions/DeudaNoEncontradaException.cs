namespace PosWeb.Application.Exceptions;

public class DeudaNoEncontradaException : ServiceException
{
    public int DeudaId { get; }

    public DeudaNoEncontradaException(int id)
        : base($"Deuda con ID {id} no encontrada")
    {
        DeudaId = id;
    }
}
