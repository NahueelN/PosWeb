namespace PosWeb.Domain;

public class CategoriaGasto
{
    public int ID_CATEGORIA_GASTO { get; private set; }
    public string DESCRIPCION { get; private set; } = null!;
    public bool ACTIVO { get; private set; }

    protected CategoriaGasto() { }

    public CategoriaGasto(string descripcion)
    {
        if (string.IsNullOrWhiteSpace(descripcion))
            throw new ArgumentException("La descripción es requerida", nameof(descripcion));
        if (descripcion.Length > 100)
            throw new ArgumentException("La descripción no puede superar los 100 caracteres", nameof(descripcion));

        DESCRIPCION = descripcion.Trim();
        ACTIVO = true;
    }
}
