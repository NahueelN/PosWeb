namespace PosWeb.Domain.Exceptions;

public class StockInvalidoException : DomainException
{
    public decimal Stock { get; }

    public StockInvalidoException(decimal stock)
        : base($"El stock '{stock}' es inválido")
    {
        Stock = stock;
    }
}
