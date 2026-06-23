using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Deudas;
using PosWeb.Application.Exceptions;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Pedidos;

public class PedidoService
{
    private readonly PosDbContext _context;
    private readonly DeudaService _deudaService;

    public PedidoService(PosDbContext context, DeudaService deudaService)
    {
        _context = context;
        _deudaService = deudaService;
    }

    public PedidoDetailDto CrearPedido(PedidoRequestDto request, int userId)
    {
        if (request.Items.Count == 0)
            throw new ArgumentException("El pedido debe tener al menos un producto");

        // Validate proveedor exists
        Proveedor? proveedor = _context.Proveedor.Find(request.ProveedorId);
        if (proveedor == null || !proveedor.ACTIVO)
            throw new ProveedorNoEncontradoException(request.ProveedorId);

        var pedido = new Pedido(
            request.SucursalId,
            request.ProveedorId,
            userId,
            request.FechaEsperada,
            request.Observaciones
        );

        _context.Pedido.Add(pedido);

        foreach (var item in request.Items)
        {
            if (item.ProductoId == 0)
            {
                if (string.IsNullOrWhiteSpace(item.Descripcion))
                    throw new ArgumentException("La descripción es obligatoria para productos sin código");
            }
            else
            {
                Producto? producto = _context.Producto.Find(item.ProductoId);
                if (producto == null || !producto.ACTIVO)
                    throw new ProductoNoEncontradoException(item.ProductoId);
            }

            pedido.AgregarRenglon(item.ProductoId, item.Cantidad, item.PrecioUnitarioEstimado, item.Descripcion);
        }

        _context.SaveChanges();

        return MapToDetail(pedido, proveedor.NOMBRE);
    }

    public PedidoDetailDto RecibirPedido(int pedidoId, RecibirPedidoRequestDto request, int userId)
    {
        // Load pedido with items
        Pedido? pedido = _context.Pedido
            .Include(p => p.RENGLONES)
            .FirstOrDefault(p => p.ID_PEDIDO == pedidoId);

        if (pedido == null)
            throw new ArgumentException("Pedido no encontrado");

        if (pedido.ESTADO != "Pendiente")
            throw new InvalidOperationException(
                pedido.ESTADO == "Completado"
                    ? "El pedido ya fue completado"
                    : "El pedido fue cancelado");

        Proveedor? proveedor = _context.Proveedor.Find(pedido.ID_PROVEEDOR);
        if (proveedor == null)
            throw new ProveedorNoEncontradoException(pedido.ID_PROVEEDOR);

        // Find active caja
        Caja? cajaActiva = _context.Caja
            .FirstOrDefault(c => c.ID_SUCURSAL == pedido.ID_SUCURSAL && c.ESTADO == "Abierta");

        if (cajaActiva == null)
            throw new CompraSinCajaActivaException();

        // Build lookup: renglonPedidoId → RenglonPedido
        var renglonesLookup = pedido.RENGLONES.ToDictionary(r => r.ID_RENGLON_PEDIDO);

        // Split received vs faltante items
        var recibidos = new List<(RenglonPedido Renglon, decimal CantidadRecibida, decimal PrecioReal)>();
        var faltantes = new List<(int ProductoId, string ProductoNombre, decimal CantidadFaltante, decimal PrecioEstimado)>();

        foreach (var item in request.Items)
        {
            if (!renglonesLookup.TryGetValue(item.RenglonPedidoId, out var renglon))
                throw new ArgumentException($"Renglón de pedido no encontrado: {item.RenglonPedidoId}");

            if (item.EsFaltante)
            {
                renglon.MarcarFaltante();
                decimal cantidadFaltante = renglon.CANTIDAD_PEDIDA - item.CantidadRecibida;
                if (cantidadFaltante > 0)
                {
                    string nombre = renglon.DESCRIPCION
                        ?? (renglon.ID_PRODUCTO.HasValue
                            ? _context.Producto.Where(p => p.ID_PRODUCTO == renglon.ID_PRODUCTO.Value).Select(p => p.DESC_PRODUCTO).FirstOrDefault()
                            : null)
                        ?? "Desconocido";
                    faltantes.Add((
                        renglon.ID_PRODUCTO ?? 0,
                        nombre,
                        cantidadFaltante,
                        renglon.PRECIO_UNITARIO_ESTIMADO
                    ));
                }
            }
            else
            {
                renglon.MarcarRecibido();
            }

            if (item.CantidadRecibida > 0 && renglon.ID_PRODUCTO.HasValue)
            {
                recibidos.Add((renglon, item.CantidadRecibida, item.PrecioUnitarioReal));
            }
        }

        // If there are received items, create Compra
        Compra? compra = null;
        if (recibidos.Count > 0)
        {
            // InMemory provider doesn't support transactions
            bool supportsTx = _context.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory";
            using var transaction = supportsTx ? _context.Database.BeginTransaction() : null;

            try
            {
                // Generate NUMERO_COMPROBANTE
                DateTime today = DateTime.Now.Date;
                int maxNumero = _context.Compra
                    .Where(c => c.FECHA_COMPRA.Date == today)
                    .Select(c => (int?)c.NUMERO_COMPROBANTE)
                    .Max() ?? 0;

                int daySeq = today.Year * 10000 + today.Month * 100 + today.Day;
                int numeroComprobante = maxNumero > daySeq * 1000
                    ? maxNumero + 1
                    : daySeq * 1000 + 1;

                compra = new Compra(pedido.ID_SUCURSAL, pedido.ID_USUARIO, numeroComprobante, pedido.ID_PROVEEDOR);
                compra.AsignarPedido(pedido.ID_PEDIDO);
                _context.Compra.Add(compra);

                decimal totalGasto = 0;

                foreach (var (renglon, cantidadRecibida, precioReal) in recibidos)
                {
                    int productoId = renglon.ID_PRODUCTO!.Value;
                    Producto? producto = _context.Producto.Find(productoId);
                    if (producto == null || !producto.ACTIVO)
                        throw new ProductoNoEncontradoException(productoId);

                    // Update stock
                    StockSucursal? stock = _context.StockSucursal
                        .FirstOrDefault(s => s.ID_PRODUCTO == productoId && s.ID_SUCURSAL == pedido.ID_SUCURSAL);

                    if (stock == null)
                    {
                        stock = new StockSucursal(productoId, pedido.ID_SUCURSAL, 0);
                        _context.StockSucursal.Add(stock);
                    }

                    stock.AumentarStock(cantidadRecibida);

                    // Create RenglonCompra with real price
                    var renglonCompra = new RenglonCompra(productoId, cantidadRecibida, precioReal);
                    compra.AgregarRenglon(renglonCompra);

                    decimal subtotal = cantidadRecibida * precioReal;
                    totalGasto += subtotal;
                }

                // Create Gasto
                string detalleGasto = $"Compra (Pedido #{pedido.ID_PEDIDO}) - {proveedor.NOMBRE}";
                var gasto = new Gasto(cajaActiva.ID_CAJA, totalGasto, detalleGasto, userId);
                _context.Gasto.Add(gasto);
                _context.SaveChanges();

                compra.AsignarGasto(gasto.ID_GASTO);

                // Create Deuda
                _deudaService.CrearDeuda(pedido.ID_PROVEEDOR, compra.ID_COMPRA, totalGasto, montoPagado: null);

                _context.SaveChanges();
                transaction?.Commit();
            }
            catch
            {
                transaction?.Rollback();
                throw;
            }
        }

        // Complete the pedido
        pedido.Completar();
        _context.SaveChanges();

        return MapToDetail(pedido, proveedor.NOMBRE);
    }

    public List<PedidoListDto> Listar(string? proveedorSearch = null, string? estado = null)
    {
        IQueryable<Pedido> query = _context.Pedido
            .Include(p => p.RENGLONES)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(proveedorSearch))
        {
            string search = proveedorSearch.Trim().ToLower();
            query = query.Where(p =>
                _context.Proveedor
                    .Where(prov => prov.ID_PROVEEDOR == p.ID_PROVEEDOR)
                    .Any(prov => prov.NOMBRE.ToLower().Contains(search)
                              || prov.COD_PROVEEDOR.ToLower().Contains(search)));
        }

        if (!string.IsNullOrWhiteSpace(estado))
        {
            query = query.Where(p => p.ESTADO == estado);
        }

        return query
            .OrderByDescending(p => p.FECHA_PEDIDO)
            .Select(p => new PedidoListDto
            {
                Id = p.ID_PEDIDO,
                ProveedorNombre = _context.Proveedor
                    .Where(prov => prov.ID_PROVEEDOR == p.ID_PROVEEDOR)
                    .Select(prov => prov.NOMBRE)
                    .FirstOrDefault() ?? "—",
                Total = p.TOTAL,
                Fecha = p.FECHA_PEDIDO,
                FechaEsperada = p.FECHA_ESPERADA,
                Estado = p.ESTADO,
                CantidadItems = p.RENGLONES.Count
            })
            .ToList();
    }

    public PedidoDetailDto Obtener(int pedidoId)
    {
        Pedido? pedido = _context.Pedido
            .Include(p => p.RENGLONES)
            .FirstOrDefault(p => p.ID_PEDIDO == pedidoId);

        if (pedido == null)
            throw new ArgumentException("Pedido no encontrado");

        Proveedor? proveedor = _context.Proveedor.Find(pedido.ID_PROVEEDOR);
        return MapToDetail(pedido, proveedor?.NOMBRE ?? "—");
    }

    public void Cancelar(int pedidoId)
    {
        Pedido? pedido = _context.Pedido.Find(pedidoId);
        if (pedido == null)
            throw new ArgumentException("Pedido no encontrado");

        pedido.Cancelar();
        _context.SaveChanges();
    }

    private PedidoDetailDto MapToDetail(Pedido pedido, string proveedorNombre)
    {
        return new PedidoDetailDto
        {
            Id = pedido.ID_PEDIDO,
            ProveedorNombre = proveedorNombre,
            Fecha = pedido.FECHA_PEDIDO,
            FechaEsperada = pedido.FECHA_ESPERADA,
            Total = pedido.TOTAL,
            Estado = pedido.ESTADO,
            IdPedidoOrigen = pedido.ID_PEDIDO_ORIGEN,
            Items = pedido.RENGLONES.Select(r =>
            {
                Producto? prod = r.ID_PRODUCTO.HasValue ? _context.Producto.Find(r.ID_PRODUCTO.Value) : null;
                return new PedidoItemDetailDto
                {
                    Id = r.ID_RENGLON_PEDIDO,
                    ProductoId = r.ID_PRODUCTO ?? 0,
                    ProductoNombre = r.DESCRIPCION ?? prod?.DESC_PRODUCTO ?? "—",
                    CodigoBarra = prod?.CODIGO_BARRAS ?? "—",
                    CantidadPedida = r.CANTIDAD_PEDIDA,
                    PrecioUnitarioEstimado = r.PRECIO_UNITARIO_ESTIMADO,
                    Subtotal = r.SUBTOTAL,
                    Estado = r.ESTADO,
                    Descripcion = r.DESCRIPCION
                };
            }).ToList()
        };
    }
}
