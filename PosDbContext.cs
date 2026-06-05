using Microsoft.EntityFrameworkCore;
using PosWeb.Domain;

namespace PosWeb.Data;

public class PosDbContext : DbContext
{
    public PosDbContext(DbContextOptions<PosDbContext> options)
        : base(options)
    {
    }

    // Existing entities (kept as-is)
    public DbSet<Caja> Cajas { get; set; }

    // Modified entities
    public DbSet<Producto> Productos { get; set; }
    public DbSet<Sucursal> Sucursales { get; set; }
    public DbSet<StockSucursal> StockPorSucursal { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<Cliente> Clientes { get; set; }
    public DbSet<Venta> Ventas { get; set; }
    public DbSet<RenglonVenta> RenglonesVenta { get; set; }
    public DbSet<MedioPago> MediosPago { get; set; }
    public DbSet<Pago> Pagos { get; set; }
    public DbSet<Gasto> Gastos { get; set; }

    // New entities
    public DbSet<Suscripcion> Suscripciones { get; set; }
    public DbSet<Empresa> Empresas { get; set; }
    public DbSet<Categoria> Categorias { get; set; }
    public DbSet<UnidadMedida> UnidadesMedida { get; set; }
    public DbSet<Proveedor> Proveedores { get; set; }
    public DbSet<Compra> Compras { get; set; }
    public DbSet<RenglonCompra> RenglonesCompra { get; set; }
    public DbSet<Deuda> Deudas { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ── CAJA ──────────────────────────────────────────────────────
        modelBuilder.Entity<Caja>(entity =>
        {
            entity.ToTable("CAJAS");
            entity.HasKey(e => e.ID_CAJA);
            entity.Property(e => e.ID_CAJA).HasColumnName("ID_CAJA").ValueGeneratedOnAdd();
            entity.Property(e => e.ID_SUCURSAL).HasColumnName("ID_SUCURSAL").IsRequired();
            entity.Property(e => e.ESTADO).HasColumnName("ESTADO").HasMaxLength(20).IsRequired();
            entity.Property(e => e.FECHA_APERTURA).HasColumnName("FECHA_APERTURA").IsRequired();
            entity.Property(e => e.FECHA_CIERRE).HasColumnName("FECHA_CIERRE");
            entity.Property(e => e.MONTO_INICIAL).HasColumnName("MONTO_INICIAL").HasColumnType("decimal(18,2)");
            entity.Property(e => e.MONTO_CONTADO_EFECTIVO).HasColumnName("MONTO_CONTADO_EFECTIVO").HasColumnType("decimal(18,2)");
            entity.Property(e => e.MONTO_CONTADO_TARJETAS).HasColumnName("MONTO_CONTADO_TARJETAS").HasColumnType("decimal(18,2)");
            entity.Property(e => e.DIFERENCIA).HasColumnName("DIFERENCIA").HasColumnType("decimal(18,2)");
            entity.Property(e => e.MONTO_GASTOS).HasColumnName("MONTO_GASTOS");
            entity.Property(e => e.ID_USUARIO_APERTURA).HasColumnName("ID_USUARIO_APERTURA").IsRequired();
            entity.Property(e => e.ID_USUARIO_CIERRE).HasColumnName("ID_USUARIO_CIERRE");

            entity.HasIndex(e => e.ID_USUARIO_APERTURA);
            entity.HasIndex(e => e.ID_USUARIO_CIERRE);
        });

        // ── PRODUCTO ──────────────────────────────────────────────────
        modelBuilder.Entity<Producto>(entity =>
        {
            entity.ToTable("PRODUCTOS");
            entity.HasKey(e => e.ID_PRODUCTO);
            entity.Property(e => e.ID_PRODUCTO).HasColumnName("ID_PRODUCTO").ValueGeneratedOnAdd();
            entity.Property(e => e.COD_PRODUCTO).HasColumnName("COD_PRODUCTO").HasMaxLength(50).IsRequired();
            entity.Property(e => e.CODIGO_BARRAS).HasColumnName("CODIGO_BARRAS").IsRequired();
            entity.Property(e => e.DESC_PRODUCTO).HasColumnName("DESC_PRODUCTO").IsRequired();
            entity.Property(e => e.PRECIO).HasColumnName("PRECIO").HasColumnType("decimal(18,2)");
            entity.Property(e => e.COSTO).HasColumnName("COSTO").HasColumnType("decimal(18,2)");
            entity.Property(e => e.ID_CATEGORIA).HasColumnName("ID_CATEGORIA");
            entity.Property(e => e.DESC_ADICIONAL).HasColumnName("DESC_ADICIONAL").HasMaxLength(500);
            entity.Property(e => e.CONTENIDO).HasColumnName("CONTENIDO").HasColumnType("decimal(18,2)");
            entity.Property(e => e.ID_UNIDAD_MEDIDA).HasColumnName("ID_UNIDAD_MEDIDA");
            entity.Property(e => e.FECHA_ALTA).HasColumnName("FECHA_ALTA").IsRequired();
            entity.Property(e => e.FECHA_ULTIMA_MOD).HasColumnName("FECHA_ULTIMA_MOD").IsRequired();
            entity.Property(e => e.FECHA_BAJA).HasColumnName("FECHA_BAJA");
            entity.Property(e => e.ACTIVO).HasColumnName("ACTIVO").IsRequired();

            entity.HasIndex(e => e.COD_PRODUCTO).IsUnique().HasFilter("ACTIVO = 1");
            entity.HasIndex(e => e.CODIGO_BARRAS);
            entity.HasIndex(e => e.DESC_PRODUCTO);

            entity.HasOne<Producto>()
                .WithMany()
                .HasForeignKey(e => e.ID_CATEGORIA)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne<UnidadMedida>()
                .WithMany()
                .HasForeignKey(e => e.ID_UNIDAD_MEDIDA)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ── SUCURSAL ──────────────────────────────────────────────────
        modelBuilder.Entity<Sucursal>(entity =>
        {
            entity.ToTable("SUCURSALES");
            entity.HasKey(e => e.ID_SUCURSAL);
            entity.Property(e => e.ID_SUCURSAL).HasColumnName("ID_SUCURSAL").ValueGeneratedOnAdd();
            entity.Property(e => e.COD_SUCURSAL).HasColumnName("COD_SUCURSAL").IsRequired();
            entity.Property(e => e.DESC_SUCURSAL).HasColumnName("DESC_SUCURSAL").IsRequired();
            entity.Property(e => e.ID_EMPRESA).HasColumnName("ID_EMPRESA").IsRequired();
            entity.Property(e => e.ACTIVO).HasColumnName("ACTIVO").IsRequired();

            entity.HasIndex(e => e.COD_SUCURSAL).IsUnique().HasFilter("ACTIVO = 1");

            entity.HasOne<Empresa>()
                .WithMany()
                .HasForeignKey(e => e.ID_EMPRESA)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ── STOCK_POR_SUCURSAL ────────────────────────────────────────
        modelBuilder.Entity<StockSucursal>(entity =>
        {
            entity.ToTable("STOCK_POR_SUCURSAL");
            entity.HasKey(e => new { e.ID_PRODUCTO, e.ID_SUCURSAL });
            entity.Property(e => e.ID_PRODUCTO).HasColumnName("ID_PRODUCTO").IsRequired();
            entity.Property(e => e.ID_SUCURSAL).HasColumnName("ID_SUCURSAL").IsRequired();
            entity.Property(e => e.STOCK).HasColumnName("STOCK").HasColumnType("decimal(18,2)");

            entity.HasOne(e => e.Producto)
                .WithMany()
                .HasForeignKey(e => e.ID_PRODUCTO)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Sucursal)
                .WithMany()
                .HasForeignKey(e => e.ID_SUCURSAL)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── USUARIO ───────────────────────────────────────────────────
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("USUARIOS");
            entity.HasKey(e => e.ID_USUARIO);
            entity.Property(e => e.ID_USUARIO).HasColumnName("ID_USUARIO").ValueGeneratedOnAdd();
            entity.Property(e => e.NOMBRE_USUARIO).HasColumnName("NOMBRE_USUARIO").HasMaxLength(50).IsRequired();
            entity.Property(e => e.PASSWORD_HASH).HasColumnName("PASSWORD_HASH").IsRequired();
            entity.Property(e => e.PIN_HASH).HasColumnName("PIN_HASH");
            entity.Property(e => e.MAIL).HasColumnName("MAIL").HasMaxLength(150);
            entity.Property(e => e.ROL).HasColumnName("ROL").HasMaxLength(20).IsRequired();
            entity.Property(e => e.ACTIVO).HasColumnName("ACTIVO").IsRequired();
            entity.Property(e => e.ID_SUCURSAL_DEFAULT).HasColumnName("ID_SUCURSAL_DEFAULT");
            entity.Property(e => e.ID_USUARIO_RESP).HasColumnName("ID_USUARIO_RESP");
            entity.Property(e => e.SUSCRIPCION_ACTIVA).HasColumnName("SUSCRIPCION_ACTIVA").IsRequired();

            entity.HasIndex(e => e.NOMBRE_USUARIO).IsUnique();

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(e => e.ID_USUARIO_RESP)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ── CLIENTE ───────────────────────────────────────────────────
        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.ToTable("CLIENTES");
            entity.HasKey(e => e.ID_CLIENTE);
            entity.Property(e => e.ID_CLIENTE).HasColumnName("ID_CLIENTE").ValueGeneratedOnAdd();
            entity.Property(e => e.NOMBRE).HasColumnName("NOMBRE").HasMaxLength(200).IsRequired();
            entity.Property(e => e.TIPO_DOCUMENTO).HasColumnName("TIPO_DOCUMENTO").HasMaxLength(20).IsRequired();
            entity.Property(e => e.NRO_DOCUMENTO).HasColumnName("NRO_DOCUMENTO").HasMaxLength(20).IsRequired();
            entity.Property(e => e.COD_CLIENTE).HasColumnName("COD_CLIENTE").HasMaxLength(50);
            entity.Property(e => e.TELEFONO).HasColumnName("TELEFONO").HasMaxLength(50);
            entity.Property(e => e.DOMICILIO).HasColumnName("DOMICILIO").HasMaxLength(200);
            entity.Property(e => e.MAIL).HasColumnName("MAIL").HasMaxLength(200);
            entity.Property(e => e.ACTIVO).HasColumnName("ACTIVO").IsRequired();

            entity.HasIndex(e => e.COD_CLIENTE).IsUnique().HasFilter("ACTIVO = 1");
            entity.HasIndex(e => new { e.TIPO_DOCUMENTO, e.NRO_DOCUMENTO }).IsUnique();
        });

        // ── VENTA ─────────────────────────────────────────────────────
        modelBuilder.Entity<Venta>(entity =>
        {
            entity.ToTable("VENTAS");
            entity.HasKey(e => e.ID_VENTA);
            entity.Property(e => e.ID_VENTA).HasColumnName("ID_VENTA").ValueGeneratedOnAdd();
            entity.Property(e => e.ID_SUCURSAL).HasColumnName("ID_SUCURSAL").IsRequired();
            entity.Property(e => e.FECHA_VENTA).HasColumnName("FECHA_VENTA").IsRequired();
            entity.Property(e => e.TOTAL).HasColumnName("TOTAL").HasColumnType("decimal(18,2)");
            entity.Property(e => e.ID_USUARIO).HasColumnName("ID_USUARIO");
            entity.Property(e => e.ID_CLIENTE).HasColumnName("ID_CLIENTE");

            entity.HasOne<Sucursal>()
                .WithMany()
                .HasForeignKey(e => e.ID_SUCURSAL)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<Cliente>()
                .WithMany()
                .HasForeignKey(e => e.ID_CLIENTE)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(e => e.ID_USUARIO)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ── RENGLON_VENTA ─────────────────────────────────────────────
        modelBuilder.Entity<RenglonVenta>(entity =>
        {
            entity.ToTable("RENGLONES_VENTA");
            entity.HasKey(e => e.ID_RENGLON_VENTA);
            entity.Property(e => e.ID_RENGLON_VENTA).HasColumnName("ID_RENGLON_VENTA").ValueGeneratedOnAdd();
            entity.Property(e => e.ID_VENTA).HasColumnName("ID_VENTA").IsRequired();
            entity.Property(e => e.ID_PRODUCTO).HasColumnName("ID_PRODUCTO").IsRequired();
            entity.Property(e => e.CANTIDAD).HasColumnName("CANTIDAD").HasColumnType("decimal(18,2)");
            entity.Property(e => e.PRECIO_UNITARIO).HasColumnName("PRECIO_UNITARIO").HasColumnType("decimal(18,2)");
            entity.Property(e => e.SUBTOTAL).HasColumnName("SUBTOTAL").HasColumnType("decimal(18,2)");

            entity.HasOne<Venta>()
                .WithMany(v => v.RENGLONES)
                .HasForeignKey(e => e.ID_VENTA)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── MEDIO_PAGO ────────────────────────────────────────────────
        modelBuilder.Entity<MedioPago>(entity =>
        {
            entity.ToTable("MEDIOS_PAGO");
            entity.HasKey(e => e.ID_MEDIO_PAGO);
            entity.Property(e => e.ID_MEDIO_PAGO).HasColumnName("ID_MEDIO_PAGO").ValueGeneratedOnAdd();
            entity.Property(e => e.COD_MEDIO_PAGO).HasColumnName("COD_MEDIO_PAGO").HasMaxLength(20).IsRequired();
            entity.Property(e => e.DESC_MEDIO_PAGO).HasColumnName("DESC_MEDIO_PAGO").HasMaxLength(100).IsRequired();
            entity.Property(e => e.PAGA_VUELTO).HasColumnName("PAGA_VUELTO").IsRequired();
            entity.Property(e => e.ACTIVO).HasColumnName("ACTIVO").IsRequired();

            entity.HasIndex(e => e.COD_MEDIO_PAGO).IsUnique().HasFilter("ACTIVO = 1");
        });

        // ── PAGO ──────────────────────────────────────────────────────
        modelBuilder.Entity<Pago>(entity =>
        {
            entity.ToTable("PAGOS");
            entity.HasKey(e => e.ID_PAGO);
            entity.Property(e => e.ID_PAGO).HasColumnName("ID_PAGO").ValueGeneratedOnAdd();
            entity.Property(e => e.ID_VENTA).HasColumnName("ID_VENTA").IsRequired();
            entity.Property(e => e.ID_MEDIO_PAGO).HasColumnName("ID_MEDIO_PAGO").IsRequired();
            entity.Property(e => e.MONTO).HasColumnName("MONTO").HasColumnType("decimal(18,2)");
            entity.Property(e => e.CAMBIO).HasColumnName("CAMBIO").HasColumnType("decimal(18,2)");
            entity.Property(e => e.ID_USUARIO_REGISTRA).HasColumnName("ID_USUARIO_REGISTRA").IsRequired();
            entity.Property(e => e.ID_CAJA).HasColumnName("ID_CAJA").IsRequired();

            entity.HasOne<Venta>()
                .WithMany()
                .HasForeignKey(e => e.ID_VENTA)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<MedioPago>()
                .WithMany()
                .HasForeignKey(e => e.ID_MEDIO_PAGO)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(e => e.ID_USUARIO_REGISTRA)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<Caja>()
                .WithMany()
                .HasForeignKey(e => e.ID_CAJA)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ── GASTO ─────────────────────────────────────────────────────
        modelBuilder.Entity<Gasto>(entity =>
        {
            entity.ToTable("GASTOS");
            entity.HasKey(e => e.ID_GASTO);
            entity.Property(e => e.ID_GASTO).HasColumnName("ID_GASTO").ValueGeneratedOnAdd();
            entity.Property(e => e.ID_CAJA).HasColumnName("ID_CAJA").IsRequired();
            entity.Property(e => e.MONTO).HasColumnName("MONTO").HasColumnType("decimal(18,2)");
            entity.Property(e => e.FECHA_GASTO).HasColumnName("FECHA_GASTO").IsRequired();
            entity.Property(e => e.DETALLE).HasColumnName("DETALLE").IsRequired();

            entity.HasOne<Caja>()
                .WithMany()
                .HasForeignKey(e => e.ID_CAJA)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── SUSCRIPCION ───────────────────────────────────────────────
        modelBuilder.Entity<Suscripcion>(entity =>
        {
            entity.ToTable("SUSCRIPCIONES");
            entity.HasKey(e => e.ID_SUSCRIPCION);
            entity.Property(e => e.ID_SUSCRIPCION).HasColumnName("ID_SUSCRIPCION").ValueGeneratedOnAdd();
            entity.Property(e => e.ID_USUARIO_TITULAR).HasColumnName("ID_USUARIO_TITULAR").IsRequired();
            entity.Property(e => e.NIVEL).HasColumnName("NIVEL").HasMaxLength(50).IsRequired();
            entity.Property(e => e.ESTADO).HasColumnName("ESTADO").HasMaxLength(20).IsRequired();
            entity.Property(e => e.COSTO_MENSUAL).HasColumnName("COSTO_MENSUAL").HasColumnType("decimal(18,2)");
            entity.Property(e => e.MAX_SUCURSALES).HasColumnName("MAX_SUCURSALES").IsRequired();
            entity.Property(e => e.MAX_ADMIN).HasColumnName("MAX_ADMIN").IsRequired();
            entity.Property(e => e.MAX_USUARIOS).HasColumnName("MAX_USUARIOS").IsRequired();
            entity.Property(e => e.FECHA_INICIO).HasColumnName("FECHA_INICIO").IsRequired();
            entity.Property(e => e.FECHA_FIN).HasColumnName("FECHA_FIN");
            entity.Property(e => e.PROXIMO_COBRO).HasColumnName("PROXIMO_COBRO");
            entity.Property(e => e.MERCADOPAGO_PREAPPROVAL_ID).HasColumnName("MERCADOPAGO_PREAPPROVAL_ID").HasMaxLength(100);

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(e => e.ID_USUARIO_TITULAR)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ── EMPRESA ───────────────────────────────────────────────────
        modelBuilder.Entity<Empresa>(entity =>
        {
            entity.ToTable("EMPRESAS");
            entity.HasKey(e => e.ID_EMPRESA);
            entity.Property(e => e.ID_EMPRESA).HasColumnName("ID_EMPRESA").ValueGeneratedOnAdd();
            entity.Property(e => e.NOMBRE).HasColumnName("NOMBRE").HasMaxLength(200).IsRequired();
            entity.Property(e => e.DOCUMENTO).HasColumnName("DOCUMENTO").HasMaxLength(20).IsRequired();
            entity.Property(e => e.ID_SUSCRIPCION).HasColumnName("ID_SUSCRIPCION").IsRequired();

            entity.HasOne<Suscripcion>()
                .WithMany()
                .HasForeignKey(e => e.ID_SUSCRIPCION)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // ── CATEGORIA ─────────────────────────────────────────────────
        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.ToTable("CATEGORIAS");
            entity.HasKey(e => e.ID_CATEGORIA);
            entity.Property(e => e.ID_CATEGORIA).HasColumnName("ID_CATEGORIA").ValueGeneratedOnAdd();
            entity.Property(e => e.COD_CATEGORIA).HasColumnName("COD_CATEGORIA").HasMaxLength(50).IsRequired();
            entity.Property(e => e.DESC_CATEGORIA).HasColumnName("DESC_CATEGORIA").HasMaxLength(200).IsRequired();

            entity.HasIndex(e => e.COD_CATEGORIA).IsUnique();
        });

        // ── UNIDAD_MEDIDA ─────────────────────────────────────────────
        modelBuilder.Entity<UnidadMedida>(entity =>
        {
            entity.ToTable("UNIDADES_MEDIDA");
            entity.HasKey(e => e.ID_UNIDAD_MEDIDA);
            entity.Property(e => e.ID_UNIDAD_MEDIDA).HasColumnName("ID_UNIDAD_MEDIDA").ValueGeneratedOnAdd();
            entity.Property(e => e.COD_UNIDAD_MEDIDA).HasColumnName("COD_UNIDAD_MEDIDA").HasMaxLength(20).IsRequired();
            entity.Property(e => e.DESC_UNIDAD_MEDIDA).HasColumnName("DESC_UNIDAD_MEDIDA").HasMaxLength(100).IsRequired();
            entity.Property(e => e.ACTIVO).HasColumnName("ACTIVO").IsRequired();

            entity.HasIndex(e => e.COD_UNIDAD_MEDIDA).IsUnique().HasFilter("ACTIVO = 1");
        });

        // ── PROVEEDOR ─────────────────────────────────────────────────
        modelBuilder.Entity<Proveedor>(entity =>
        {
            entity.ToTable("PROVEEDORES");
            entity.HasKey(e => e.ID_PROVEEDOR);
            entity.Property(e => e.ID_PROVEEDOR).HasColumnName("ID_PROVEEDOR").ValueGeneratedOnAdd();
            entity.Property(e => e.COD_PROVEEDOR).HasColumnName("COD_PROVEEDOR").HasMaxLength(50).IsRequired();
            entity.Property(e => e.DESC_PROVEEDOR).HasColumnName("DESC_PROVEEDOR").HasMaxLength(200).IsRequired();
            entity.Property(e => e.TIPO_DOCUMENTO).HasColumnName("TIPO_DOCUMENTO").HasMaxLength(20);
            entity.Property(e => e.NRO_DOCUMENTO).HasColumnName("NRO_DOCUMENTO").HasMaxLength(20);
            entity.Property(e => e.TELEFONO).HasColumnName("TELEFONO").HasMaxLength(50);
            entity.Property(e => e.DOMICILIO).HasColumnName("DOMICILIO").HasMaxLength(200);
            entity.Property(e => e.MAIL).HasColumnName("MAIL").HasMaxLength(200);
            entity.Property(e => e.ACTIVO).HasColumnName("ACTIVO").IsRequired();

            entity.HasIndex(e => e.COD_PROVEEDOR).IsUnique().HasFilter("ACTIVO = 1");
        });

        // ── COMPRA ────────────────────────────────────────────────────
        modelBuilder.Entity<Compra>(entity =>
        {
            entity.ToTable("COMPRAS");
            entity.HasKey(e => e.ID_COMPRA);
            entity.Property(e => e.ID_COMPRA).HasColumnName("ID_COMPRA").ValueGeneratedOnAdd();
            entity.Property(e => e.NUMERO_COMPROBANTE).HasColumnName("NUMERO_COMPROBANTE").IsRequired();
            entity.Property(e => e.ID_SUCURSAL).HasColumnName("ID_SUCURSAL").IsRequired();
            entity.Property(e => e.ID_PROVEEDOR).HasColumnName("ID_PROVEEDOR");
            entity.Property(e => e.ID_USUARIO).HasColumnName("ID_USUARIO").IsRequired();
            entity.Property(e => e.ID_GASTO).HasColumnName("ID_GASTO");
            entity.Property(e => e.FECHA_COMPRA).HasColumnName("FECHA_COMPRA").IsRequired();
            entity.Property(e => e.TOTAL).HasColumnName("TOTAL").HasColumnType("decimal(18,2)");

            entity.HasOne<Sucursal>()
                .WithMany()
                .HasForeignKey(e => e.ID_SUCURSAL)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<Proveedor>()
                .WithMany()
                .HasForeignKey(e => e.ID_PROVEEDOR)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(e => e.ID_USUARIO)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<Gasto>()
                .WithMany()
                .HasForeignKey(e => e.ID_GASTO)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ── RENGLON_COMPRA ────────────────────────────────────────────
        modelBuilder.Entity<RenglonCompra>(entity =>
        {
            entity.ToTable("RENGLONES_COMPRA");
            entity.HasKey(e => e.ID_RENGLON_COMPRA);
            entity.Property(e => e.ID_RENGLON_COMPRA).HasColumnName("ID_RENGLON_COMPRA").ValueGeneratedOnAdd();
            entity.Property(e => e.ID_COMPRA).HasColumnName("ID_COMPRA").IsRequired();
            entity.Property(e => e.ID_PRODUCTO).HasColumnName("ID_PRODUCTO").IsRequired();
            entity.Property(e => e.CANTIDAD).HasColumnName("CANTIDAD").HasColumnType("decimal(18,2)");
            entity.Property(e => e.PRECIO_UNITARIO).HasColumnName("PRECIO_UNITARIO").HasColumnType("decimal(18,2)");
            entity.Property(e => e.SUBTOTAL).HasColumnName("SUBTOTAL").HasColumnType("decimal(18,2)");

            entity.HasOne<Compra>()
                .WithMany(c => c.RENGLONES)
                .HasForeignKey(e => e.ID_COMPRA)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<Producto>()
                .WithMany()
                .HasForeignKey(e => e.ID_PRODUCTO)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── DEUDA ─────────────────────────────────────────────────────
        modelBuilder.Entity<Deuda>(entity =>
        {
            entity.ToTable("DEUDAS");
            entity.HasKey(e => e.ID_DEUDA);
            entity.Property(e => e.ID_DEUDA).HasColumnName("ID_DEUDA").ValueGeneratedOnAdd();
            entity.Property(e => e.ID_CLIENTE).HasColumnName("ID_CLIENTE");
            entity.Property(e => e.ID_PROVEEDOR).HasColumnName("ID_PROVEEDOR");
            entity.Property(e => e.MONTO_DEUDA).HasColumnName("MONTO_DEUDA").HasColumnType("decimal(18,2)");
            entity.Property(e => e.FECHA_DEUDA).HasColumnName("FECHA_DEUDA").IsRequired();
            entity.Property(e => e.FECHA_PAGO).HasColumnName("FECHA_PAGO");
            entity.Property(e => e.PAGO).HasColumnName("PAGO").IsRequired().HasDefaultValue(false);
            entity.Property(e => e.ID_VENTA).HasColumnName("ID_VENTA");
            entity.Property(e => e.ID_COMPRA).HasColumnName("ID_COMPRA");

            entity.HasOne<Cliente>()
                .WithMany()
                .HasForeignKey(e => e.ID_CLIENTE)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne<Proveedor>()
                .WithMany()
                .HasForeignKey(e => e.ID_PROVEEDOR)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne<Venta>()
                .WithMany()
                .HasForeignKey(e => e.ID_VENTA)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne<Compra>()
                .WithMany()
                .HasForeignKey(e => e.ID_COMPRA)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ═══════════════════════════════════════════════════════════════
        // SEED DATA
        // ═══════════════════════════════════════════════════════════════

        // Seed MedioPago (5 default payment methods)
        modelBuilder.Entity<MedioPago>().HasData(
            new { ID_MEDIO_PAGO = 1, COD_MEDIO_PAGO = "EF", DESC_MEDIO_PAGO = "Efectivo", PAGA_VUELTO = true, ACTIVO = true },
            new { ID_MEDIO_PAGO = 2, COD_MEDIO_PAGO = "TD", DESC_MEDIO_PAGO = "Tarjeta Débito", PAGA_VUELTO = false, ACTIVO = true },
            new { ID_MEDIO_PAGO = 3, COD_MEDIO_PAGO = "TC", DESC_MEDIO_PAGO = "Tarjeta Crédito", PAGA_VUELTO = false, ACTIVO = true },
            new { ID_MEDIO_PAGO = 4, COD_MEDIO_PAGO = "TRANSF", DESC_MEDIO_PAGO = "Transferencia", PAGA_VUELTO = false, ACTIVO = true },
            new { ID_MEDIO_PAGO = 5, COD_MEDIO_PAGO = "CTACTE", DESC_MEDIO_PAGO = "Cuenta Corriente", PAGA_VUELTO = false, ACTIVO = true }
        );

        // Seed UnidadMedida (3 base units)
        modelBuilder.Entity<UnidadMedida>().HasData(
            new { ID_UNIDAD_MEDIDA = 1, COD_UNIDAD_MEDIDA = "UN", DESC_UNIDAD_MEDIDA = "unidad", ACTIVO = true },
            new { ID_UNIDAD_MEDIDA = 2, COD_UNIDAD_MEDIDA = "KG", DESC_UNIDAD_MEDIDA = "kilogramo", ACTIVO = true },
            new { ID_UNIDAD_MEDIDA = 3, COD_UNIDAD_MEDIDA = "L", DESC_UNIDAD_MEDIDA = "litro", ACTIVO = true }
        );

        // Seed admin Usuario
        modelBuilder.Entity<Usuario>().HasData(
            new
            {
                ID_USUARIO = 1,
                NOMBRE_USUARIO = "admin",
                PASSWORD_HASH = "$2a$11$K4YfGqJ1e4YHIpQqJ1e4Y.ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
                ROL = "Admin",
                ACTIVO = true,
                SUSCRIPCION_ACTIVA = true
            }
        );
    }
}
