namespace PosWeb.Domain.Exceptions;

public class SucursalInvalidaException : DomainException
{
    public int SucursalId { get; }

    public SucursalInvalidaException(int sucursalId)
        : base($"Sucursal inválida (ID: {sucursalId})")
    {
        SucursalId = sucursalId;
    }
}
