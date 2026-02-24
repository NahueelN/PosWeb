namespace PosWeb.Contracts;

public class VentaDto
{
    public int SucursalId { get; set; }
    public List<VentaItemDto> Items { get; set; } = new();
}