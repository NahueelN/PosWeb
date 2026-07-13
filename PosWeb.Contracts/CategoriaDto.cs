namespace PosWeb.Contracts;

public class CategoriaDto
{
    public int Id { get; set; }
    public string Codigo { get; set; } = null!;
    public string Descripcion { get; set; } = null!;
    public decimal? MargenGanancia { get; set; }
}
