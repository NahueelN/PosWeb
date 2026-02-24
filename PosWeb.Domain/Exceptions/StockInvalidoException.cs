namespace PosWeb.Domain.Exceptions;

public class StockInvalidoException : DomainException
{
    public int Stock { get; }

    public StockInvalidoException(int stock)
        : base($"El stock '{stock}' es inválido")
    {
        Stock = stock;
    }
}
