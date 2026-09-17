namespace PosWeb.Application.Exceptions;

public class MesaDuplicadaException : ServiceException
{
    public MesaDuplicadaException(string numero)
        : base($"Ese número de mesa ya existe: {numero}")
    {
    }
}