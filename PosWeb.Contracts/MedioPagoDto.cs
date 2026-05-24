namespace PosWeb.Contracts;

public class MedioPagoDto
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public bool PagaVuelto { get; set; }
    public bool Activo { get; set; }
}
