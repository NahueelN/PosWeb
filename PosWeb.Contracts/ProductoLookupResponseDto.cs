namespace PosWeb.Contracts;

/// <summary>
/// Respuesta del endpoint híbrido de lookup: producto local, remoto, o no encontrado.
/// </summary>
public class ProductoLookupResponseDto
{
    /// <summary>true si el producto ya existe en la DB local.</summary>
    public bool Local { get; set; }

    /// <summary>Producto local si Local == true.</summary>
    public ProductoDto? Producto { get; set; }

    /// <summary>true si Open Food Facts devolvió datos.</summary>
    public bool Encontrado { get; set; }

    /// <summary>Datos mapeados de Open Food Facts si Encontrado == true.</summary>
    public OpenFoodFactsResultDto? Datos { get; set; }
}
