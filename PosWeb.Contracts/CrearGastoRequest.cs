namespace PosWeb.Contracts;

public class CrearGastoRequest
{
    public decimal Monto { get; set; }
    public string Detalle { get; set; } = string.Empty;
    public string? FuentePago { get; set; }        // "caja" (default), "ahorro", "dividir"
    public decimal? MontoPagadoCaja { get; set; }  // used when FuentePago == "dividir"
}
