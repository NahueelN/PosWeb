using Microsoft.AspNetCore.Mvc;
using PosWeb.Application.Catalogo;
using PosWeb.Application.Exceptions;
using PosWeb.Application.OpenFoodFacts;
using PosWeb.Application.Productos;
using PosWeb.Contracts;
using ClosedXML.Excel;

namespace PosWeb.Controllers;

[ApiController]
[Route("api/productos")]
public class ProductosController : ControllerBase
{
    private readonly ProductoService _productoService;
    private readonly OpenFoodFactsService _openFoodFactsService;
    private readonly CatalogoService _catalogoService;

    public ProductosController(ProductoService productoService, OpenFoodFactsService openFoodFactsService, CatalogoService catalogoService)
    {
        _productoService = productoService;
        _openFoodFactsService = openFoodFactsService;
        _catalogoService = catalogoService;
    }

    [HttpGet]
    public IActionResult Get([FromQuery] int? sucursalId = null, [FromQuery] bool? esPesable = null, [FromQuery] bool? esBulto = null)
    {
        return Ok(_productoService.ObtenerActivos(sucursalId, esPesable, esBulto));
    }

    [HttpGet("{id}/detalle")]
    public IActionResult Detalle(int id, [FromQuery] int? sucursalId = null)
    {
        var detalle = _productoService.ObtenerDetalle(id, sucursalId);
        if (detalle == null) return NotFound();
        return Ok(detalle);
    }

    [HttpGet("barra/{codigoBarra}")]
    public IActionResult GetPorCodigoBarra(string codigoBarra, [FromQuery] int? sucursalId = null)
    {
        if (sucursalId.HasValue)
            return Ok(_productoService.ObtenerPorCodigoBarra(codigoBarra, sucursalId.Value));
        return Ok(_productoService.ObtenerPorCodigoBarra(codigoBarra));
    }

    [HttpGet("buscar")]
    public IActionResult Buscar([FromQuery] string q, [FromQuery] int? sucursalId = null)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Ok(new List<ProductoDto>());
        }

        if (sucursalId.HasValue)
        {
            return Ok(_productoService.BuscarParaVenta(q.Trim(), sucursalId.Value));
        }

        return Ok(_productoService.BuscarPorNombre(q.Trim()));
    }

    [HttpGet("buscar-venta")]
    public IActionResult BuscarParaVenta([FromQuery] string q, [FromQuery] int sucursalId)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Ok(new List<ProductoDto>());
        }

        if (sucursalId <= 0)
        {
            return BadRequest("sucursalId es requerido");
        }

        return Ok(_productoService.BuscarParaVenta(q.Trim(), sucursalId));
    }

    /// <summary>
    /// Busca un producto por código de barras: DB local → Catálogo cloud → Open Food Facts.
    /// </summary>
    [HttpGet("openfoodfacts/{codigo}")]
    public async Task<IActionResult> LookupOpenFoodFacts(string codigo)
    {
        // 1. Buscar en DB local
        try
        {
            var local = _productoService.ObtenerPorCodigoBarra(codigo);
            return Ok(new ProductoLookupResponseDto
            {
                Local = true,
                Producto = local,
                Encontrado = true
            });
        }
        catch (ProductoNoEncontradoException)
        {
            // No existe localmente, continuar
        }

        // 2. Consultar Catálogo cloud
        var catalogoDatos = await _catalogoService.ConsultarAsync(codigo);

        if (catalogoDatos != null)
        {
            return Ok(new ProductoLookupResponseDto
            {
                Local = false,
                Encontrado = true,
                Datos = catalogoDatos
            });
        }

        // 3. Consultar Open Food Facts
        var datos = await _openFoodFactsService.ConsultarAsync(codigo);

        if (datos != null)
        {
            return Ok(new ProductoLookupResponseDto
            {
                Local = false,
                Encontrado = true,
                Datos = datos
            });
        }

        // 4. No encontrado en ningún lado
        return Ok(new ProductoLookupResponseDto
        {
            Local = false,
            Encontrado = false
        });
    }

    [HttpGet("proximo-codigo")]
    public IActionResult GetProximoCodigo()
    {
        var codigo = _productoService.ObtenerSiguienteCodigo();
        return Ok(new { codigo });
    }

    [HttpPost]
    public async Task<IActionResult> Post([FromBody] ProductoUpsertDto dto)
    {
        var result = _productoService.Crear(dto);

        if (!string.IsNullOrWhiteSpace(dto.CodigoBarra))
        {
            _ = Task.Run(() => _catalogoService.SubirProductoAsync(
                dto.CodigoBarra, dto.Nombre, dto.Marca, dto.Contenido, null));
        }

        return Ok(result);
    }

    /// <summary>
    /// Importa productos desde un Excel (formato articulos.xls / hoja "Productos").
    /// CREATE-ONLY: saltea códigos duplicados/vacíos y reporta los saltos.
    /// </summary>
    [HttpPost("importar")]
    [RequestSizeLimit(20_000_000)]
    public async Task<IActionResult> Importar(IFormFile archivo, [FromForm] int? sucursalId, [FromForm] bool importarSinCodigo = false)
    {
        if (archivo == null || archivo.Length == 0)
            return BadRequest(new { error = "Archivo requerido" });

        try
        {
            using var stream = archivo.OpenReadStream();
            var filas = ParsearExcel(stream);
            var result = _productoService.ImportarProductos(filas, sucursalId, importarSinCodigo);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = $"No se pudo procesar el archivo: {ex.Message}" });
        }
    }

    /// <summary>
    /// Re-importa un conjunto de filas ya corregidas (enviadas como JSON) usando la
    /// misma validación/dedup/resolución de categorías que el import desde Excel.
    /// </summary>
    [HttpPost("importar-filas")]
    public IActionResult ImportarFilas([FromBody] ImportarFilasRequest request)
    {
        var result = _productoService.ImportarProductos(request.Filas, request.SucursalId, request.ImportarSinCodigo);
        return Ok(result);
    }

    /// <summary>
    /// Parsea el Excel a una lista de ProductoImportFila, mapeando por nombre de columna
    /// (no por posición) para ser robusto. Fila 1 = header. Numéricos se convierten con decimal.TryParse.
    /// </summary>
    private static List<ProductoImportFila> ParsearExcel(Stream stream)
    {
        var filas = new List<ProductoImportFila>();

        using var wb = new XLWorkbook(stream);
        // Preferir la hoja "Productos" (formato articulos.xls); si no existe, usar la primera.
        var ws = wb.Worksheet("Productos") ?? wb.Worksheets.FirstOrDefault();
        if (ws == null) return filas;

        // Mapa nombre de columna -> índice (1-based en ClosedXML).
        var columnas = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var lastCol = ws.LastColumnUsed()?.ColumnNumber() ?? 0;
        for (int c = 1; c <= lastCol; c++)
        {
            var nombre = ws.Cell(1, c).GetValue<string>()?.Trim();
            if (!string.IsNullOrWhiteSpace(nombre))
                columnas[nombre] = c;
        }
        if (columnas.Count == 0) return filas;

        // Resolver índices por nombre exacto del header del archivo articulos.xls.
        columnas.TryGetValue("Codigo Barras", out int colCod);
        columnas.TryGetValue("Descripcion", out int colDesc);
        columnas.TryGetValue("Marca", out int colMarca);
        columnas.TryGetValue("Rubro", out int colRubro);
        columnas.TryGetValue("Stock", out int colStock);
        columnas.TryGetValue("Costo", out int colCosto);
        columnas.TryGetValue("Precio Final 1", out int colPrecio);

        int lastRow = ws.LastRowUsed()?.RowNumber() ?? 0;
        for (int r = 2; r <= lastRow; r++)
        {
            // Saltear filas completamente vacías.
            bool filaVacia = true;
            for (int c = 1; c <= lastCol; c++)
            {
                if (!ws.Cell(r, c).IsEmpty())
                {
                    filaVacia = false;
                    break;
                }
            }
            if (filaVacia) continue;

            var fila = new ProductoImportFila
            {
                CodigoBarras = colCod > 0 ? GetTextoCrudo(ws.Cell(r, colCod)) : "",
                Descripcion = colDesc > 0 ? GetTextoCrudo(ws.Cell(r, colDesc)) : "",
                Marca = colMarca > 0 ? GetTexto(ws.Cell(r, colMarca)) : null,
                Rubro = colRubro > 0 ? GetTexto(ws.Cell(r, colRubro)) : null,
            };

            if (colStock > 0 && TryGetDecimal(ws.Cell(r, colStock), out var stock))
                fila.Stock = stock;
            if (colCosto > 0 && TryGetDecimal(ws.Cell(r, colCosto), out var costo))
                fila.Costo = costo;
            if (colPrecio > 0 && TryGetDecimal(ws.Cell(r, colPrecio), out var precio))
                fila.Precio = precio;

            filas.Add(fila);
        }

        return filas;
    }

    private static string? GetTexto(IXLCell cell)
    {
        var s = GetTextoCrudo(cell);
        return string.IsNullOrWhiteSpace(s) ? null : s;
    }

    private static string GetTextoCrudo(IXLCell cell)
    {
        if (cell.IsEmpty()) return "";
        if (cell.DataType == XLDataType.Number)
        {
            var raw = cell.GetValue<double>();
            var fmt = cell.Style.NumberFormat.Format ?? "";
            // Formato con ceros adelante (ej "000000", "0000000000000"): respetarlos.
            if (fmt.Contains('0'))
            {
                var digitCount = fmt.Count(c => c == '0');
                var longVal = (long)raw;
                return longVal.ToString().PadLeft(digitCount, '0');
            }
            return raw.ToString();
        }
        return cell.GetFormattedString()?.Trim() ?? "";
    }

    private static bool TryGetDecimal(IXLCell cell, out decimal value)
    {
        value = 0;
        // Si la celda es numérica, tomar el valor directo (sin ambiguity de separadores).
        if (cell.DataType == XLDataType.Number)
        {
            try { value = cell.GetValue<decimal>(); return true; }
            catch { return false; }
        }
        var s = cell.GetFormattedString()?.Trim();
        if (string.IsNullOrWhiteSpace(s)) return false;
        // Texto: quitar separadores de miles (es-AR usa ".") y normalizar la coma decimal a punto.
        s = s.Replace(".", "").Replace(",", ".");
        return decimal.TryParse(s, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out value);
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        _productoService.Eliminar(id);
        return NoContent();
    }

    [HttpPut("{id}")]
    public IActionResult Put(int id, [FromBody] ProductoUpsertDto dto)
    {
        return Ok(_productoService.Modificar(id, dto));
    }

    [HttpGet("marcas-similares")]
    public IActionResult GetMarcasSimilares()
    {
        return Ok(_productoService.ObtenerMarcasSimilares());
    }

    [HttpGet("marcas")]
    public IActionResult GetMarcas()
    {
        return Ok(_productoService.ObtenerMarcas());
    }

    [HttpPut("seguir-stock")]
    public IActionResult SeguirStockGlobal([FromBody] SeguirStockRequest request)
    {
        var afectados = _productoService.SeguirStockGlobal(request.SeguirStock, request.Ids);
        return Ok(new { afectados });
    }

    [HttpPut("{id}/seguir-stock")]
    public IActionResult SeguirStockIndividual(int id, [FromBody] SeguirStockRequest request)
    {
        return Ok(_productoService.SeguirStockIndividual(id, request.SeguirStock));
    }

    [HttpPut("ajuste-marca")]
    public IActionResult AjustarPorMarca([FromBody] AjusteMarcaRequest request)
    {
        try
        {
            var afectados = _productoService.AjustarPreciosPorMarca(request.Marca, request.Porcentaje);
            return Ok(new { afectados });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

public class SeguirStockRequest
{
    public bool SeguirStock { get; set; }
    public List<int>? Ids { get; set; }
}

public class AjusteMarcaRequest
{
    public string Marca { get; set; } = string.Empty;
    public decimal Porcentaje { get; set; }
}
