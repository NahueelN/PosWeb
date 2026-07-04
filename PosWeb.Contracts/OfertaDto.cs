namespace PosWeb.Contracts;

public class OfertaDto
{
    public int Id { get; set; }
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public int ProductoId { get; set; }
    public string? ProductoNombre { get; set; }
    public string? CodigoBarra { get; set; }
    public decimal Descuento { get; set; }
    public bool Activo { get; set; }
    public string? DiasSemana { get; set; }
    public string? Warning { get; set; }
}

public class OfertaUpsertDto
{
    public DateTime FechaInicio { get; set; }
    public DateTime FechaFin { get; set; }
    public int ProductoId { get; set; }
    public decimal Descuento { get; set; }
    public string? DiasSemana { get; set; }
}
