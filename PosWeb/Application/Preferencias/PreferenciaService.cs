using Microsoft.EntityFrameworkCore;
using PosWeb.Data;
using PosWeb.Domain;
using System.Text.Json;

namespace PosWeb.Application.Preferencias;

public class PreferenciaService
{
    private readonly PosDbContextLocal _context;

    public PreferenciaService(PosDbContextLocal context)
    {
        _context = context;
    }

    public async Task<Dictionary<string, JsonElement>> ObtenerAsync(int userId)
    {
        var filas = await _context.UsuarioPreferencia
            .Where(p => p.ID_USUARIO == userId)
            .ToListAsync();

        var resultado = new Dictionary<string, JsonElement>();
        foreach (var fila in filas)
        {
            if (TryDeserializeValor(fila.VALOR, out var json))
            {
                resultado[fila.CLAVE] = json;
            }
        }

        return resultado;
    }

    public async Task GuardarAsync(int userId, Dictionary<string, JsonElement> preferencias)
    {
        foreach (var (clave, valor) in preferencias)
        {
            var valorJson = valor.GetRawText();

            var existente = await _context.UsuarioPreferencia
                .FirstOrDefaultAsync(p => p.ID_USUARIO == userId && p.CLAVE == clave);

            if (existente != null)
            {
                existente.CambiarValor(valorJson);
            }
            else
            {
                _context.UsuarioPreferencia.Add(new UsuarioPreferencia(userId, clave, valorJson));
            }
        }

        await _context.SaveChangesAsync();
    }

    private static bool TryDeserializeValor(string valor, out JsonElement json)
    {
        json = default;
        try
        {
            using var doc = JsonDocument.Parse(valor);
            json = doc.RootElement.Clone();
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}
