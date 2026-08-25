using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;
using PosWeb.Domain.Exceptions;
using Microsoft.EntityFrameworkCore;

namespace PosWeb.Application.Productos;

public class ProductoService
{
    private readonly PosDbContextLocal _context;

    public ProductoService(PosDbContextLocal context)
    {
        _context = context;
    }

    public List<ProductoDto> ObtenerActivos(int? sucursalId = null, bool? esPesable = null, bool? esBulto = null)
    {
        var query = _context.Producto
            .Where(p => p.ACTIVO);

        if (esPesable.HasValue)
        {
            query = query.Where(p => p.ES_PESABLE == esPesable.Value);
        }

        if (esBulto.HasValue)
        {
            query = query.Where(p => p.ES_BULTO == esBulto.Value);
        }

        var projected = query.OrderBy(p => p.DESC_PRODUCTO)
            .Select(p => new ProductoDto
            {
                Id = p.ID_PRODUCTO,
                CodigoBarra = p.CODIGO_BARRAS,
                Nombre = p.DESC_PRODUCTO,
                Precio = p.PRECIO,
                Costo = p.COSTO,
                Activo = p.ACTIVO,
                Marca = p.MARCA,
                Contenido = p.CONTENIDO,
                CategoriaId = p.ID_CATEGORIA,
                UnidadMedidaId = p.ID_UNIDAD_MEDIDA,
                DescAdicional = p.DESC_ADICIONAL,
                CodigoProducto = p.COD_PRODUCTO,
                MargenGanancia = p.MARGEN_GANANCIA,
                SeguirStock = p.SEGUIR_STOCK,
                EsPesable = p.ES_PESABLE,
                EsBulto = p.ES_BULTO,
                ProductoBultoId = p.ID_PRODUCTO_BULTO
            });

        if (sucursalId.HasValue)
        {
            var stockDict = _context.StockSucursal
                .Where(s => s.ID_SUCURSAL == sucursalId.Value)
                .ToDictionary(s => s.ID_PRODUCTO, s => s.STOCK);

            var result = projected.ToList();
            foreach (var p in result)
            {
                p.Stock = stockDict.TryGetValue(p.Id, out var s) ? s : 0;
            }
            return result;
        }

        return projected.ToList();
    }

    public ProductoDetailDto? ObtenerDetalle(int id, int? sucursalId = null)
    {
        var query = _context.Producto
            .Where(p => p.ID_PRODUCTO == id && p.ACTIVO);

        var result = query.Select(p => new ProductoDetailDto
        {
            Id = p.ID_PRODUCTO,
            CodigoBarra = p.CODIGO_BARRAS,
            CodProducto = p.COD_PRODUCTO,
            Nombre = p.DESC_PRODUCTO,
            Precio = p.PRECIO,
            Costo = p.COSTO,
            Stock = sucursalId.HasValue
                ? _context.StockSucursal
                    .Where(s => s.ID_PRODUCTO == p.ID_PRODUCTO && s.ID_SUCURSAL == sucursalId.Value)
                    .Select(s => s.STOCK)
                    .FirstOrDefault()
                : 0,
            DescAdicional = p.DESC_ADICIONAL,
            Contenido = p.CONTENIDO,
            Tamano = null,
            FechaAlta = p.FECHA_ALTA,
            FechaUltimaMod = p.FECHA_ULTIMA_MOD,
            FechaBaja = p.FECHA_BAJA,
            Activo = p.ACTIVO,
            EsBulto = p.ES_BULTO,
            ProductoBultoId = p.ID_PRODUCTO_BULTO,
            ProductoBultoNombre = p.ID_PRODUCTO_BULTO.HasValue
                ? _context.Producto.Where(u => u.ID_PRODUCTO == p.ID_PRODUCTO_BULTO.Value).Select(u => u.DESC_PRODUCTO).FirstOrDefault()
                : null
        }).FirstOrDefault();

        if (result == null) return null;

        // Resolve categoria
        var prod = query.First();
        if (prod.ID_CATEGORIA.HasValue)
        {
            var cat = _context.Categoria.Find(prod.ID_CATEGORIA.Value);
            result.Categoria = cat?.DESC_CATEGORIA;
        }
        if (prod.ID_UNIDAD_MEDIDA.HasValue)
        {
            var um = _context.UnidadMedida.Find(prod.ID_UNIDAD_MEDIDA.Value);
            result.UnidadMedida = um?.DESC_UNIDAD_MEDIDA;
        }

        return result;
    }

    public ProductoDto Crear(ProductoUpsertDto dto)
    {
        if (!string.IsNullOrWhiteSpace(dto.CodigoBarra))
        {
            bool codigoExiste = _context.Producto
                .Any(p => p.CODIGO_BARRAS == dto.CodigoBarra && p.ACTIVO);

            if (codigoExiste)
            {
                throw new ProductoCodigoDuplicadoException(dto.CodigoBarra);
            }
        }

        string codProducto = !string.IsNullOrWhiteSpace(dto.CodigoProducto)
            ? dto.CodigoProducto.Trim()
            : ObtenerSiguienteCodigo();

        bool tieneCodigoBarras = !string.IsNullOrWhiteSpace(dto.CodigoBarra);
        bool tieneCodigoProducto = !string.IsNullOrWhiteSpace(dto.CodigoProducto);

        if (!tieneCodigoBarras && !tieneCodigoProducto && !dto.EsBulto)
        {
            throw new CodigoBarraInvalidoException("debe proporcionar código de barras o código personalizado");
        }

        // Validar que el código interno no exista ya entre los activos (el índice único
        // de COD_PRODUCTO está filtrado por ACTIVO, así que un inactivo no bloquea reuso)
        bool codigoProductoExiste = _context.Producto
            .Any(p => p.COD_PRODUCTO == codProducto && p.ACTIVO);

        if (codigoProductoExiste)
        {
            throw new CodigoProductoDuplicadoException(codProducto);
        }

        // Auto-fill margen from categoria if not explicitly provided
        decimal? margen = dto.MargenGanancia;
        if (!margen.HasValue && dto.CategoriaId.HasValue)
        {
            margen = _context.Categoria
                .Where(c => c.ID_CATEGORIA == dto.CategoriaId.Value)
                .Select(c => c.MARGEN_GANANCIA)
                .FirstOrDefault();
        }

        Producto producto = new Producto(
            codProducto,
            dto.CodigoBarra,
            dto.Nombre,
            dto.Precio,
            dto.Costo,
            dto.CategoriaId,
            dto.DescAdicional,
            dto.Contenido,
            dto.UnidadMedidaId,
            dto.Marca,
            margen,
            dto.EsPesable,
            dto.EsBulto,
            dto.EsBulto ? dto.ProductoBultoId : null
        );

        _context.Producto.Add(producto);
        _context.SaveChanges();

        return MapToDto(producto);
    }

    /// <summary>
    /// Devuelve el próximo código interno disponible (PROD + numérico secuencial, o "PROD1" si no hay).
    /// </summary>
    public string ObtenerSiguienteCodigo()
        => $"PROD{ObtenerSiguienteCodigoNumero() + 1}";

    public ProductoDto ObtenerPorCodigoBarra(string codigoBarras)
    {
        return ObtenerPorCodigoBarra(codigoBarras, sucursalId: null);
    }

    public ProductoDto ObtenerPorCodigoBarra(string codigoBarras, int? sucursalId)
    {
        if (string.IsNullOrWhiteSpace(codigoBarras))
        {
            throw new CodigoBarraRequeridoException();
        }

        Producto? producto = _context.Producto
            .FirstOrDefault(p => p.CODIGO_BARRAS == codigoBarras && p.ACTIVO);

        if (producto == null)
        {
            throw new ProductoNoEncontradoException(codigoBarras);
        }

        var dto = MapToDto(producto);

        if (sucursalId.HasValue)
        {
            StockSucursal? stock = _context.StockSucursal
                .FirstOrDefault(s => s.ID_PRODUCTO == producto.ID_PRODUCTO && s.ID_SUCURSAL == sucursalId.Value);
            dto.Stock = stock?.STOCK ?? 0;
        }

        return dto;
    }

    public void Eliminar(int id)
    {
        Producto? producto = _context.Producto.Find(id);

        if (producto == null)
        {
            throw new ProductoNoEncontradoException(id);
        }

        producto.Desactivar();
        _context.SaveChanges();
    }

    private static ProductoDto MapToDto(Producto producto)
    {
        return new ProductoDto
        {
            Id = producto.ID_PRODUCTO,
            CodigoBarra = producto.CODIGO_BARRAS,
            Nombre = producto.DESC_PRODUCTO,
            Precio = producto.PRECIO,
            Costo = producto.COSTO,
            Activo = producto.ACTIVO,
            Marca = producto.MARCA,
            Contenido = producto.CONTENIDO,
            CategoriaId = producto.ID_CATEGORIA,
            UnidadMedidaId = producto.ID_UNIDAD_MEDIDA,
            DescAdicional = producto.DESC_ADICIONAL,
            CodigoProducto = producto.COD_PRODUCTO,
            MargenGanancia = producto.MARGEN_GANANCIA,
            SeguirStock = producto.SEGUIR_STOCK,
            EsPesable = producto.ES_PESABLE,
            EsBulto = producto.ES_BULTO,
            ProductoBultoId = producto.ID_PRODUCTO_BULTO
        };
    }

    public ProductoDto Modificar(int id, ProductoUpsertDto dto)
    {
        Producto? producto = _context.Producto.Find(id);
        
        if (producto == null)
        {
            throw new ProductoNoEncontradoException(id);
        }

        producto.CambiarEsPesable(dto.EsPesable);
        producto.CambiarEsBulto(dto.EsBulto, dto.EsBulto ? dto.ProductoBultoId : null);
        
        if (!string.IsNullOrWhiteSpace(dto.CodigoBarra))
        {
            bool codigoDuplicado = _context.Producto
                .Any(p => p.CODIGO_BARRAS == dto.CodigoBarra
                          && p.ID_PRODUCTO != id
                          && p.ACTIVO);

            if (codigoDuplicado)
            {
                throw new ProductoCodigoDuplicadoException(dto.CodigoBarra);
            }
        }

        producto.CambiarCodigoBarras(dto.CodigoBarra);
        producto.CambiarDescripcion(dto.Nombre);
        producto.CambiarPrecio(dto.Precio, dto.EsBulto);
        producto.CambiarCosto(dto.Costo, dto.EsBulto);
        producto.CambiarMarca(dto.Marca);
        producto.CambiarCategoria(dto.CategoriaId);
        producto.CambiarContenido(dto.Contenido);
        producto.CambiarUnidadMedida(dto.UnidadMedidaId);
        producto.CambiarDescAdicional(dto.DescAdicional);
        producto.CambiarMargen(dto.MargenGanancia);
        if (dto.SeguirStock.HasValue) producto.CambiarSeguirStock(dto.SeguirStock.Value);
        
        _context.SaveChanges();
        
        return MapToDto(producto);
    }

    public List<ProductoDto> BuscarPorNombre(string term)
    {
        if (string.IsNullOrWhiteSpace(term))
        {
            return new List<ProductoDto>();
        }

        return _context.Producto
            .Where(p => p.ACTIVO && (EF.Functions.Like(p.DESC_PRODUCTO, $"%{term}%") || EF.Functions.Like(p.CODIGO_BARRAS, $"%{term}%")))
            .OrderBy(p => p.DESC_PRODUCTO)
            .Select(p => new ProductoDto
            {
                Id = p.ID_PRODUCTO,
                CodigoBarra = p.CODIGO_BARRAS,
                Nombre = p.DESC_PRODUCTO,
                Precio = p.PRECIO,
                Costo = p.COSTO,
                Activo = p.ACTIVO,
                EsPesable = p.ES_PESABLE
            })
            .ToList();
    }

    public List<ProductoDto> BuscarParaVenta(string term, int sucursalId)
    {
        if (string.IsNullOrWhiteSpace(term))
        {
            return new List<ProductoDto>();
        }

        string pattern = $"%{term}%";

        return _context.Producto
            .Where(p => p.ACTIVO && !p.ES_BULTO && (EF.Functions.Like(p.DESC_PRODUCTO, pattern) || EF.Functions.Like(p.CODIGO_BARRAS, pattern)))
            .OrderBy(p => p.DESC_PRODUCTO)
            .Select(p => new ProductoDto
            {
                Id = p.ID_PRODUCTO,
                CodigoBarra = p.CODIGO_BARRAS,
                Nombre = p.DESC_PRODUCTO,
                Precio = p.PRECIO,
                Costo = p.COSTO,
                    Stock = _context.StockSucursal
                        .Where(s => s.ID_PRODUCTO == p.ID_PRODUCTO && s.ID_SUCURSAL == sucursalId)
                        .Select(s => s.STOCK)
                        .FirstOrDefault(),
                    Activo = p.ACTIVO,
                    EsPesable = p.ES_PESABLE,
                    EsBulto = p.ES_BULTO,
                    ProductoBultoId = p.ID_PRODUCTO_BULTO
            })
            .ToList();
    }

    /// <summary>
    /// Importa productos desde un Excel (formato articulos.xls). CREATE-ONLY:
    /// saltea filas con código de barras vacío/no numérico, duplicados en DB,
    /// duplicados en el propio archivo, y reporta todos los saltos.
    /// </summary>
    public ProductoImportResponseDto ImportarProductos(List<ProductoImportFila> filas, int? sucursalId, bool importarSinCodigo = false)
    {
        var response = new ProductoImportResponseDto { Total = filas.Count };

        const int maxErrores = 200;

        // Categorías nuevas creadas en el pre-pase; tras SaveChanges se les lee su ID real.
        var pendientesCategorias = new List<(string Rubro, string CodCat, Categoria Entidad)>();

        // Códigos de barras ya existentes en DB (activos), case-insensitive.
        var existentes = _context.Producto
            .Where(p => p.ACTIVO)
            .Select(p => p.CODIGO_BARRAS)
            .AsEnumerable()
            .Select(c => (c ?? "").Trim())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        // Categorías: indexar por DESC_CATEGORIA (trim, case-insensitive) y por COD_CATEGORIA (uppercase).
        var cats = _context.Categoria.ToList();
        var catPorDesc = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var catPorCodigo = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var c in cats)
        {
            catPorDesc[c.DESC_CATEGORIA.Trim()] = c.ID_CATEGORIA;
            catPorCodigo[c.COD_CATEGORIA.Trim().ToUpperInvariant()] = c.ID_CATEGORIA;
        }

        // Pre-pase: resolver/crear TODAS las categorías nuevas en una sola pasada.
        // Se persisten con un único SaveChanges para que tengan IDs reales antes de crear productos
        // (los productos referencian ID_CATEGORIA, que debe existir como FK válida).
        var rubrosUnicos = filas
            .Select(f => f.Rubro)
            .Where(r => !string.IsNullOrWhiteSpace(r))
            .Select(r => r!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        bool creoCategorias = false;
        foreach (var rubro in rubrosUnicos)
        {
            if (catPorDesc.ContainsKey(rubro)) continue;
            string codCat = new string(rubro.Where(c => !char.IsWhiteSpace(c)).ToArray()).ToUpperInvariant();
            if (catPorCodigo.ContainsKey(codCat)) continue;

            var nueva = new Categoria(codCat, rubro);
            _context.Categoria.Add(nueva);
            // No SaveChanges por categoría: esperamos a tenerlas todas y persistimos una vez.
            // Guardamos temporalmente la entidad; tras SaveChanges obtendrá su ID real.
            catPorDesc[rubro] = 0; // marcador; se reemplaza tras SaveChanges
            // Guardamos la entidad para poder leer su ID generado después.
            pendientesCategorias.Add((rubro, codCat, nueva));
            creoCategorias = true;
        }
        if (creoCategorias)
        {
            _context.SaveChanges();
            foreach (var (rubro, codCat, nueva) in pendientesCategorias)
            {
                catPorDesc[rubro] = nueva.ID_CATEGORIA;
                catPorCodigo[codCat] = nueva.ID_CATEGORIA;
            }
        }

        // Próximo COD_PRODUCTO secuencial (PROD{n}) — base max actual + 1 + contador en memoria.
        int nextCod = ObtenerSiguienteCodigoNumero() + 1;

        var vistosEnImport = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        // Productos creados + su stock pendiente (se persiste tras el SaveChanges de productos,
        // porque StockSucursal necesita el ID_PRODUCTO generado por EF).
        var creadosConStock = new List<(Producto Producto, decimal Stock)>();

        for (int i = 0; i < filas.Count; i++)
        {
            var fila = filas[i];
            int numeroFila = i + 2; // fila 1 = header en el Excel

            string codigoBarras = (fila.CodigoBarras ?? "").Trim();
            string descripcion = (fila.Descripcion ?? "").Trim();

            // Código de barras: si está vacío o tiene caracteres no numéricos.
            bool codigoValido = !string.IsNullOrWhiteSpace(codigoBarras) && codigoBarras.All(char.IsDigit);
            if (!codigoValido)
            {
                if (importarSinCodigo)
                {
                    // Importar SIN código de barras (se autogenera el código interno PROD{n}).
                    codigoBarras = "";
                }
                else
                {
                    AddError(response, numeroFila, "Código de barras vacío o no numérico", maxErrores, fila);
                    continue;
                }
            }
            else
            {
                // Duplicado en DB.
                if (existentes.Contains(codigoBarras))
                {
                    AddError(response, numeroFila, "Código de barras ya existente", maxErrores, fila);
                    continue;
                }

                // Duplicado en el propio archivo.
                if (!vistosEnImport.Add(codigoBarras))
                {
                    AddError(response, numeroFila, "Código de barras duplicado en el archivo", maxErrores, fila);
                    continue;
                }
            }

            // Descripción requerida.
            if (string.IsNullOrWhiteSpace(descripcion))
            {
                AddError(response, numeroFila, "Descripción requerida", maxErrores, fila);
                continue;
            }

            // Precio: debe ser > 0 (el constructor de Producto lanza si precio <= 0 y no es bulto).
            if (!fila.Precio.HasValue || fila.Precio.Value <= 0)
            {
                AddError(response, numeroFila, "Precio inválido", maxErrores, fila);
                continue;
            }

            // Costo: default 0; negativos se clampean a 0 (producto no admite negativos).
            decimal costo = fila.Costo.HasValue ? Math.Max(0, fila.Costo.Value) : 0m;

            // Rubro -> Categoria: ya todas resueltas en el pre-pase (IDs reales).
            int? categoriaId = null;
            if (!string.IsNullOrWhiteSpace(fila.Rubro))
            {
                string rubro = fila.Rubro!.Trim();
                catPorDesc.TryGetValue(rubro, out var idDesc);
                if (idDesc > 0)
                {
                    categoriaId = idDesc;
                }
                else
                {
                    string codCat = new string(rubro.Where(c => !char.IsWhiteSpace(c)).ToArray()).ToUpperInvariant();
                    catPorCodigo.TryGetValue(codCat, out var idCod);
                    if (idCod > 0) categoriaId = idCod;
                }
            }

            string? marca = string.IsNullOrWhiteSpace(fila.Marca) ? null : fila.Marca.Trim();

            string codProducto = $"PROD{nextCod++}";

            var producto = new Producto(
                codProducto,
                codigoBarras,
                descripcion,
                fila.Precio.Value,
                costo,
                categoriaId,
                null,
                null,
                null,
                marca,
                null,
                false,
                false,
                null);

            _context.Producto.Add(producto);

            if (fila.SeguirStock.HasValue)
            {
                producto.CambiarSeguirStock(fila.SeguirStock.Value);
            }

            // Si el producto no controla stock, no se le crea fila de StockSucursal.
            bool controlaStock = !fila.SeguirStock.HasValue || fila.SeguirStock.Value;
            if (sucursalId.HasValue && controlaStock)
            {
                creadosConStock.Add((producto, fila.Stock ?? 0m));
            }

            response.Creados++;
        }

        // Fase 1: persistir productos -> EF genera los ID_PRODUCTO.
        _context.SaveChanges();

        // Fase 2: crear StockSucursal por sucursal usando los IDs ya generados.
        // Se crea una fila por cada producto creado (incluso con stock 0) para que
        // quede "inicializado" para la sucursal (StockSucursalService marca inicializado
        // según exista la fila). Los negativos se clampean a 0 (el dominio no admite <0).
        if (sucursalId.HasValue && creadosConStock.Count > 0)
        {
            foreach (var (prod, stock) in creadosConStock)
            {
                decimal stockFinal = Math.Max(0, stock);
                var ss = new StockSucursal(prod.ID_PRODUCTO, sucursalId.Value, stockFinal);
                _context.StockSucursal.Add(ss);
            }
            _context.SaveChanges();
        }

        response.Saltados = response.Total - response.Creados;
        return response;
    }

    private static void AddError(ProductoImportResponseDto response, int fila, string motivo, int maxErrores, ProductoImportFila datos)
    {
        if (response.Errores.Count < maxErrores)
        {
            response.Errores.Add(new ProductoImportErrorDto { Fila = fila, Motivo = motivo, Datos = datos });
        }
    }

    /// <summary>
    /// Devuelve el número máximo actual de COD_PRODUCTO (PROD{n}) entre productos activos.
    /// Usado por ImportarProductos para evitar llamar a ObtenerSiguienteCodigo() por fila.
    /// </summary>
    private int ObtenerSiguienteCodigoNumero()
    {
        var todos = _context.Producto
            .Where(p => p.ACTIVO && p.COD_PRODUCTO.StartsWith("PROD"))
            .Select(p => p.COD_PRODUCTO)
            .ToList();

        var numericos = todos
            .Select(c => c.Length > 4 && int.TryParse(c.Substring(4), out var n) ? n : (int?)null)
            .Where(n => n.HasValue)
            .Select(n => n.Value);

        return numericos.Any() ? numericos.Max() : 0;
    }

    public List<GrupoMarcasDto> ObtenerMarcasSimilares()
    {
        var marcas = _context.Producto
            .Where(p => p.ACTIVO && p.MARCA != null && p.MARCA != "")
            .Select(p => p.MARCA!)
            .Distinct()
            .OrderBy(m => m)
            .ToList();

        if (marcas.Count == 0) return new List<GrupoMarcasDto>();

        var parent = new Dictionary<string, string>();
        foreach (var m in marcas) parent[m] = m;

        string Find(string x)
        {
            if (parent[x] != x) parent[x] = Find(parent[x]);
            return parent[x];
        }

        void Union(string a, string b)
        {
            var ra = Find(a);
            var rb = Find(b);
            if (ra != rb) parent[rb] = ra;
        }

        for (int i = 0; i < marcas.Count; i++)
        {
            for (int j = i + 1; j < marcas.Count; j++)
            {
                if (LevenshteinDistancia(marcas[i], marcas[j]) <= 1)
                {
                    Union(marcas[i], marcas[j]);
                }
            }
        }

        var grupos = parent
            .GroupBy(kv => Find(kv.Key))
            .Select(g => new GrupoMarcasDto
            {
                Marcas = g.Select(kv => kv.Key).OrderBy(m => m).ToList()
            })
            .Where(g => g.Marcas.Count > 1)
            .OrderBy(g => g.Marcas.First())
            .ToList();

        return grupos;
    }

    private static int LevenshteinDistancia(string a, string b)
    {
        if (a.Length == 0) return b.Length;
        if (b.Length == 0) return a.Length;

        var dist = new int[a.Length + 1, b.Length + 1];
        for (int i = 0; i <= a.Length; i++) dist[i, 0] = i;
        for (int j = 0; j <= b.Length; j++) dist[0, j] = j;

        for (int i = 1; i <= a.Length; i++)
        {
            for (int j = 1; j <= b.Length; j++)
            {
                int costo = a[i - 1] == b[j - 1] ? 0 : 1;
                dist[i, j] = Math.Min(
                    Math.Min(dist[i - 1, j] + 1, dist[i, j - 1] + 1),
                    dist[i - 1, j - 1] + costo);
            }
        }

        return dist[a.Length, b.Length];
    }

    public List<string> ObtenerMarcas()
    {
        return _context.Producto
            .Where(p => p.ACTIVO && p.MARCA != null && p.MARCA != "")
            .Select(p => p.MARCA!)
            .Distinct()
            .OrderBy(m => m)
            .ToList();
    }

    public ProductoDto SeguirStockIndividual(int id, bool seguir)
    {
        Producto? producto = _context.Producto.Find(id);

        if (producto == null)
        {
            throw new ProductoNoEncontradoException(id);
        }

        producto.CambiarSeguirStock(seguir);
        _context.SaveChanges();

        return MapToDto(producto);
    }

    public int SeguirStockGlobal(bool seguir, List<int>? idsAReactivar = null)
    {
        IQueryable<Producto> query = _context.Producto.Where(p => p.ACTIVO);

        if (seguir && idsAReactivar != null)
        {
            query = query.Where(p => idsAReactivar.Contains(p.ID_PRODUCTO));
        }

        var productos = query.ToList();
        foreach (var p in productos)
        {
            p.CambiarSeguirStock(seguir);
        }

        _context.SaveChanges();
        return productos.Count;
    }

    public int AjustarPreciosPorMarca(string marca, decimal porcentaje)
    {
        if (string.IsNullOrWhiteSpace(marca))
            throw new ArgumentException("La marca es requerida");

        if (porcentaje <= 0)
            throw new ArgumentException("El porcentaje debe ser mayor a 0");

        // Find similar brands (Levenshtein ≤ 1)
        var todasLasMarcas = _context.Producto
            .Where(p => p.ACTIVO && p.MARCA != null && p.MARCA != "")
            .Select(p => p.MARCA!)
            .Distinct()
            .ToList();

        var marcasAfectadas = todasLasMarcas
            .Where(m => LevenshteinDistancia(marca, m) <= 1)
            .ToList();

        var productos = _context.Producto
            .Where(p => p.ACTIVO && marcasAfectadas.Contains(p.MARCA))
            .ToList();

        decimal factor = 1 + (porcentaje / 100);

        foreach (var p in productos)
        {
            p.CambiarCosto(Math.Round(p.COSTO * factor, 2));
            p.CambiarPrecio(Math.Round(p.PRECIO * factor, 2));
        }

        _context.SaveChanges();
        return productos.Count;
    }
}
