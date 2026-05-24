namespace PosWeb.Application.Exceptions;

public class PagoSumaInvalidaException : ServiceException
{
    public PagoSumaInvalidaException(decimal sumaPagos, decimal totalVenta)
        : base($"Suma de pagos ({sumaPagos:C}) no coincide con el total de la venta ({totalVenta:C})")
    {
    }
}
