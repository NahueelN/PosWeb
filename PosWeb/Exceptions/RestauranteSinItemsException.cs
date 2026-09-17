namespace PosWeb.Application.Exceptions;

public class RestauranteSinItemsException : ServiceException
{
    public RestauranteSinItemsException()
        : base("La cuenta de la mesa no tiene items para cobrar")
    {
    }
}