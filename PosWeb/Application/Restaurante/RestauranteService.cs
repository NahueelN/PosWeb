using Microsoft.EntityFrameworkCore;
using PosWeb.Application.Exceptions;
using PosWeb.Application.Ventas;
using PosWeb.Contracts;
using PosWeb.Data;
using PosWeb.Domain;

namespace PosWeb.Application.Restaurante;

/// <summary>
/// Segmento restaurante: mesas, cuentas (sesiones de mesa), comandas y cobro.
/// La venta que genera el cobro de una mesa reusa el flujo de venta de mostrador
/// (caja, medios de pago, vuelto, cliente/deuda, QR) pero sin descontar stock.
/// </summary>
public class RestauranteService
{
    private readonly PosDbContextLocal _context;
    private readonly VentaService _ventaService;

    public RestauranteService(PosDbContextLocal context, VentaService ventaService)
    {
        _context = context;
        _ventaService = ventaService;
    }

    // ---------- Configuración del módulo ----------

    public bool ObtenerRestauranteHabilitado()
    {
        var config = _context.EmpresaConfiguracion.FirstOrDefault();
        return config?.MODULO_RESTAURANTE ?? false;
    }

    public void SetRestauranteHabilitado(bool habilitado)
    {
        var config = _context.EmpresaConfiguracion.FirstOrDefault();
        if (config == null)
        {
            // Aplicación single-tenant: la configuración usa la primera empresa, o el id 1
            // como clave si todavía no hay empresa registrada.
            var empresa = _context.Empresa.OrderBy(e => e.ID_EMPRESA).FirstOrDefault();
            config = new EmpresaConfiguracion(empresa?.ID_EMPRESA ?? 1);
            _context.EmpresaConfiguracion.Add(config);
        }

        config.SetRestauranteHabilitado(habilitado);
        _context.SaveChanges();
    }

    // ---------- Mesas ----------

    public List<MesaDto> ListarMesas(int sucursalId)
    {
        var sesionesAbiertas = _context.SesionMesa
            .Where(s => s.ESTADO == EstadosSesionMesa.Abierta && s.ID_SUCURSAL == sucursalId)
            .Select(s => s.ID_MESA)
            .ToHashSet();

        return _context.Mesa
            .Where(m => m.ID_SUCURSAL == sucursalId && m.ACTIVA)
            .OrderBy(m => m.NUMERO_MESA)
            .Select(m => new MesaDto
            {
                Id = m.ID_MESA,
                SucursalId = m.ID_SUCURSAL,
                Numero = m.NUMERO_MESA,
                Descripcion = m.DESCRIPCION,
                PosX = m.POS_X,
                PosY = m.POS_Y,
                Activa = m.ACTIVA,
                Ocupada = false
            })
            .ToList()
            .Select(m =>
            {
                m.Ocupada = sesionesAbiertas.Contains(m.Id);
                return m;
            })
            .ToList();
    }

    public MesaDto CrearMesa(UpsertMesaRequest req)
    {
        if (req.SucursalId <= 0)
            throw new ArgumentException("Sucursal inválida");

        var sucursal = _context.Sucursal.Find(req.SucursalId)
            ?? throw new SucursalNoExisteException(req.SucursalId);

        if (!sucursal.ACTIVO)
            throw new SucursalInactivaException(req.SucursalId);

        var mesa = new Mesa(req.SucursalId, req.Numero, req.PosX, req.PosY, req.Descripcion);
        _context.Mesa.Add(mesa);
        _context.SaveChanges();

        return MapMesa(mesa, false);
    }

    public MesaDto ActualizarMesa(int mesaId, UpsertMesaRequest req)
    {
        var mesa = _context.Mesa.Find(mesaId)
            ?? throw new MesaNoEncontradaException(mesaId);

        if (_context.SesionMesa.Any(s => s.ID_MESA == mesaId && s.ESTADO == EstadosSesionMesa.Abierta))
            throw new MesaOcupadaException();

        if (req.SucursalId > 0)
            mesa.CambiarSucursal(req.SucursalId);

        mesa.CambiarNumero(req.Numero);
        mesa.CambiarDescripcion(req.Descripcion);
        mesa.Mover(req.PosX, req.PosY);
        _context.SaveChanges();

        return MapMesa(mesa, false);
    }

    public void EliminarMesa(int mesaId)
    {
        var mesa = _context.Mesa.Find(mesaId)
            ?? throw new MesaNoEncontradaException(mesaId);

        if (_context.SesionMesa.Any(s => s.ID_MESA == mesaId && s.ESTADO == EstadosSesionMesa.Abierta))
            throw new MesaOcupadaException();

        mesa.Desactivar();
        _context.SaveChanges();
    }

    // ---------- Sesiones (cuentas) ----------

    public SesionMesaDto AbrirSesion(int mesaId, int usuarioId)
    {
        var mesa = _context.Mesa.Find(mesaId)
            ?? throw new MesaNoEncontradaException(mesaId);

        if (!mesa.ACTIVA)
            throw new MesaNoEncontradaException(mesaId);

        if (_context.SesionMesa.Any(s => s.ID_MESA == mesaId && s.ESTADO == EstadosSesionMesa.Abierta))
            throw new MesaOcupadaException();

        var sesion = new SesionMesa(mesaId, mesa.ID_SUCURSAL, usuarioId);
        _context.SesionMesa.Add(sesion);
        _context.SaveChanges();

        return MapSesion(sesion, mesa.NUMERO_MESA);
    }

    public SesionMesaDto ObtenerSesion(int sesionId)
    {
        var sesion = CargarSesion(sesionId);
        return MapSesion(sesion, ObtenerNumeroMesa(sesion.ID_MESA));
    }

    public List<SesionMesaDto> ListarSesionesAbiertas(int sucursalId)
    {
        var numeros = _context.Mesa
            .Where(m => m.ID_SUCURSAL == sucursalId)
            .ToDictionary(m => m.ID_MESA, m => m.NUMERO_MESA);

        return _context.SesionMesa
            .Where(s => s.ID_SUCURSAL == sucursalId && s.ESTADO == EstadosSesionMesa.Abierta)
            .Include(s => s.ITEMS)
            .OrderBy(s => s.FECHA_APERTURA)
            .AsEnumerable()
            .Select(s => MapSesion(s, numeros.GetValueOrDefault(s.ID_MESA, "")))
            .ToList();
    }

    public List<ItemComandaDto> AgregarItem(int sesionId, AgregarItemComandaRequest req)
    {
        var sesion = CargarSesion(sesionId);
        if (!sesion.EstadoAbierta)
            throw new InvalidOperationException("La sesión no está abierta");

        int? productoId = null;
        int? comboId = null;
        string descripcion;
        decimal precio;

        if (req.ComboId.HasValue && req.ComboId.Value > 0)
        {
            var combo = _context.Combo.Find(req.ComboId.Value)
                ?? throw new InvalidOperationException($"Combo con ID {req.ComboId} no encontrado");

            if (!combo.ACTIVO)
                throw new InvalidOperationException($"El combo '{combo.DESC_COMBO}' no está activo");

            comboId = combo.ID_COMBO;
            descripcion = combo.DESC_COMBO;
            precio = combo.PRECIO;
        }
        else if (req.ProductoId.HasValue && req.ProductoId.Value > 0)
        {
            var producto = _context.Producto.Find(req.ProductoId.Value)
                ?? throw new ProductoNoExisteException(req.ProductoId.Value);

            if (!producto.ACTIVO)
                throw new ProductoInactivoException(req.ProductoId.Value);

            productoId = producto.ID_PRODUCTO;
            descripcion = producto.DESC_PRODUCTO;
            precio = producto.PRECIO;
        }
        else
        {
            throw new ArgumentException("Debe indicar un producto o combo");
        }

        // Cada unidad es su propia fila ItemComanda (CANTIDAD = 1) para poder ponerle
        // nota individual a cada una. Si vienen Notas por unidad se usan; si no, la Nota
        // simple se aplica a todas las unidades.
        var unidades = (int)Math.Max(1, Math.Round(req.Cantidad, 0, MidpointRounding.AwayFromZero));
        var notas = req.Notas ?? Enumerable.Repeat<string?>(req.Nota, unidades).ToList();

        var creados = new List<ItemComanda>();
        for (var i = 0; i < unidades; i++)
        {
            var nota = i < notas.Count ? notas[i] : req.Nota;
            var item = new ItemComanda(sesionId, productoId, comboId, descripcion, 1, precio, nota);
            sesion.AgregarItem(item);
            creados.Add(item);
        }

        _context.SaveChanges();

        return creados.Select(MapItem).ToList();
    }

    public ItemComandaDto ActualizarItem(int itemId, ActualizarItemComandaRequest req)
    {
        var item = _context.ItemComanda.Find(itemId)
            ?? throw new ItemComandaNoEncontradaException(itemId);

        if (item.ESTADO is EstadosItemComanda.Devuelto or EstadosItemComanda.Cancelado)
            throw new InvalidOperationException("No se puede editar un item devuelto o cancelado");

        if (req.Cantidad <= 0)
            throw new ArgumentException("La cantidad debe ser mayor a cero");

        item.CambiarCantidad(req.Cantidad);
        item.CambiarNota(req.Nota);
        _context.SaveChanges();

        return MapItem(item);
    }

    public void CambiarEstadoItem(int itemId, string estado)
    {
        var item = _context.ItemComanda.Find(itemId)
            ?? throw new ItemComandaNoEncontradaException(itemId);

        item.CambiarEstado(estado);
        _context.SaveChanges();
    }

    public SesionMesaDto UnificarSesiones(int desdeSesionId, int haciaSesionId)
    {
        if (desdeSesionId == haciaSesionId)
            throw new ArgumentException("Las sesiones deben ser distintas");

        var desde = CargarSesion(desdeSesionId);
        var hacia = CargarSesion(haciaSesionId);

        if (!desde.EstadoAbierta || !hacia.EstadoAbierta)
            throw new InvalidOperationException("Ambas sesiones deben estar abiertas");

        var items = _context.ItemComanda
            .Where(i => i.ID_SESION_MESA == desdeSesionId)
            .ToList()
            .Where(i => i.Contable)
            .ToList();

        foreach (var item in items)
            item.MoverA(haciaSesionId);

        _context.SaveChanges();

        return MapSesion(CargarSesion(haciaSesionId), ObtenerNumeroMesa(hacia.ID_MESA));
    }

    public async Task<VentaResultadoDto> CobrarCuenta(int sesionId, CobrarCuentaRequest req, int? usuarioId)
    {
        var sesion = CargarSesion(sesionId);
        if (!sesion.EstadoAbierta)
            throw new InvalidOperationException("La sesión no está abierta");

        var items = sesion.ITEMS.Where(i => i.Contable).ToList();
        if (items.Count == 0)
            throw new RestauranteSinItemsException();

        var dto = new VentaDto
        {
            SucursalId = sesion.ID_SUCURSAL,
            ClienteId = req.ClienteId,
            Pagos = req.Pagos,
            EsperarTransferencia = req.EsperarTransferencia,
            PendienteMedioId = req.PendienteMedioId,
            SinStock = true,
            SesionMesaId = sesion.ID_SESION_MESA,
            Items = items.Select(i => new VentaItemDto
            {
                ProductoId = i.ID_PRODUCTO ?? 0,
                ComboId = i.ID_COMBO,
                Cantidad = i.CANTIDAD,
                PrecioUnitario = i.PRECIO_UNITARIO
            }).ToList()
        };

        var resultado = await _ventaService.CrearVenta(dto, usuarioId);
        resultado.Mesa = ObtenerNumeroMesa(sesion.ID_MESA);

        // Con pago pendiente (QR/transferencia) la mesa queda ocupada hasta confirmar el pago,
        // así se evita marcar como cobrada una venta que puede cancelarse.
        if (!req.EsperarTransferencia)
        {
            sesion.MarcarCobrada(resultado.VentaId);
            _context.SaveChanges();
        }

        return resultado;
    }

    public void CancelarSesion(int sesionId)
    {
        var sesion = CargarSesion(sesionId);
        sesion.Cancelar();
        _context.SaveChanges();
    }

    // ---------- Helpers ----------

    private SesionMesa CargarSesion(int sesionId)
    {
        return _context.SesionMesa
            .Include(s => s.ITEMS)
            .FirstOrDefault(s => s.ID_SESION_MESA == sesionId)
            ?? throw new SesionMesaNoEncontradaException(sesionId);
    }

    private string ObtenerNumeroMesa(int mesaId)
    {
        return _context.Mesa.FirstOrDefault(m => m.ID_MESA == mesaId)?.NUMERO_MESA ?? "";
    }

    private static MesaDto MapMesa(Mesa mesa, bool ocupada)
    {
        return new MesaDto
        {
            Id = mesa.ID_MESA,
            SucursalId = mesa.ID_SUCURSAL,
            Numero = mesa.NUMERO_MESA,
            Descripcion = mesa.DESCRIPCION,
            PosX = mesa.POS_X,
            PosY = mesa.POS_Y,
            Activa = mesa.ACTIVA,
            Ocupada = ocupada
        };
    }

    private static ItemComandaDto MapItem(ItemComanda item)
    {
        return new ItemComandaDto
        {
            Id = item.ID_ITEM_COMANDA,
            SesionMesaId = item.ID_SESION_MESA,
            ProductoId = item.ID_PRODUCTO,
            ComboId = item.ID_COMBO,
            Descripcion = item.DESCRIPCION,
            Cantidad = item.CANTIDAD,
            PrecioUnitario = item.PRECIO_UNITARIO,
            Subtotal = item.SUBTOTAL,
            Nota = item.NOTA,
            Estado = item.ESTADO,
            FechaAlta = item.FECHA_ALTA,
            FechaEstado = item.FECHA_ESTADO
        };
    }

    private static SesionMesaDto MapSesion(SesionMesa sesion, string mesaNumero)
    {
        return new SesionMesaDto
        {
            Id = sesion.ID_SESION_MESA,
            MesaId = sesion.ID_MESA,
            MesaNumero = mesaNumero,
            SucursalId = sesion.ID_SUCURSAL,
            UsuarioId = sesion.ID_USUARIO,
            Estado = sesion.ESTADO,
            FechaApertura = sesion.FECHA_APERTURA,
            FechaCierre = sesion.FECHA_CIERRE,
            IdVenta = sesion.ID_VENTA,
            Total = sesion.Total,
            Items = sesion.ITEMS.Select(MapItem).ToList()
        };
    }
}