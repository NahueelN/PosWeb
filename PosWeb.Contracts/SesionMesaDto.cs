namespace PosWeb.Contracts;

public class SesionMesaDto
{
    public int Id { get; set; }
    public int MesaId { get; set; }
    public string MesaNumero { get; set; } = "";
    public int SucursalId { get; set; }
    public int UsuarioId { get; set; }
    public string Estado { get; set; } = "";
    public DateTime FechaApertura { get; set; }
    public DateTime? FechaCierre { get; set; }
    public int? IdVenta { get; set; }
    public decimal Total { get; set; }
    public List<ItemComandaDto> Items { get; set; } = new();
}