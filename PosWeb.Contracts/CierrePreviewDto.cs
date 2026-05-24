namespace PosWeb.Contracts;

public class CierrePreviewDto
{
    public int CajaId { get; set; }
    public decimal MontoInicial { get; set; }
    public decimal TotalVentas { get; set; }
    public List<PagoPorMedioDto> DesglosePagos { get; set; } = new();
}
