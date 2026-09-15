namespace PosWeb.Contracts;

public class CobrarCuentaRequest
{
    public List<PagoVentaDto>? Pagos { get; set; }
    public int? ClienteId { get; set; }
    public bool EsperarTransferencia { get; set; }
    public int? PendienteMedioId { get; set; }
}