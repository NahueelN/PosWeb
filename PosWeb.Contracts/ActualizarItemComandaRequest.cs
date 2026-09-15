namespace PosWeb.Contracts;

public class ActualizarItemComandaRequest
{
    public decimal Cantidad { get; set; } = 1;
    public string? Nota { get; set; }
    /// <summary>Grupo/ronda de la comanda (para reasignar al mover entre grupos).</summary>
    public string? Grupo { get; set; }
}