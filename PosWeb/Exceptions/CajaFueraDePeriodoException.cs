namespace PosWeb.Application.Exceptions;

public class CajaFueraDePeriodoException : ServiceException
{
    public CajaFueraDePeriodoException()
        : base($"La caja está fuera del horario configurado. Cerrá la caja actual y abrí una dentro de un período habilitado para poder operar.")
    {
    }
}