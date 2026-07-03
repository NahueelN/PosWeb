using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Deudas;
using PosWeb.Application.Exceptions;
using PosWeb.Application.Productos;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Compras;

public class CompraService
{
    private readonly PosDbContext _context;
    private readonly DeudaService _deudaService;
    private readonly ProductoService _productoService;

    public CompraService(PosDbContext context, DeudaService deudaService, ProductoService productoService)
    {
        _context = context;
        _deudaService = deudaService;
        _productoService = productoService;
    }

    /// <summary>
    /// Creates a purchase atomically: Compra → RenglonCompra items → stock update → Gasto → link.
    /// Uses IDbContextTransaction for atomicity when the provider supports it (e.g. MySQL).
    /// </summary>
    public CompraResponseDto CrearCompra(int sucursalId, int proveedorId, int userId,
        List<CompraItemDto> items, DateTime? fechaCompra = null, decimal? montoPagado = null,
        string? fuentePago = null, decimal? montoPagadoCaja = null)
    {
        if (items.Count == 0)
            throw new CompraSinItemsException();

        // InMemory provider (used in tests) doesn't support transactions — skip gracefully
        bool supportsTx = _context.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory";
        using var transaction = supportsTx ? _context.Database.BeginTransaction() : null;

        try
        {
        bool esAhorro = string.Equals(fuentePago, "ahorro", StringComparison.OrdinalIgnoreCase);
        bool esDividir = string.Equals(fuentePago, "dividir", StringComparison.OrdinalIgnoreCase);

        // Validate proveedor exists
        Proveedor? proveedor = _context.Proveedor.Find(proveedorId);
        if (proveedor == null || !proveedor.ACTIVO)
            throw new ProveedorNoEncontradoException(proveedorId);

        // Find active caja for the sucursal (only required for "caja" and "dividir" payments)
        Caja? cajaActiva = null;
        if (!esAhorro)
        {
            cajaActiva = _context.Caja
                .FirstOrDefault(c => c.ID_SUCURSAL == sucursalId && c.ESTADO == "Abierta");

            if (cajaActiva == null)
                throw new CompraSinCajaActivaException();
        }

            // Generate NUMERO_COMPROBANTE: YYYYMMDD + sequential int per day
            DateTime today = fechaCompra?.Date ?? DateTime.Now.Date;
            int maxNumero = _context.Compra
                .Where(c => c.FECHA_COMPRA.Date == today)
                .Select(c => (int?)c.NUMERO_COMPROBANTE)
                .Max() ?? 0;

            int daySeq = today.Year * 10000 + today.Month * 100 + today.Day;
            int numeroComprobante = maxNumero > daySeq * 1000
                ? maxNumero + 1
                : daySeq * 1000 + 1;

            // Create Compra entity
            var compra = new Compra(sucursalId, userId, numeroComprobante, proveedorId);
            _context.Compra.Add(compra);

            var results = new List<CompraItemResultDto>();
            decimal totalGasto = 0;

            foreach (var item in items)
            {
                int productoId = item.ProductoId;

                // INLINE CREATION: item with ProductoId == 0 creates a new product via ProductoService
                if (productoId == 0)
                {
                    var nuevo = _productoService.Crear(new ProductoUpsertDto
                    {
                        CodigoBarra = item.CodigoBarra!,
                        Nombre = item.Nombre!,
                        Precio = item.Precio,
                        Costo = item.Costo ?? 0,
                        CategoriaId = item.CategoriaId,
                        DescAdicional = item.DescAdicional,
                        Contenido = item.Contenido,
                        UnidadMedidaId = item.UnidadMedidaId,
                    });
                    productoId = nuevo.Id;
                }
                else
                {
                    // EXISTING PRODUCT: find and optionally update price / cost
                    var producto = _context.Producto.Find(productoId);
                    if (producto == null || !producto.ACTIVO)
                        throw new ProductoNoEncontradoException(productoId);

                    if (item.Precio > 0 && item.Precio != producto.PRECIO)
                        producto.CambiarPrecio(item.Precio);

                    if (item.Costo.HasValue && item.Costo.Value != producto.COSTO)
                        producto.CambiarCosto(item.Costo.Value);
                }

                // Re-read product (may have been created inline)
                Producto? productoFinal = _context.Producto.Find(productoId);
                if (productoFinal == null || !productoFinal.ACTIVO)
                    throw new ProductoNoEncontradoException(productoId);

                if (productoFinal.SEGUIR_STOCK)
                {
                    StockSucursal? stock = _context.StockSucursal
                        .FirstOrDefault(s => s.ID_PRODUCTO == productoId && s.ID_SUCURSAL == sucursalId);

                    if (stock == null)
                    {
                        stock = new StockSucursal(productoId, sucursalId, 0);
                        _context.StockSucursal.Add(stock);
                    }

                    stock.AumentarStock(item.Cantidad);
                }

                // Create RenglonCompra and add to Compra
                var renglon = new RenglonCompra(productoId, item.Cantidad, item.CostoUnitario);
                compra.AgregarRenglon(renglon);

                decimal subtotal = item.Cantidad * item.CostoUnitario;
                totalGasto += subtotal;

                results.Add(new CompraItemResultDto
                {
                    ProductoId = productoId,
                    ProductoNombre = productoFinal.DESC_PRODUCTO,
                    Cantidad = item.Cantidad,
                    CostoUnitario = item.CostoUnitario,
                    Subtotal = subtotal
                });
            }

            // Create Gasto (skip for "ahorro"; use partial monto for "dividir")
            int? gastoId = null;
            DateTime fechaCompraFinal = fechaCompra ?? DateTime.Now;

            if (!esAhorro && cajaActiva != null)
            {
                decimal montoGasto = esDividir ? (montoPagadoCaja ?? 0) : totalGasto;
                string detalleGasto = $"Compra - {proveedor.NOMBRE}";
                var gasto = new Gasto(cajaActiva.ID_CAJA, montoGasto, detalleGasto, userId);
                _context.Gasto.Add(gasto);
                _context.SaveChanges(); // Save to generate IDs
                compra.AsignarGasto(gasto.ID_GASTO);
                gastoId = gasto.ID_GASTO;
                fechaCompraFinal = gasto.FECHA_GASTO;
            }

            // Create Deuda for the proveedor (with optional partial payment)
            _deudaService.CrearDeuda(proveedorId, compra.ID_COMPRA, totalGasto, montoPagado);

            _context.SaveChanges(); // Final save within transaction

            transaction?.Commit();

            return new CompraResponseDto
            {
                CompraId = compra.ID_COMPRA,
                GastoId = gastoId,
                TotalGasto = totalGasto,
                Fecha = fechaCompraFinal,
                Items = results
            };
        }
        catch
        {
            transaction?.Rollback();
            throw;
        }
    }

    /// <summary>
    /// Legacy wrapper — kept for backward compatibility during transition.
    /// </summary>
    [Obsolete("Use CrearCompra(sucursalId, proveedorId, userId, items) instead")]
    public CompraResponseDto CrearCompra(CompraRequestDto request)
    {
        return CrearCompra(
            request.SucursalId,
            request.ProveedorId,
            request.UserId ?? 0,
            request.Items,
            montoPagado: request.MontoPagado,
            fuentePago: request.FuentePago,
            montoPagadoCaja: request.MontoPagadoCaja
        );
    }
}
