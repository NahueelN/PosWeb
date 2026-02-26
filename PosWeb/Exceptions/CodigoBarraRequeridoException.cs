namespace PosWeb.Application.Exceptions;

public class CodigoBarraRequeridoException : ServiceException
{
    public CodigoBarraRequeridoException()
        : base("El código de barras es obligatorio")
    {
    }
}
