using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Deudas;
using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Compras;

public class CompraService
{
    private readonly PosDbContext _context;
    private readonly DeudaService _deudaService;

    public CompraService(PosDbContext context, DeudaService deudaService)
    {
        _context = context;
        _deudaService = deudaService;
    }

    /// <summary>
    /// Creates a purchase atomically: Compra → RenglonCompra items → stock update → Gasto → link.
    /// Uses IDbContextTransaction for atomicity when the provider supports it (e.g. MySQL).
    /// </summary>
    public CompraResponseDto CrearCompra(int sucursalId, int proveedorId, int userId,
        List<CompraItemDto> items, DateTime? fechaCompra = null)
    {
        if (items.Count == 0)
            throw new CompraSinItemsException();

        // InMemory provider (used in tests) doesn't support transactions — skip gracefully
        bool supportsTx = _context.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory";
        using var transaction = supportsTx ? _context.Database.BeginTransaction() : null;

        try
        {
            // Validate proveedor exists
            Proveedor? proveedor = _context.Proveedores.Find(proveedorId);
            if (proveedor == null || !proveedor.ACTIVO)
                throw new ProveedorNoEncontradoException(proveedorId);

            // Find active caja for the sucursal
            Caja? cajaActiva = _context.Cajas
                .FirstOrDefault(c => c.ID_SUCURSAL == sucursalId && c.ESTADO == "Abierta");

            if (cajaActiva == null)
                throw new CompraSinCajaActivaException();

            // Generate NUMERO_COMPROBANTE: YYYYMMDD + sequential int per day
            DateTime today = fechaCompra?.Date ?? DateTime.Now.Date;
            int maxNumero = _context.Compras
                .Where(c => c.FECHA_COMPRA.Date == today)
                .Select(c => (int?)c.NUMERO_COMPROBANTE)
                .Max() ?? 0;

            int daySeq = today.Year * 10000 + today.Month * 100 + today.Day;
            int numeroComprobante = maxNumero > daySeq * 1000
                ? maxNumero + 1
                : daySeq * 1000 + 1;

            // Create Compra entity
            var compra = new Compra(sucursalId, userId, numeroComprobante, proveedorId);
            _context.Compras.Add(compra);

            var results = new List<CompraItemResultDto>();
            decimal totalGasto = 0;

            foreach (var item in items)
            {
                int productoId = item.ProductoId;

                // INLINE CREATION: item with ProductoId == 0 creates a new product
                if (productoId == 0)
                {
                    if (string.IsNullOrWhiteSpace(item.CodigoBarra))
                        throw new ArgumentException("El código de barras es obligatorio para crear un producto nuevo");

                    if (string.IsNullOrWhiteSpace(item.Nombre))
                        throw new ArgumentException("El nombre es obligatorio para crear un producto nuevo");

                    // Check duplicate barcode
                    bool codigoExiste = _context.Productos
                        .Any(p => p.CODIGO_BARRAS == item.CodigoBarra && p.ACTIVO);

                    if (codigoExiste)
                        throw new ProductoCodigoDuplicadoException(item.CodigoBarra);

                    var nuevoProducto = new Producto(
                        item.CodigoBarra,
                        item.CodigoBarra,
                        item.Nombre,
                        item.Precio,
                        item.Costo ?? 0
                    );
                    _context.Productos.Add(nuevoProducto);
                    _context.SaveChanges(); // Generate ID within transaction
                    productoId = nuevoProducto.ID_PRODUCTO;
                }
                else
                {
                    // EXISTING PRODUCT: find and optionally update price / cost
                    var producto = _context.Productos.Find(productoId);
                    if (producto == null || !producto.ACTIVO)
                        throw new ProductoNoEncontradoException(productoId);

                    if (item.Precio > 0 && item.Precio != producto.PRECIO)
                        producto.CambiarPrecio(item.Precio);

                    if (item.Costo.HasValue && item.Costo.Value != producto.COSTO)
                        producto.CambiarCosto(item.Costo.Value);
                }

                // Re-read product (may have been created inline)
                Producto? productoFinal = _context.Productos.Find(productoId);
                if (productoFinal == null || !productoFinal.ACTIVO)
                    throw new ProductoNoEncontradoException(productoId);

                // Find or create StockSucursal row
                StockSucursal? stock = _context.StockSucursales
                    .FirstOrDefault(s => s.ID_PRODUCTO == productoId && s.ID_SUCURSAL == sucursalId);

                if (stock == null)
                {
                    stock = new StockSucursal(productoId, sucursalId, 0);
                    _context.StockSucursales.Add(stock);
                }

                stock.AumentarStock(item.Cantidad);

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

            // Create Gasto linked to active caja with ID_COMPRA
            string detalleGasto = $"Compra - {proveedor.NOMBRE}";
            var gasto = new Gasto(cajaActiva.ID_CAJA, totalGasto, detalleGasto);
            _context.Gastos.Add(gasto);
            _context.SaveChanges(); // Save to generate IDs

            // Link Gasto back to Compra
            compra.AsignarGasto(gasto.ID_GASTO);

            // Create Deuda for the proveedor
            _deudaService.CrearDeuda(proveedorId, compra.ID_COMPRA, totalGasto);

            _context.SaveChanges(); // Final save within transaction

            transaction?.Commit();

            return new CompraResponseDto
            {
                CompraId = compra.ID_COMPRA,
                GastoId = gasto.ID_GASTO,
                TotalGasto = totalGasto,
                Fecha = gasto.FECHA_GASTO,
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
            request.Items
        );
    }
}
