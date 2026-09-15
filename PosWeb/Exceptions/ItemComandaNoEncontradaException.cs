namespace PosWeb.Application.Exceptions;

public class ItemComandaNoEncontradaException : Exception
{
    public ItemComandaNoEncontradaException(int itemId)
        : base($"Item de comanda {itemId} no encontrado")
    {
    }
}