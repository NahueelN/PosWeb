using Microsoft.EntityFrameworkCore;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.UnidadesMedida;

/// <summary>
/// Busca una unidad de medida por código (case-insensitive) o la crea si no existe,
/// a partir de la unidad sugerida por una API externa (catálogo cloud u Open Food Facts).
/// </summary>
public class UnidadSugeridaService
{
    private readonly PosDbContextLocal _context;

    private static readonly Dictionary<string, string> DescripcionPorCodigo = new(StringComparer.OrdinalIgnoreCase)
    {
        ["ML"] = "Mililitros",
        ["L"] = "Litros",
        ["GR"] = "Gramos",
        ["G"] = "Gramos",
        ["KILO"] = "Kilogramos",
        ["KG"] = "Kilogramos",
        ["UNIDAD"] = "Unidades",
        ["PACK"] = "Packs",
    };

    public UnidadSugeridaService(PosDbContextLocal context)
    {
        _context = context;
    }

    /// <summary>
    /// Devuelve el ID de la unidad si ya existe (case-insensitive por código) o la crea.
    /// Devuelve null si el código viene vacío.
    /// </summary>
    public int? ResolverOCrear(string? codigo)
    {
        if (string.IsNullOrWhiteSpace(codigo))
            return null;

        var codigoNorm = codigo.Trim().ToUpperInvariant();

        var existente = _context.UnidadMedida
            .FirstOrDefault(u => u.COD_UNIDAD_MEDIDA.ToLower() == codigoNorm.ToLower());
        if (existente != null)
            return existente.ID_UNIDAD_MEDIDA;

        try
        {
            var descripcion = DescripcionPorCodigo.TryGetValue(codigoNorm, out var desc)
                ? desc
                : codigoNorm;

            var nueva = new UnidadMedida(codigoNorm, descripcion);
            _context.UnidadMedida.Add(nueva);
            _context.SaveChanges();
            return nueva.ID_UNIDAD_MEDIDA;
        }
        catch (DbUpdateException)
        {
            // Otra consulta concurrente pudo haberla creado: re-buscar.
            return _context.UnidadMedida
                .FirstOrDefault(u => u.COD_UNIDAD_MEDIDA.ToLower() == codigoNorm.ToLower())
                ?.ID_UNIDAD_MEDIDA;
        }
    }
}