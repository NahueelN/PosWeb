namespace PosWeb.Contracts;

public class PagarMultipleClienteRequestDto
{
    public int ClienteId { get; set; }
    public decimal Monto { get; set; }
}
