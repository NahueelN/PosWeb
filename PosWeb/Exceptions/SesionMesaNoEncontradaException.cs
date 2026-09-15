namespace PosWeb.Application.Exceptions;

public class SesionMesaNoEncontradaException : Exception
{
    public SesionMesaNoEncontradaException(int sesionId)
        : base($"Sesión de mesa {sesionId} no encontrada")
    {
    }
}