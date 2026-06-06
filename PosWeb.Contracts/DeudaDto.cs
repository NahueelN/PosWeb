namespace PosWeb.Contracts;

public record DeudaDto(
    int Id,
    string ProveedorNombre,
    decimal Monto,
    DateTime Fecha,
    DateTime? FechaPago,
    bool Pago,
    int? CompraId,
    decimal MontoPagado = 0,
    decimal SaldoPendiente = 0
);
