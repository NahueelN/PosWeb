namespace PosWeb.Contracts;

public class PagoDeudaDto
{
    public int Id { get; set; }
    public int DeudaId { get; set; }
    public decimal Monto { get; set; }
    public DateTime Fecha { get; set; }
    public string? ClienteNombre { get; set; }
    public string? ProveedorNombre { get; set; }
    public string? UsuarioNombre { get; set; }
}
