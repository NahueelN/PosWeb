namespace PosWeb.Application.Exceptions;

public class ProductoCodigoDuplicadoException : ServiceException
{
    public string CodigoBarra { get; }

    public ProductoCodigoDuplicadoException(string codigoBarra)
        : base($"Ya existe un producto activo con el código de barras '{codigoBarra}'")
    {
        CodigoBarra = codigoBarra;
    }
}
