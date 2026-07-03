namespace PosWeb.Contracts;

public class ComboDto
{
    public int Id { get; set; }
    public string CodCombo { get; set; } = string.Empty;
    public string DescCombo { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public bool Activo { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public string? DiasSemana { get; set; }
    public List<ComboItemDto> Items { get; set; } = new();
}

public class ComboUpsertDto
{
    public string CodCombo { get; set; } = string.Empty;
    public string DescCombo { get; set; } = string.Empty;
    public decimal Precio { get; set; }
    public DateTime? FechaInicio { get; set; }
    public DateTime? FechaFin { get; set; }
    public string? DiasSemana { get; set; }
    public List<ComboItemDto> Items { get; set; } = new();
}

public class ComboItemDto
{
    public int ProductoId { get; set; }
    public decimal Cantidad { get; set; }
    public string? ProductoNombre { get; set; }
    public string? CodigoBarra { get; set; }
}
