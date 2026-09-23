namespace PosWeb.Application.Exceptions;

public class LimiteProductosException : ServiceException
{
    public LimiteProductosException(int maximo, string nivel)
        : base($"El plan {nivel} permite hasta {maximo} productos activos")
    {
    }
}