namespace PosWeb.Application.Exceptions;

public class MesaOcupadaException : ServiceException
{
    public MesaOcupadaException()
        : base("La mesa tiene una sesión abierta y no se puede modificar/eliminar")
    {
    }
}