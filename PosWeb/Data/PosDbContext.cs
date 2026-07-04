using Microsoft.EntityFrameworkCore;
using PosWeb.Domain;

namespace PosWeb.Data;

public class PosDbContext : DbContext
{
    public PosDbContext(DbContextOptions<PosDbContext> options)
        : base(options)
    {
    }

    public DbSet<Caja> Caja { get; set; }
    public DbSet<Producto> Producto { get; set; }
    public DbSet<Sucursal> Sucursal { get; set; }
    public DbSet<StockSucursal> StockSucursal { get; set; }
    public DbSet<Usuario> Usuario { get; set; }
    public DbSet<Cliente> Cliente { get; set; }
    public DbSet<Venta> Venta { get; set; }
    public DbSet<RenglonVenta> RenglonVenta { get; set; }
    public DbSet<MedioPago> MedioPago { get; set; }
    public DbSet<Pago> Pago { get; set; }
    public DbSet<Gasto> Gasto { get; set; }
    public DbSet<Suscripcion> Suscripcion { get; set; }
    public DbSet<Empresa> Empresa { get; set; }
    public DbSet<Categoria> Categoria { get; set; }
    public DbSet<UnidadMedida> UnidadMedida { get; set; }
    public DbSet<Proveedor> Proveedor { get; set; }
    public DbSet<Compra> Compra { get; set; }
    public DbSet<RenglonCompra> RenglonCompra { get; set; }
    public DbSet<Deuda> Deuda { get; set; }
    public DbSet<Pedido> Pedido { get; set; }
    public DbSet<RenglonPedido> RenglonPedido { get; set; }
    public DbSet<Combo> Combo { get; set; }
    public DbSet<ComboItem> ComboItem { get; set; }
    public DbSet<Oferta> Oferta { get; set; }
    public DbSet<PagoDeuda> PagoDeuda { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ---- PRODUCTO ----
        modelBuilder.Entity<Producto>(entity =>
        {
            entity.ToTable("PRODUCTO");

            entity.HasKey(p => p.ID_PRODUCTO);

            entity.Property(p => p.ID_PRODUCTO)
                .HasColumnName("ID_PRODUCTO");

            entity.Property(p => p.COD_PRODUCTO)
                .HasColumnName("COD_PRODUCTO")
                .HasMaxLength(50)
                .IsRequired();

            entity.HasIndex(p => p.COD_PRODUCTO)
                .IsUnique()
                .HasFilter("ACTIVO = 1");

            entity.Property(p => p.DESC_PRODUCTO)
                .HasColumnName("DESC_PRODUCTO")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(p => p.CODIGO_BARRAS)
                .HasColumnName("CODIGO_BARRAS")
                .HasMaxLength(100);

            entity.Property(p => p.PRECIO)
                .HasColumnName("PRECIO")
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(p => p.COSTO)
                .HasColumnName("COSTO")
                .HasColumnType("decimal(18,2)");

            entity.Property(p => p.ID_CATEGORIA)
                .HasColumnName("ID_CATEGORIA");

            entity.Property(p => p.ID_UNIDAD_MEDIDA)
                .HasColumnName("ID_UNIDAD_MEDIDA");

            entity.Property(p => p.CONTENIDO)
                .HasColumnName("CONTENIDO")
                .HasColumnType("decimal(18,2)");

            entity.Property(p => p.MARCA)
                .HasColumnName("MARCA")
                .HasMaxLength(200);

            entity.Property(p => p.ACTIVO)
                .HasColumnName("ACTIVO");

            entity.Property(p => p.SEGUIR_STOCK)
                .HasColumnName("SEGUIR_STOCK");

            entity.HasOne<Categoria>()
                .WithMany()
                .HasForeignKey(p => p.ID_CATEGORIA)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<UnidadMedida>()
                .WithMany()
                .HasForeignKey(p => p.ID_UNIDAD_MEDIDA)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- SUCURSAL ----
        modelBuilder.Entity<Sucursal>(entity =>
        {
            entity.ToTable("SUCURSAL");

            entity.HasKey(s => s.ID_SUCURSAL);

            entity.Property(s => s.ID_SUCURSAL)
                .HasColumnName("ID_SUCURSAL");

            entity.Property(s => s.COD_SUCURSAL)
                .HasColumnName("COD_SUCURSAL")
                .HasMaxLength(50)
                .IsRequired();

            entity.HasIndex(s => s.COD_SUCURSAL)
                .IsUnique()
                .HasFilter("ACTIVO = 1");

            entity.Property(s => s.DESC_SUCURSAL)
                .HasColumnName("DESC_SUCURSAL")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(s => s.ID_EMPRESA)
                .HasColumnName("ID_EMPRESA");

            entity.Property(s => s.ACTIVO)
                .HasColumnName("ACTIVO");

            entity.HasOne<Empresa>()
                .WithMany()
                .HasForeignKey(s => s.ID_EMPRESA)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- STOCK SUCURSAL ----
        modelBuilder.Entity<StockSucursal>(entity =>
        {
            entity.ToTable("STOCK_SUCURSAL");

            entity.HasKey(s => new { s.ID_PRODUCTO, s.ID_SUCURSAL });

            entity.Property(s => s.ID_PRODUCTO)
                .HasColumnName("ID_PRODUCTO");

            entity.Property(s => s.ID_SUCURSAL)
                .HasColumnName("ID_SUCURSAL");

            entity.Property(s => s.STOCK)
                .HasColumnName("STOCK")
                .HasColumnType("decimal(18,2)");

            entity.HasOne(s => s.Producto)
                .WithMany()
                .HasForeignKey(s => s.ID_PRODUCTO)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(s => s.Sucursal)
                .WithMany()
                .HasForeignKey(s => s.ID_SUCURSAL)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- USUARIO ----
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("USUARIO");

            entity.HasKey(u => u.ID_USUARIO);

            entity.Property(u => u.ID_USUARIO)
                .HasColumnName("ID_USUARIO");

            entity.Property(u => u.NOMBRE_USUARIO)
                .HasColumnName("NOMBRE_USUARIO")
                .HasMaxLength(100)
                .IsRequired();

            entity.HasIndex(u => u.NOMBRE_USUARIO)
                .IsUnique()
                .HasFilter("ACTIVO = 1");

            entity.Property(u => u.PASSWORD_HASH)
                .HasColumnName("PASSWORD_HASH")
                .IsRequired();

            entity.Property(u => u.ROL)
                .HasColumnName("ROL")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(u => u.MAIL)
                .HasColumnName("MAIL")
                .HasMaxLength(200);

            entity.Property(u => u.SUSCRIPCION_ACTIVA)
                .HasColumnName("SUSCRIPCION_ACTIVA");

            entity.Property(u => u.PIN_HASH)
                .HasColumnName("PIN_HASH");

            entity.Property(u => u.ID_USUARIO_RESP)
                .HasColumnName("ID_USUARIO_RESP");

            entity.Property(u => u.ACTIVO)
                .HasColumnName("ACTIVO");

            entity.Property(u => u.ID_SUCURSAL_DEFAULT)
                .HasColumnName("ID_SUCURSAL_DEFAULT");

            entity.Property(u => u.ID_USUARIO_RESPONSABLE)
                .HasColumnName("ID_USUARIO_RESPONSABLE");

            entity.Property(u => u.ID_EMPRESA)
                .HasColumnName("ID_EMPRESA");

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(u => u.ID_USUARIO_RESP)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Empresa>()
                .WithMany()
                .HasForeignKey(u => u.ID_EMPRESA)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- CLIENTE ----
        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.ToTable("CLIENTE");

            entity.HasKey(c => c.ID_CLIENTE);

            entity.Property(c => c.ID_CLIENTE)
                .HasColumnName("ID_CLIENTE");

            entity.Property(c => c.COD_CLIENTE)
                .HasColumnName("COD_CLIENTE")
                .HasMaxLength(50)
                .IsRequired(false);

            entity.HasIndex(c => c.COD_CLIENTE)
                .IsUnique()
                .HasFilter("ACTIVO = 1");

            entity.Property(c => c.NOMBRE)
                .HasColumnName("NOMBRE")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(c => c.MAIL)
                .HasColumnName("MAIL")
                .HasMaxLength(200);

            entity.Property(c => c.NRO_DOCUMENTO)
                .HasColumnName("NRO_DOCUMENTO")
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(c => c.ACTIVO)
                .HasColumnName("ACTIVO");
        });

        // ---- VENTA ----
        modelBuilder.Entity<Venta>(entity =>
        {
            entity.ToTable("VENTA");

            entity.HasKey(v => v.ID_VENTA);

            entity.Property(v => v.ID_VENTA)
                .HasColumnName("ID_VENTA");

            entity.Property(v => v.ID_SUCURSAL)
                .HasColumnName("ID_SUCURSAL");

            entity.Property(v => v.FECHA_VENTA)
                .HasColumnName("FECHA_VENTA");

            entity.Property(v => v.TOTAL)
                .HasColumnName("TOTAL")
                .HasColumnType("decimal(18,2)");

            entity.Property(v => v.ID_USUARIO)
                .HasColumnName("ID_USUARIO");

            entity.Property(v => v.ID_CLIENTE)
                .HasColumnName("ID_CLIENTE");

            entity.Property(v => v.ANULADA)
                .HasColumnName("ANULADA");

            entity.Navigation(v => v.RENGLONES)
                .UsePropertyAccessMode(PropertyAccessMode.Field);

            entity.HasOne<Sucursal>()
                .WithMany()
                .HasForeignKey(v => v.ID_SUCURSAL)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(v => v.ID_USUARIO)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Cliente>()
                .WithMany()
                .HasForeignKey(v => v.ID_CLIENTE)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- RENGLON VENTA ----
        modelBuilder.Entity<RenglonVenta>(entity =>
        {
            entity.ToTable("RENGLON_VENTA");

            entity.HasKey(r => r.ID_RENGLON_VENTA);

            entity.Property(r => r.ID_RENGLON_VENTA)
                .HasColumnName("ID_RENGLON_VENTA");

            entity.Property(r => r.ID_VENTA)
                .HasColumnName("ID_VENTA");

            entity.Property(r => r.ID_PRODUCTO)
                .HasColumnName("ID_PRODUCTO");

            entity.Property(r => r.ID_COMBO)
                .HasColumnName("ID_COMBO");

            entity.Property(r => r.CANTIDAD)
                .HasColumnName("CANTIDAD")
                .HasColumnType("decimal(18,2)");

            entity.Property(r => r.PRECIO_UNITARIO)
                .HasColumnName("PRECIO_UNITARIO")
                .HasColumnType("decimal(18,2)");

            entity.Property(r => r.SUBTOTAL)
                .HasColumnName("SUBTOTAL")
                .HasColumnType("decimal(18,2)");

            entity.HasOne<Venta>()
                .WithMany(v => v.RENGLONES)
                .HasForeignKey(r => r.ID_VENTA)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<Producto>()
                .WithMany()
                .HasForeignKey(r => r.ID_PRODUCTO)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Combo>()
                .WithMany()
                .HasForeignKey(r => r.ID_COMBO)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Property(r => r.ID_OFERTA)
                .HasColumnName("ID_OFERTA");

            entity.HasOne<Oferta>()
                .WithMany()
                .HasForeignKey(r => r.ID_OFERTA)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- COMBO ----
        modelBuilder.Entity<Combo>(entity =>
        {
            entity.ToTable("COMBO");

            entity.HasKey(c => c.ID_COMBO);

            entity.Property(c => c.ID_COMBO)
                .HasColumnName("ID_COMBO");

            entity.Property(c => c.COD_COMBO)
                .HasColumnName("COD_COMBO")
                .HasMaxLength(50)
                .IsRequired();

            entity.HasIndex(c => c.COD_COMBO)
                .IsUnique()
                .HasFilter("ACTIVO = 1");

            entity.Property(c => c.DESC_COMBO)
                .HasColumnName("DESC_COMBO")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(c => c.PRECIO)
                .HasColumnName("PRECIO")
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(c => c.ACTIVO)
                .HasColumnName("ACTIVO");

            entity.Property(c => c.FECHA_INICIO)
                .HasColumnName("FECHA_INICIO");

            entity.Property(c => c.FECHA_FIN)
                .HasColumnName("FECHA_FIN");

            entity.Property(c => c.DIAS_SEMANA)
                .HasColumnName("DIAS_SEMANA")
                .HasMaxLength(50);

            entity.Navigation(c => c.ITEMS)
                .UsePropertyAccessMode(PropertyAccessMode.Field);
        });

        // ---- COMBO ITEM ----
        modelBuilder.Entity<ComboItem>(entity =>
        {
            entity.ToTable("COMBO_ITEM");

            entity.HasKey(ci => ci.ID_COMBO_ITEM);

            entity.Property(ci => ci.ID_COMBO_ITEM)
                .HasColumnName("ID_COMBO_ITEM");

            entity.Property(ci => ci.ID_COMBO)
                .HasColumnName("ID_COMBO");

            entity.Property(ci => ci.ID_PRODUCTO)
                .HasColumnName("ID_PRODUCTO");

            entity.Property(ci => ci.CANTIDAD)
                .HasColumnName("CANTIDAD")
                .HasColumnType("decimal(18,2)");

            entity.HasOne<Combo>()
                .WithMany(c => c.ITEMS)
                .HasForeignKey(ci => ci.ID_COMBO)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<Producto>()
                .WithMany()
                .HasForeignKey(ci => ci.ID_PRODUCTO)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- OFERTA ----
        modelBuilder.Entity<Oferta>(entity =>
        {
            entity.ToTable("OFERTA");

            entity.HasKey(o => o.ID_OFERTA);

            entity.Property(o => o.ID_OFERTA)
                .HasColumnName("ID_OFERTA");

            entity.Property(o => o.FECHA_INICIO)
                .HasColumnName("FECHA_INICIO")
                .IsRequired();

            entity.Property(o => o.FECHA_FIN)
                .HasColumnName("FECHA_FIN")
                .IsRequired();

            entity.Property(o => o.ID_PRODUCTO)
                .HasColumnName("ID_PRODUCTO")
                .IsRequired();

            entity.Property(o => o.DESCUENTO)
                .HasColumnName("DESCUENTO")
                .HasColumnType("decimal(5,2)")
                .IsRequired();

            entity.Property(o => o.ACTIVO)
                .HasColumnName("ACTIVO");

            entity.Property(o => o.DIAS_SEMANA)
                .HasColumnName("DIAS_SEMANA")
                .HasMaxLength(50);

            entity.HasOne<Producto>()
                .WithMany()
                .HasForeignKey(o => o.ID_PRODUCTO)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- MEDIO PAGO ----
        modelBuilder.Entity<MedioPago>(entity =>
        {
            entity.ToTable("MEDIO_PAGO");

            entity.HasKey(m => m.ID_MEDIO_PAGO);

            entity.Property(m => m.ID_MEDIO_PAGO)
                .HasColumnName("ID_MEDIO_PAGO");

            entity.Property(m => m.COD_MEDIO_PAGO)
                .HasColumnName("COD_MEDIO_PAGO")
                .HasMaxLength(50)
                .IsRequired();

            entity.HasIndex(m => m.COD_MEDIO_PAGO)
                .IsUnique()
                .HasFilter("ACTIVO = 1");

            entity.Property(m => m.DESC_MEDIO_PAGO)
                .HasColumnName("DESC_MEDIO_PAGO")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(m => m.PAGA_VUELTO)
                .HasColumnName("PAGA_VUELTO");

            entity.Property(m => m.ACTIVO)
                .HasColumnName("ACTIVO");
        });

        // ---- PAGO ----
        modelBuilder.Entity<Pago>(entity =>
        {
            entity.ToTable("PAGO");

            entity.HasKey(p => p.ID_PAGO);

            entity.Property(p => p.ID_PAGO)
                .HasColumnName("ID_PAGO");

            entity.Property(p => p.ID_VENTA)
                .HasColumnName("ID_VENTA");

            entity.Property(p => p.ID_MEDIO_PAGO)
                .HasColumnName("ID_MEDIO_PAGO");

            entity.Property(p => p.ID_CAJA)
                .HasColumnName("ID_CAJA");

            entity.Property(p => p.MONTO)
                .HasColumnName("MONTO")
                .HasColumnType("decimal(18,2)");

            entity.Property(p => p.CAMBIO)
                .HasColumnName("CAMBIO")
                .HasColumnType("decimal(18,2)");

            entity.HasOne<Venta>()
                .WithMany()
                .HasForeignKey(p => p.ID_VENTA)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<MedioPago>()
                .WithMany()
                .HasForeignKey(p => p.ID_MEDIO_PAGO)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Caja>()
                .WithMany()
                .HasForeignKey(p => p.ID_CAJA)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- CAJA ----
        modelBuilder.Entity<Caja>(entity =>
        {
            entity.ToTable("CAJA");

            entity.HasKey(c => c.ID_CAJA);

            entity.Property(c => c.ID_CAJA)
                .HasColumnName("ID_CAJA");

            entity.Property(c => c.ID_SUCURSAL)
                .HasColumnName("ID_SUCURSAL");

            entity.Property(c => c.ESTADO)
                .HasColumnName("ESTADO")
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(c => c.FECHA_APERTURA)
                .HasColumnName("FECHA_APERTURA");

            entity.Property(c => c.FECHA_CIERRE)
                .HasColumnName("FECHA_CIERRE");

            entity.Property(c => c.MONTO_INICIAL)
                .HasColumnName("MONTO_INICIAL")
                .HasColumnType("decimal(18,2)");

            entity.Property(c => c.MONTO_CONTADO_EFECTIVO)
                .HasColumnName("MONTO_CONTADO_EFECTIVO")
                .HasColumnType("decimal(18,2)");

            entity.Property(c => c.MONTO_CONTADO_TARJETAS)
                .HasColumnName("MONTO_CONTADO_TARJETAS")
                .HasColumnType("decimal(18,2)");

            entity.Property(c => c.MONTO_GASTOS)
                .HasColumnName("MONTO_GASTOS")
                .HasColumnType("decimal(18,2)");

            entity.Property(c => c.DIFERENCIA)
                .HasColumnName("DIFERENCIA")
                .HasColumnType("decimal(18,2)");

            entity.Property(c => c.ID_USUARIO_APERTURA)
                .HasColumnName("ID_USUARIO_APERTURA");

            entity.Property(c => c.ID_USUARIO_CIERRE)
                .HasColumnName("ID_USUARIO_CIERRE");

            entity.HasOne<Sucursal>()
                .WithMany()
                .HasForeignKey(c => c.ID_SUCURSAL)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(c => c.ID_USUARIO_APERTURA)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(c => c.ID_USUARIO_CIERRE)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- GASTO ----
        modelBuilder.Entity<Gasto>(entity =>
        {
            entity.ToTable("GASTO");

            entity.HasKey(g => g.ID_GASTO);

            entity.Property(g => g.ID_GASTO)
                .HasColumnName("ID_GASTO");

            entity.Property(g => g.DETALLE)
                .HasColumnName("DETALLE")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(g => g.MONTO)
                .HasColumnName("MONTO")
                .HasColumnType("decimal(18,2)");

            entity.Property(g => g.FECHA_GASTO)
                .HasColumnName("FECHA_GASTO");

            entity.Property(g => g.ID_CAJA)
                .HasColumnName("ID_CAJA");

            entity.Property(g => g.ANULADO)
                .HasColumnName("ANULADO");

            entity.Property(g => g.ID_USUARIO)
                .HasColumnName("ID_USUARIO");

            entity.HasOne<Caja>()
                .WithMany()
                .HasForeignKey(g => g.ID_CAJA)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- CATEGORIA_GASTO ----
        modelBuilder.Entity<CategoriaGasto>(entity =>
        {
            entity.ToTable("CATEGORIA_GASTO");

            entity.HasKey(c => c.ID_CATEGORIA_GASTO);

            entity.Property(c => c.ID_CATEGORIA_GASTO)
                .HasColumnName("ID_CATEGORIA_GASTO");

            entity.Property(c => c.DESCRIPCION)
                .HasColumnName("DESCRIPCION")
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(c => c.ACTIVO)
                .HasColumnName("ACTIVO");
        });

        // ---- CATEGORIA ----
        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.ToTable("CATEGORIA");

            entity.HasKey(c => c.ID_CATEGORIA);

            entity.Property(c => c.ID_CATEGORIA)
                .HasColumnName("ID_CATEGORIA");

            entity.Property(c => c.COD_CATEGORIA)
                .HasColumnName("COD_CATEGORIA")
                .HasMaxLength(50)
                .IsRequired();

            entity.HasIndex(c => c.COD_CATEGORIA)
                .IsUnique();

            entity.Property(c => c.DESC_CATEGORIA)
                .HasColumnName("DESC_CATEGORIA")
                .HasMaxLength(200)
                .IsRequired();
        });

        // ---- UNIDAD MEDIDA ----
        modelBuilder.Entity<UnidadMedida>(entity =>
        {
            entity.ToTable("UNIDAD_MEDIDA");

            entity.HasKey(u => u.ID_UNIDAD_MEDIDA);

            entity.Property(u => u.ID_UNIDAD_MEDIDA)
                .HasColumnName("ID_UNIDAD_MEDIDA");

            entity.Property(u => u.COD_UNIDAD_MEDIDA)
                .HasColumnName("COD_UNIDAD_MEDIDA")
                .HasMaxLength(50)
                .IsRequired();

            entity.HasIndex(u => u.COD_UNIDAD_MEDIDA)
                .IsUnique();

            entity.Property(u => u.DESC_UNIDAD_MEDIDA)
                .HasColumnName("DESC_UNIDAD_MEDIDA")
                .HasMaxLength(200)
                .IsRequired();

        });

        // ---- SUSCRIPCION ----
        modelBuilder.Entity<Suscripcion>(entity =>
        {
            entity.ToTable("SUSCRIPCION");

            entity.HasKey(s => s.ID_SUSCRIPCION);

            entity.Property(s => s.ID_SUSCRIPCION)
                .HasColumnName("ID_SUSCRIPCION");

            entity.Property(s => s.ID_USUARIO_TITULAR)
                .HasColumnName("ID_USUARIO_TITULAR");

            entity.Property(s => s.NIVEL)
                .HasColumnName("NIVEL")
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(s => s.ESTADO)
                .HasColumnName("ESTADO")
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(s => s.COSTO_MENSUAL)
                .HasColumnName("COSTO_MENSUAL")
                .HasColumnType("decimal(18,2)");

            entity.Property(s => s.MAX_SUCURSALES)
                .HasColumnName("MAX_SUCURSALES");

            entity.Property(s => s.MAX_ADMIN)
                .HasColumnName("MAX_ADMIN");

            entity.Property(s => s.MAX_USUARIOS)
                .HasColumnName("MAX_USUARIOS");

            entity.Property(s => s.FECHA_INICIO)
                .HasColumnName("FECHA_INICIO");

            entity.Property(s => s.FECHA_FIN)
                .HasColumnName("FECHA_FIN");

            entity.Property(s => s.PROXIMO_COBRO)
                .HasColumnName("PROXIMO_COBRO");

            entity.Property(s => s.MERCADOPAGO_PREAPPROVAL_ID)
                .HasColumnName("MERCADOPAGO_PREAPPROVAL_ID")
                .HasMaxLength(100);

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(s => s.ID_USUARIO_TITULAR)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- EMPRESA ----
        modelBuilder.Entity<Empresa>(entity =>
        {
            entity.ToTable("EMPRESA");

            entity.HasKey(e => e.ID_EMPRESA);

            entity.Property(e => e.ID_EMPRESA)
                .HasColumnName("ID_EMPRESA");

            entity.Property(e => e.NOMBRE)
                .HasColumnName("NOMBRE")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(e => e.DOCUMENTO)
                .HasColumnName("DOCUMENTO")
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(e => e.ID_SUSCRIPCION)
                .HasColumnName("ID_SUSCRIPCION");

            entity.HasOne<Suscripcion>()
                .WithMany()
                .HasForeignKey(e => e.ID_SUSCRIPCION)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- PROVEEDOR ----
        modelBuilder.Entity<Proveedor>(entity =>
        {
            entity.ToTable("PROVEEDOR");

            entity.HasKey(p => p.ID_PROVEEDOR);

            entity.Property(p => p.ID_PROVEEDOR)
                .HasColumnName("ID_PROVEEDOR");

            entity.Property(p => p.COD_PROVEEDOR)
                .HasColumnName("COD_PROVEEDOR")
                .HasMaxLength(50)
                .IsRequired();

            entity.HasIndex(p => p.COD_PROVEEDOR)
                .IsUnique()
                .HasFilter("ACTIVO = 1");

            entity.Property(p => p.NOMBRE)
                .HasColumnName("NOMBRE")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(p => p.TIPO_DOCUMENTO)
                .HasColumnName("TIPO_DOCUMENTO")
                .HasMaxLength(20);

            entity.Property(p => p.NRO_DOCUMENTO)
                .HasColumnName("NRO_DOCUMENTO")
                .HasMaxLength(20);

            entity.Property(p => p.TELEFONO)
                .HasColumnName("TELEFONO")
                .HasMaxLength(50);

            entity.Property(p => p.DOMICILIO)
                .HasColumnName("DOMICILIO")
                .HasMaxLength(200);

            entity.Property(p => p.MAIL)
                .HasColumnName("MAIL")
                .HasMaxLength(200);

            entity.Property(p => p.ACTIVO)
                .HasColumnName("ACTIVO");
        });

        // ---- COMPRA ----
        modelBuilder.Entity<Compra>(entity =>
        {
            entity.ToTable("COMPRA");

            entity.HasKey(c => c.ID_COMPRA);

            entity.Property(c => c.ID_COMPRA)
                .HasColumnName("ID_COMPRA");

            entity.Property(c => c.NUMERO_COMPROBANTE)
                .HasColumnName("NUMERO_COMPROBANTE");

            entity.Property(c => c.ID_SUCURSAL)
                .HasColumnName("ID_SUCURSAL");

            entity.Property(c => c.ID_PROVEEDOR)
                .HasColumnName("ID_PROVEEDOR")
                .IsRequired();

            entity.Property(c => c.ID_USUARIO)
                .HasColumnName("ID_USUARIO");

            entity.Property(c => c.ID_GASTO)
                .HasColumnName("ID_GASTO");

            entity.Property(c => c.ID_PEDIDO)
                .HasColumnName("ID_PEDIDO");

            entity.Property(c => c.FECHA_COMPRA)
                .HasColumnName("FECHA_COMPRA");

            entity.Property(c => c.TOTAL)
                .HasColumnName("TOTAL")
                .HasColumnType("decimal(18,2)");

            entity.Navigation(c => c.RENGLONES)
                .UsePropertyAccessMode(PropertyAccessMode.Field);

            entity.HasOne<Sucursal>()
                .WithMany()
                .HasForeignKey(c => c.ID_SUCURSAL)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Proveedor>()
                .WithMany()
                .HasForeignKey(c => c.ID_PROVEEDOR)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(c => c.ID_USUARIO)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Gasto>()
                .WithMany()
                .HasForeignKey(c => c.ID_GASTO)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Pedido>()
                .WithMany()
                .HasForeignKey(c => c.ID_PEDIDO)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- RENGLON COMPRA ----
        modelBuilder.Entity<RenglonCompra>(entity =>
        {
            entity.ToTable("RENGLON_COMPRA");

            entity.HasKey(r => r.ID_RENGLON_COMPRA);

            entity.Property(r => r.ID_RENGLON_COMPRA)
                .HasColumnName("ID_RENGLON_COMPRA");

            entity.Property(r => r.ID_COMPRA)
                .HasColumnName("ID_COMPRA");

            entity.Property(r => r.ID_PRODUCTO)
                .HasColumnName("ID_PRODUCTO");

            entity.Property(r => r.CANTIDAD)
                .HasColumnName("CANTIDAD")
                .HasColumnType("decimal(18,2)");

            entity.Property(r => r.PRECIO_UNITARIO)
                .HasColumnName("PRECIO_UNITARIO")
                .HasColumnType("decimal(18,2)");

            entity.Property(r => r.SUBTOTAL)
                .HasColumnName("SUBTOTAL")
                .HasColumnType("decimal(18,2)");

            entity.HasOne<Compra>()
                .WithMany(c => c.RENGLONES)
                .HasForeignKey(r => r.ID_COMPRA)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<Producto>()
                .WithMany()
                .HasForeignKey(r => r.ID_PRODUCTO)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- DEUDA ----
        modelBuilder.Entity<Deuda>(entity =>
        {
            entity.ToTable("DEUDA");

            entity.HasKey(d => d.ID_DEUDA);

            entity.Property(d => d.ID_DEUDA)
                .HasColumnName("ID_DEUDA");

            entity.Property(d => d.ID_CLIENTE)
                .HasColumnName("ID_CLIENTE");

            entity.Property(d => d.ID_PROVEEDOR)
                .HasColumnName("ID_PROVEEDOR");

            entity.Property(d => d.MONTO_DEUDA)
                .HasColumnName("MONTO_DEUDA")
                .HasColumnType("decimal(18,2)");

            entity.Property(d => d.FECHA_DEUDA)
                .HasColumnName("FECHA_DEUDA");

            entity.Property(d => d.FECHA_PAGO)
                .HasColumnName("FECHA_PAGO");

            entity.Property(d => d.MONTO_PAGADO)
                .HasColumnName("MONTO_PAGADO")
                .HasColumnType("decimal(18,2)");

            entity.Property(d => d.PAGO)
                .HasColumnName("PAGO");

            entity.Property(d => d.ID_VENTA)
                .HasColumnName("ID_VENTA");

            entity.Property(d => d.ID_COMPRA)
                .HasColumnName("ID_COMPRA");

            entity.HasOne<Cliente>()
                .WithMany()
                .HasForeignKey(d => d.ID_CLIENTE)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.Proveedor)
                .WithMany()
                .HasForeignKey(d => d.ID_PROVEEDOR)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Venta>()
                .WithMany()
                .HasForeignKey(d => d.ID_VENTA)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.Compra)
                .WithMany()
                .HasForeignKey(d => d.ID_COMPRA)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- PAGO_DEUDA ----
        modelBuilder.Entity<PagoDeuda>(entity =>
        {
            entity.ToTable("PAGO_DEUDA");

            entity.HasKey(p => p.ID_PAGO_DEUDA);

            entity.Property(p => p.ID_PAGO_DEUDA)
                .HasColumnName("ID_PAGO_DEUDA");

            entity.Property(p => p.ID_DEUDA)
                .HasColumnName("ID_DEUDA");

            entity.Property(p => p.MONTO)
                .HasColumnName("MONTO")
                .HasColumnType("decimal(18,2)");

            entity.Property(p => p.FECHA)
                .HasColumnName("FECHA");

            entity.Property(p => p.ID_USUARIO)
                .HasColumnName("ID_USUARIO");

            entity.HasOne(p => p.Deuda)
                .WithMany()
                .HasForeignKey(p => p.ID_DEUDA)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ---- PEDIDO ----
        modelBuilder.Entity<Pedido>(entity =>
        {
            entity.ToTable("PEDIDO");

            entity.HasKey(p => p.ID_PEDIDO);

            entity.Property(p => p.ID_PEDIDO)
                .HasColumnName("ID_PEDIDO");

            entity.Property(p => p.ID_SUCURSAL)
                .HasColumnName("ID_SUCURSAL");

            entity.Property(p => p.ID_PROVEEDOR)
                .HasColumnName("ID_PROVEEDOR")
                .IsRequired();

            entity.Property(p => p.ID_USUARIO)
                .HasColumnName("ID_USUARIO");

            entity.Property(p => p.FECHA_PEDIDO)
                .HasColumnName("FECHA_PEDIDO");

            entity.Property(p => p.FECHA_ESPERADA)
                .HasColumnName("FECHA_ESPERADA");

            entity.Property(p => p.TOTAL)
                .HasColumnName("TOTAL")
                .HasColumnType("decimal(18,2)");

            entity.Property(p => p.OBSERVACIONES)
                .HasColumnName("OBSERVACIONES")
                .HasMaxLength(500);

            entity.Property(p => p.ESTADO)
                .HasColumnName("ESTADO")
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(p => p.ID_PEDIDO_ORIGEN)
                .HasColumnName("ID_PEDIDO_ORIGEN");

            entity.Navigation(p => p.RENGLONES)
                .UsePropertyAccessMode(PropertyAccessMode.Field);

            entity.HasOne<Sucursal>()
                .WithMany()
                .HasForeignKey(p => p.ID_SUCURSAL)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Proveedor>()
                .WithMany()
                .HasForeignKey(p => p.ID_PROVEEDOR)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(p => p.ID_USUARIO)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<Pedido>()
                .WithMany()
                .HasForeignKey(p => p.ID_PEDIDO_ORIGEN)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- RENGLON PEDIDO ----
        modelBuilder.Entity<RenglonPedido>(entity =>
        {
            entity.ToTable("RENGLON_PEDIDO");

            entity.HasKey(r => r.ID_RENGLON_PEDIDO);

            entity.Property(r => r.ID_RENGLON_PEDIDO)
                .HasColumnName("ID_RENGLON_PEDIDO");

            entity.Property(r => r.ID_PEDIDO)
                .HasColumnName("ID_PEDIDO");

            entity.Property(r => r.ID_PRODUCTO)
                .HasColumnName("ID_PRODUCTO")
                .IsRequired(false);

            entity.Property(r => r.CANTIDAD_PEDIDA)
                .HasColumnName("CANTIDAD_PEDIDA")
                .HasColumnType("decimal(18,2)");

            entity.Property(r => r.PRECIO_UNITARIO_ESTIMADO)
                .HasColumnName("PRECIO_UNITARIO_ESTIMADO")
                .HasColumnType("decimal(18,2)");

            entity.Property(r => r.SUBTOTAL)
                .HasColumnName("SUBTOTAL")
                .HasColumnType("decimal(18,2)");

            entity.Property(r => r.ESTADO)
                .HasColumnName("ESTADO")
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(r => r.DESCRIPCION)
                .HasColumnName("DESCRIPCION")
                .HasMaxLength(200);

            entity.HasOne<Pedido>()
                .WithMany(p => p.RENGLONES)
                .HasForeignKey(r => r.ID_PEDIDO)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne<Producto>()
                .WithMany()
                .HasForeignKey(r => r.ID_PRODUCTO)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ---- SEED DATA ----
        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        // Seed Medios de Pago
        modelBuilder.Entity<MedioPago>().HasData(
            new MedioPago(1, "EFECTIVO", "Efectivo", true),
            new MedioPago(2, "DEBITO", "Tarjeta Débito", false),
            new MedioPago(3, "CREDITO", "Tarjeta Crédito", false),
            new MedioPago(4, "TRANSFERENCIA", "Transferencia", false),
            new MedioPago(5, "QR", "QR", false)
        );

        // Seed Unidades de Medida (use anonymous type — constructor doesn't accept ID)
        modelBuilder.Entity<UnidadMedida>().HasData(
            new { ID_UNIDAD_MEDIDA = 1, COD_UNIDAD_MEDIDA = "UNIDAD", DESC_UNIDAD_MEDIDA = "Unidades" },
            new { ID_UNIDAD_MEDIDA = 2, COD_UNIDAD_MEDIDA = "KILO", DESC_UNIDAD_MEDIDA = "Kilogramos" },
            new { ID_UNIDAD_MEDIDA = 3, COD_UNIDAD_MEDIDA = "L", DESC_UNIDAD_MEDIDA = "Litros" },
            new { ID_UNIDAD_MEDIDA = 4, COD_UNIDAD_MEDIDA = "ML", DESC_UNIDAD_MEDIDA = "Mililitros" },
            new { ID_UNIDAD_MEDIDA = 5, COD_UNIDAD_MEDIDA = "GR", DESC_UNIDAD_MEDIDA = "Gramos" }
        );

        // Seed admin user (password: admin123)
        modelBuilder.Entity<Usuario>().HasData(
            new
            {
                ID_USUARIO = 1,
                NOMBRE_USUARIO = "admin",
                PASSWORD_HASH = "$2a$11$K4YfGqJ1e4YHIpRMTfoxYO0R9i0RDxG.h1X0As95JXQOYGMjs4eIy",
                ROL = "SuperAdmin",
                MAIL = "admin@posweb.com",
                SUSCRIPCION_ACTIVA = false,
                PIN_HASH = (string?)null,
                ID_USUARIO_RESP = (int?)null,
                ACTIVO = true
            }
        );
    }
}
