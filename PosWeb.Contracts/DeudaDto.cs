namespace PosWeb.Contracts;

public record DeudaDto(
    int Id,
    string? ProveedorNombre = null,
    string? ClienteNombre = null,
    decimal Monto = 0,
    DateTime? Fecha = null,
    DateTime? FechaPago = null,
    bool Pago = false,
    int? CompraId = null,
    int? VentaId = null,
    int? ProveedorId = null,
    int? ClienteId = null,
    decimal MontoPagado = 0,
    decimal SaldoPendiente = 0
);
