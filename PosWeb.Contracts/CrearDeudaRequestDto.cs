namespace PosWeb.Contracts;

public class CrearDeudaRequestDto
{
    public int? ClienteId { get; set; }
    public int? ProveedorId { get; set; }
    public decimal Monto { get; set; }
}
