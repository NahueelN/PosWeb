using System.ComponentModel.DataAnnotations;

namespace PosWeb.Domain;

public class Oferta
{
    [Key]
    public int ID_OFERTA { get; private set; }

    public DateTime FECHA_INICIO { get; private set; }

    public DateTime FECHA_FIN { get; private set; }

    public int ID_PRODUCTO { get; private set; }

    public decimal DESCUENTO { get; private set; }

    public bool ACTIVO { get; private set; }

    public string? DIAS_SEMANA { get; private set; }

    public Oferta(DateTime fechaInicio, DateTime fechaFin, int idProducto, decimal descuento, string? diasSemana = null)
    {
        CambiarFechas(fechaInicio, fechaFin);
        CambiarProducto(idProducto);
        CambiarDescuento(descuento);
        CambiarDiasSemana(diasSemana);
        ACTIVO = true;
    }

    protected Oferta() { }

    public void CambiarFechas(DateTime fechaInicio, DateTime fechaFin)
    {
        if (fechaFin <= fechaInicio)
            throw new ArgumentException("La fecha de fin debe ser posterior a la fecha de inicio");
        FECHA_INICIO = fechaInicio;
        FECHA_FIN = fechaFin;
    }

    public void CambiarProducto(int idProducto)
    {
        if (idProducto <= 0)
            throw new ArgumentException("ID de producto inválido", nameof(idProducto));
        ID_PRODUCTO = idProducto;
    }

    public void CambiarDescuento(decimal descuento)
    {
        if (descuento <= 0 || descuento > 100)
            throw new ArgumentException("El descuento debe estar entre 0 y 100", nameof(descuento));
        DESCUENTO = descuento;
    }

    public void CambiarDiasSemana(string? diasSemana)
    {
        DIAS_SEMANA = diasSemana;
    }

    public bool EstaVigenteHoy()
    {
        if (!ACTIVO) return false;

        var hoy = DateTime.Today;

        if (hoy < FECHA_INICIO.Date) return false;
        if (hoy > FECHA_FIN.Date) return false;

        if (!string.IsNullOrWhiteSpace(DIAS_SEMANA))
        {
            var diasMap = new[] { "DOM", "LUN", "MAR", "MIE", "JUE", "VIE", "SAB" };
            var diaActual = diasMap[(int)hoy.DayOfWeek];
            var dias = DIAS_SEMANA.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(d => d.Trim().ToUpperInvariant());
            if (!dias.Contains(diaActual)) return false;
        }

        return true;
    }

    public void Activar() => ACTIVO = true;
    public void Desactivar() => ACTIVO = false;
}
