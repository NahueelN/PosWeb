namespace PosWeb.Contracts;

public class MesaDto
{
    public int Id { get; set; }
    public int SucursalId { get; set; }
    public string Numero { get; set; } = "";
    public string? Descripcion { get; set; }
    /// <summary>Salón/área del local (ej: Principal, Terraza).</summary>
    public string Salon { get; set; } = "Principal";
    public decimal PosX { get; set; }
    public decimal PosY { get; set; }
    public bool Activa { get; set; }
    /// <summary>true si la mesa tiene una sesión abierta.</summary>
    public bool Ocupada { get; set; }
}