using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Combo
{
    [Key]
    public int ID_COMBO { get; private set; }

    public string COD_COMBO { get; private set; } = null!;

    public string DESC_COMBO { get; private set; } = null!;

    public decimal PRECIO { get; private set; }

    public bool ACTIVO { get; private set; }

    public DateTime? FECHA_INICIO { get; private set; }

    public DateTime? FECHA_FIN { get; private set; }

    public string? DIAS_SEMANA { get; private set; }

    private readonly List<ComboItem> _ITEMS = new();
    public IReadOnlyCollection<ComboItem> ITEMS => _ITEMS;

    public Combo(string codCombo, string descCombo, decimal precio)
    {
        CambiarCodigo(codCombo);
        CambiarDescripcion(descCombo);
        CambiarPrecio(precio);
        ACTIVO = true;
    }

    protected Combo() { }

    public void CambiarCodigo(string codigo)
    {
        if (string.IsNullOrWhiteSpace(codigo))
            throw new ArgumentException("El código del combo es obligatorio", nameof(codigo));
        COD_COMBO = codigo.Trim().ToUpperInvariant();
    }

    public void CambiarDescripcion(string descripcion)
    {
        if (string.IsNullOrWhiteSpace(descripcion))
            throw new ArgumentException("La descripción del combo es obligatoria", nameof(descripcion));
        DESC_COMBO = descripcion.Trim();
    }

    public void CambiarPrecio(decimal precio)
    {
        if (precio <= 0)
            throw new ArgumentException("El precio del combo debe ser mayor a 0", nameof(precio));
        PRECIO = precio;
    }

    public void CambiarFechas(DateTime? fechaInicio, DateTime? fechaFin)
    {
        if (fechaInicio.HasValue && fechaFin.HasValue && fechaFin.Value <= fechaInicio.Value)
            throw new ArgumentException("La fecha de fin debe ser posterior a la fecha de inicio");
        FECHA_INICIO = fechaInicio;
        FECHA_FIN = fechaFin;
    }

    public void CambiarDiasSemana(string? diasSemana)
    {
        DIAS_SEMANA = diasSemana;
    }

    public bool EstaVigenteHoy()
    {
        if (!ACTIVO) return false;

        var hoy = DateTime.Today;

        if (FECHA_INICIO.HasValue && hoy < FECHA_INICIO.Value.Date) return false;
        if (FECHA_FIN.HasValue && hoy > FECHA_FIN.Value.Date) return false;

        if (!string.IsNullOrWhiteSpace(DIAS_SEMANA))
        {
            var diaActual = hoy.ToString("ddd").ToUpperInvariant();
            var dias = DIAS_SEMANA.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(d => d.Trim().ToUpperInvariant());
            if (!dias.Contains(diaActual)) return false;
        }

        return true;
    }

    public void AgregarItem(ComboItem item)
    {
        if (item == null)
            throw new ArgumentNullException(nameof(item));

        if (_ITEMS.Any(i => i.ID_PRODUCTO == item.ID_PRODUCTO))
            throw new InvalidOperationException("El producto ya está en el combo");

        _ITEMS.Add(item);
    }

    public void QuitarItem(int productoId)
    {
        var item = _ITEMS.FirstOrDefault(i => i.ID_PRODUCTO == productoId);
        if (item != null)
            _ITEMS.Remove(item);
    }

    public void LimpiarItems()
    {
        _ITEMS.Clear();
    }

    public void Activar() => ACTIVO = true;
    public void Desactivar() => ACTIVO = false;
}
