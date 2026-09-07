using System.Text.Json;

namespace PosWeb.Application.Cajas;

public sealed record TurnoPeriodo(TimeOnly Inicio, TimeOnly Fin);

public sealed record CajaPeriodo
{
    public required string Modo { get; init; }
    public double Cantidad { get; init; }
    public string Unidad { get; init; } = "horas";
    public List<TurnoPeriodo> Periodos { get; init; } = new();
}

public static class CajaPeriodoHelper
{
    public const string Clave = "cajaPeriodo";

    public static bool TryDeserializar(string? valor, out CajaPeriodo? config)
    {
        config = null;
        if (string.IsNullOrWhiteSpace(valor)) return false;
        try
        {
            using var doc = JsonDocument.Parse(valor);
            if (doc.RootElement.ValueKind != JsonValueKind.Object) return false;
            var root = doc.RootElement;
            if (!root.TryGetProperty("modo", out var modoProp)) return false;
            var modo = modoProp.GetString();

            if (modo == "duracion")
            {
                if (!root.TryGetProperty("cantidad", out var cantidadProp) || !cantidadProp.TryGetDouble(out var cantidad))
                    return false;
                if (cantidad <= 0) return false;
                var unidad = root.TryGetProperty("unidad", out var unidadProp) ? unidadProp.GetString() : null;
                config = new CajaPeriodo
                {
                    Modo = "duracion",
                    Cantidad = cantidad,
                    Unidad = unidad == "dias" ? "dias" : "horas",
                };
                return true;
            }

            if (modo == "horario")
            {
                if (!root.TryGetProperty("periodos", out var periodosProp) || periodosProp.ValueKind != JsonValueKind.Array)
                    return false;
                var turnos = new List<TurnoPeriodo>();
                foreach (var item in periodosProp.EnumerateArray())
                {
                    if (!item.TryGetProperty("inicio", out var iniProp) || !item.TryGetProperty("fin", out var finProp))
                        return false;
                    if (!TimeOnly.TryParse(iniProp.GetString(), out var ini) || !TimeOnly.TryParse(finProp.GetString(), out var fin))
                        return false;
                    turnos.Add(new TurnoPeriodo(ini, fin));
                }
                if (turnos.Count == 0) return false;
                config = new CajaPeriodo { Modo = "horario", Periodos = turnos };
                return true;
            }

            return false;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    /// <summary>Devuelve el primer turno que contiene la hora, o null si está fuera de todos.</summary>
    public static TurnoPeriodo? Encontrar(IEnumerable<TurnoPeriodo> turnos, TimeOnly hora)
        => turnos.FirstOrDefault(t => Pertenece(t, hora));

    /// <summary>Indica si la hora cae dentro del turno. Inicio == Fin significa día completo.</summary>
    public static bool Pertenece(TurnoPeriodo turno, TimeOnly hora)
    {
        if (turno.Inicio == turno.Fin) return true;
        if (turno.Inicio < turno.Fin) return hora >= turno.Inicio && hora < turno.Fin;
        // Cruza medianoche (Inicio > Fin)
        return hora >= turno.Inicio || hora < turno.Fin;
    }

    /// <summary>Hora de cierre del turno que contiene la apertura (próxima ocurrencia de Fin posterior a la apertura).</summary>
    public static DateTime FinDelTurno(DateTime apertura, TurnoPeriodo turno)
    {
        var fin = apertura.Date.Add(turno.Fin.ToTimeSpan());
        while (fin <= apertura)
        {
            fin = fin.AddDays(1);
        }
        return fin;
    }
}