using PosWeb.Domain.Exceptions;
using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Categoria
{
    [Key]
    public int ID_CATEGORIA { get; private set; }

    public string COD_CATEGORIA { get; private set; } = null!;

    public string DESC_CATEGORIA { get; private set; } = null!;

    public decimal? MARGEN_GANANCIA { get; private set; }

    public Categoria(string codCategoria, string descCategoria)
    {
        CambiarCodigo(codCategoria);
        CambiarDescripcion(descCategoria);
    }

    protected Categoria()
    {
    }

    public void CambiarCodigo(string codigo)
    {
        if (string.IsNullOrWhiteSpace(codigo))
        {
            throw new CodigoInvalidoException("Categoria", codigo);
        }

        COD_CATEGORIA = codigo.Trim();
    }

    public void CambiarDescripcion(string descripcion)
    {
        if (string.IsNullOrWhiteSpace(descripcion) || descripcion.Trim().Length > 200)
        {
            throw new ArgumentException("La descripción de la categoría es requerida y debe tener hasta 200 caracteres");
        }

        DESC_CATEGORIA = descripcion.Trim();
    }

    public void AsignarMargen(decimal? margen)
    {
        if (margen.HasValue && (margen.Value < 0 || margen.Value > 999.99m))
        {
            throw new ArgumentException("El margen debe estar entre 0% y 999.99%");
        }

        MARGEN_GANANCIA = margen;
    }
}
