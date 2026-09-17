namespace PosWeb.Contracts;

public class ItemComandaDto
{
    public int Id { get; set; }
    public int SesionMesaId { get; set; }
    public int? ProductoId { get; set; }
    public int? ComboId { get; set; }
    public string Descripcion { get; set; } = "";
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal Subtotal { get; set; }
    public string? Nota { get; set; }
    public string Estado { get; set; } = "";
    /// <summary>Grupo/ronda de la comanda (Entrada | Principal | Postre | Otros).</summary>
    public string Grupo { get; set; } = "Principal";
    public DateTime FechaAlta { get; set; }
    public DateTime? FechaEstado { get; set; }
}