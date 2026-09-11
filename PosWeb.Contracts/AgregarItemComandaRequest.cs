namespace PosWeb.Contracts;

public class AgregarItemComandaRequest
{
    public int? ProductoId { get; set; }
    public int? ComboId { get; set; }
    public decimal Cantidad { get; set; } = 1;
    /// <summary>Nota aplicada a todas las unidades (cuando Cantidad = 1, o como default).</summary>
    public string? Nota { get; set; }
    /// <summary>Nota individual por unidad (una por cada unidad). Si viene, tiene prioridad sobre <see cref="Nota"/>.</summary>
    public List<string?>? Notas { get; set; }
}