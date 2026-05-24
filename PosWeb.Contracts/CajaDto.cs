namespace PosWeb.Contracts;

public class CajaDto
{
    public int Id { get; set; }
    public int SucursalId { get; set; }
    public string Estado { get; set; } = string.Empty;
    public DateTime FechaApertura { get; set; }
    public DateTime? FechaCierre { get; set; }
    public decimal MontoInicial { get; set; }
    public decimal? MontoContadoEfectivo { get; set; }
    public decimal? MontoContadoTarjetas { get; set; }
    public decimal? Diferencia { get; set; }
    public decimal TotalVentas { get; set; }
    public decimal Gastos { get; set; }
    public decimal Esperado { get; set; }
    public List<PagoPorMedioDto> DesglosePagos { get; set; } = new();
    public string UsuarioApertura { get; set; } = string.Empty;
    public string? UsuarioCierre { get; set; }
}
