namespace PosWeb.Application.Exceptions;

public class MesaNoEncontradaException : Exception
{
    public MesaNoEncontradaException(int mesaId)
        : base($"Mesa {mesaId} no encontrada")
    {
    }
}