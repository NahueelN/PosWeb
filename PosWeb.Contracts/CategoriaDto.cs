namespace PosWeb.Contracts;

public class CategoriaDto
{
    public int Id { get; set; }
    public string Descripcion { get; set; } = null!;
    public decimal? MargenGanancia { get; set; }
}
