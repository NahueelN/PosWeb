namespace PosWeb.Application.Exceptions;

public class VentaNoEncontradaException : Exception
{
    public VentaNoEncontradaException(int ventaId)
        : base($"Venta {ventaId} no encontrada")
    {
    }
}
