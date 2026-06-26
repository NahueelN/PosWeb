namespace PosWeb.Contracts;

public class MovimientoCuentaDto
{
    public string Tipo { get; set; } = ""; // "deuda" o "pago"
    public DateTime Fecha { get; set; }
    public decimal Monto { get; set; }
    public string? Descripcion { get; set; }
    public string? Usuario { get; set; }
    public int? PagoId { get; set; }
}

public class CuentaCorrienteDto
{
    public string EntidadNombre { get; set; } = "";
    public decimal SaldoActual { get; set; }
    public List<MovimientoCuentaDto> Movimientos { get; set; } = new();
}
