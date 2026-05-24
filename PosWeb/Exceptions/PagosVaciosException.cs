namespace PosWeb.Application.Exceptions;

public class PagosVaciosException : ServiceException
{
    public PagosVaciosException()
        : base("Debe indicar al menos un medio de pago")
    {
    }
}
