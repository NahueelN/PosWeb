namespace PosWeb.Application.Exceptions;

public class CajaPeriodoVencidoException : ServiceException
{
    public CajaPeriodoVencidoException()
        : base($"La caja superó su período. Cerrá la caja actual y abrí una nueva para continuar operando.")
    {
    }
}