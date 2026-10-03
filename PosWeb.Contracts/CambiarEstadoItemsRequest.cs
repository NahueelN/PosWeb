namespace PosWeb.Contracts;

public class CambiarEstadoItemsRequest
{
    public int[] Items { get; set; } = [];
    public string Estado { get; set; } = string.Empty;
}