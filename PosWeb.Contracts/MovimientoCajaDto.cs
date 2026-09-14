namespace PosWeb.Contracts;

public class MovimientoCajaDto
{
    /// <summary>"Venta" o "Gasto".</summary>
    public string Tipo { get; set; } = string.Empty;

    public int ReferenciaId { get; set; }

    public DateTime Fecha { get; set; }

    public string Descripcion { get; set; } = string.Empty;

    /// <summary>Monto siempre positivo. El signo lo determina el Tipo.</summary>
    public decimal Monto { get; set; }

    public bool Anulado { get; set; }
}
