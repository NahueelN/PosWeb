using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Categorias;

/// <summary>
/// Busca una categoría existente (case-insensitive por descripción o código)
/// a partir de un nombre sugerido por una API externa (catálogo cloud u Open Food Facts).
/// No crea categorías.
/// </summary>
public class CategoriaSugeridaService
{
    private readonly PosDbContextLocal _context;

    public CategoriaSugeridaService(PosDbContextLocal context)
    {
        _context = context;
    }

    /// <summary>
    /// Devuelve el ID de la categoría si ya existe (case-insensitive), o null si no.
    /// </summary>
    public int? Resolver(string? nombreCategoria)
    {
        if (string.IsNullOrWhiteSpace(nombreCategoria))
            return null;

        var descripcion = nombreCategoria.Trim();
        var codigo = NormalizarCodigo(descripcion);

        return _context.Categoria
            .FirstOrDefault(c =>
                c.DESC_CATEGORIA.ToLower() == descripcion.ToLower()
                || c.COD_CATEGORIA.ToLower() == codigo.ToLower())
            ?.ID_CATEGORIA;
    }

    /// <summary>
    /// Convierte el nombre de la categoría a un código: sin espacios y en mayúsculas.
    /// </summary>
    private static string NormalizarCodigo(string nombre)
    {
        var codigo = new string(nombre.Where(c => !char.IsWhiteSpace(c)).ToArray()).ToUpperInvariant();
        return codigo.Length > 50 ? codigo[..50] : codigo;
    }
}