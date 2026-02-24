namespace PosWeb.Domain.Exceptions;

public class NumeroSucursalInvalidoException : DomainException
{
    public int Numero { get; }

    public NumeroSucursalInvalidoException(int numero)
        : base($"El número de sucursal '{numero}' es inválido")
    {
        Numero = numero;
    }
}
