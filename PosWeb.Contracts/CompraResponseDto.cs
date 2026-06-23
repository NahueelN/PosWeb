namespace PosWeb.Contracts;

public class CompraResponseDto
{
    public int CompraId { get; set; }
    public int? GastoId { get; set; }
    public decimal TotalGasto { get; set; }
    public DateTime Fecha { get; set; }
    public List<CompraItemResultDto> Items { get; set; } = new();
}

public class CompraItemResultDto
{
    public int ProductoId { get; set; }
    public string ProductoNombre { get; set; } = null!;
    public int Cantidad { get; set; }
    public decimal CostoUnitario { get; set; }
    public decimal Subtotal { get; set; }
}
