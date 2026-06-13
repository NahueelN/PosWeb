namespace PosWeb.Contracts;

public class PedidoListDto
{
    public int Id { get; set; }
    public string ProveedorNombre { get; set; } = null!;
    public decimal Total { get; set; }
    public DateTime Fecha { get; set; }
    public DateTime? FechaEsperada { get; set; }
    public string Estado { get; set; } = null!;
    public int CantidadItems { get; set; }
}

public class PedidoDetailDto
{
    public int Id { get; set; }
    public string ProveedorNombre { get; set; } = null!;
    public DateTime Fecha { get; set; }
    public DateTime? FechaEsperada { get; set; }
    public decimal Total { get; set; }
    public string Estado { get; set; } = null!;
    public List<PedidoItemDetailDto> Items { get; set; } = new();
    public int? IdPedidoOrigen { get; set; }
}

public class PedidoItemDetailDto
{
    public int Id { get; set; }
    public int ProductoId { get; set; }
    public string ProductoNombre { get; set; } = null!;
    public string CodigoBarra { get; set; } = null!;
    public decimal CantidadPedida { get; set; }
    public decimal PrecioUnitarioEstimado { get; set; }
    public decimal Subtotal { get; set; }
    public string Estado { get; set; } = null!;
    public string? Descripcion { get; set; }
}

public class PedidoRequestDto
{
    public int SucursalId { get; set; }
    public int ProveedorId { get; set; }
    public List<PedidoItemRequestDto> Items { get; set; } = new();
    public DateTime? FechaEsperada { get; set; }
    public string? Observaciones { get; set; }
}

public class PedidoItemRequestDto
{
    public int ProductoId { get; set; }
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitarioEstimado { get; set; }
    public string? Descripcion { get; set; }
}

public class RecibirPedidoRequestDto
{
    public List<RecibirItemDto> Items { get; set; } = new();
}

public class RecibirItemDto
{
    public int RenglonPedidoId { get; set; }
    public decimal CantidadRecibida { get; set; }
    public bool EsFaltante { get; set; }
    public decimal PrecioUnitarioReal { get; set; }
}
