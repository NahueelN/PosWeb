namespace PosWeb.Contracts;

public class VentaDto
{
    public int SucursalId { get; set; }
    public List<VentaItemDto> Items { get; set; } = new();
    public List<PagoVentaDto>? Pagos { get; set; }
    public int? ClienteId { get; set; }
    public bool AllowSinStock { get; set; }
    public bool SinStock { get; set; }
    public int? SesionMesaId { get; set; }
    public bool EsperarTransferencia { get; set; }
    public int? PendienteMedioId { get; set; }
}