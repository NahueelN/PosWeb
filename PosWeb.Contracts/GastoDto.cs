namespace PosWeb.Contracts;

public class GastoDto
{
    public int Id { get; set; }
    public int? CajaId { get; set; }
    public decimal Monto { get; set; }
    public string Detalle { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }
    public bool Anulado { get; set; }
    public string UsuarioNombre { get; set; } = string.Empty;
}
