using Microsoft.EntityFrameworkCore;
using PosWeb.Domain;

namespace PosWeb.Data;

public class PosDbContext : DbContext
{
    public PosDbContext(DbContextOptions<PosDbContext> options)
        : base(options)
    {
    }

    public DbSet<Producto> Productos { get; set; }
    public DbSet<Sucursal> Sucursales { get; set; }
    public DbSet<Venta> Ventas { get; set; }
    public DbSet<RenglonVenta> RenglonesVenta { get; set; }
    public DbSet<StockSucursal> StockSucursales { get; set; }
    public DbSet<Usuario> Usuarios { get; set; }
    public DbSet<MedioPago> MediosPago { get; set; }
    public DbSet<PagoVenta> PagosVenta { get; set; }
    public DbSet<Caja> Cajas { get; set; }
    public DbSet<Cliente> Clientes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // PRODUCTO
        modelBuilder.Entity<Producto>(entity =>
        {
            entity.ToTable("PRODUCTOS");

            entity.HasKey(p => p.ID_PRODUCTO);

            entity.Property(p => p.ID_PRODUCTO)
                .HasColumnName("ID_PRODUCTO");

            entity.Property(p => p.CODIGO_BARRA)
                .HasColumnName("CODIGO_BARRA")
                .IsRequired();

            entity.Property(p => p.NOMBRE)
                .HasColumnName("NOMBRE")
                .IsRequired();

            entity.Property(p => p.PRECIO)
                .HasColumnName("PRECIO");

            entity.Property(p => p.COSTO)
                .HasColumnName("COSTO");

            entity.Property(p => p.STOCK)
                .HasColumnName("STOCK");

            entity.Property(p => p.ACTIVO)
                .HasColumnName("ACTIVO");

            entity.HasIndex(p => p.CODIGO_BARRA);
            entity.HasIndex(p => p.NOMBRE);
        });

        // SUCURSAL
        modelBuilder.Entity<Sucursal>(entity =>
        {
            entity.ToTable("SUCURSALES");

            entity.HasKey(s => s.ID_SUCURSAL);

            entity.Property(s => s.ID_SUCURSAL)
                .HasColumnName("ID_SUCURSAL");

            entity.Property(s => s.NUMERO)
                .HasColumnName("NUMERO");

            entity.Property(s => s.CODIGO)
                .HasColumnName("CODIGO")
                .IsRequired();

            entity.Property(s => s.NOMBRE)
                .HasColumnName("NOMBRE")
                .IsRequired();

            entity.Property(s => s.ACTIVO)
                .HasColumnName("ACTIVO");
        });

        // VENTA
        modelBuilder.Entity<Venta>(entity =>
        {
            entity.ToTable("VENTAS");

            entity.HasKey(v => v.ID_VENTA);

            entity.Property(v => v.ID_VENTA)
                .HasColumnName("ID_VENTA");

            entity.Property(v => v.ID_SUCURSAL)
                .HasColumnName("ID_SUCURSAL");

            entity.Property(v => v.FECHA)
                .HasColumnName("FECHA");

            entity.Property(v => v.TOTAL)
                .HasColumnName("TOTAL");

            entity.Property(v => v.ID_USUARIO)
                .HasColumnName("ID_USUARIO");

            entity.Property(v => v.ID_CAJA)
                .HasColumnName("ID_CAJA");

            entity.Property(v => v.ID_CLIENTE)
                .HasColumnName("ID_CLIENTE");

            entity.HasOne<Sucursal>()
                .WithMany()
                .HasForeignKey(v => v.ID_SUCURSAL);

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(v => v.ID_USUARIO)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne<Cliente>()
                .WithMany()
                .HasForeignKey(v => v.ID_CLIENTE)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // RENGLON VENTA
        modelBuilder.Entity<RenglonVenta>(entity =>
        {
            entity.ToTable("RENGLONES_VENTA");

            entity.HasKey(r => r.ID_RENGLON_VENTA);

            entity.Property(r => r.ID_RENGLON_VENTA)
                .HasColumnName("ID_RENGLON_VENTA");

            entity.Property(r => r.ID_PRODUCTO)
                .HasColumnName("ID_PRODUCTO");

            entity.Property(r => r.CANTIDAD)
                .HasColumnName("CANTIDAD");

            entity.Property(r => r.PRECIO_UNITARIO)
                .HasColumnName("PRECIO_UNITARIO");

            entity.Property(r => r.SUBTOTAL)
                .HasColumnName("SUBTOTAL");

            entity.HasOne<Venta>()
                .WithMany(v => v.RENGLONES)
                .HasForeignKey("ID_VENTA");
        });

        // STOCK POR SUCURSAL
        modelBuilder.Entity<StockSucursal>(entity =>
        {
            entity.ToTable("STOCK_POR_SUCURSAL");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Id)
                .HasColumnName("ID_STOCK_SUCURSAL");

            entity.Property(x => x.IdProducto)
                .HasColumnName("ID_PRODUCTO");

            entity.Property(x => x.IdSucursal)
                .HasColumnName("ID_SUCURSAL");

            entity.Property(x => x.Stock)
                .HasColumnName("STOCK");

            entity.HasIndex(x => new { x.IdProducto, x.IdSucursal }).IsUnique();

            entity.HasOne(x => x.Producto)
                .WithMany()
                .HasForeignKey(x => x.IdProducto);

            entity.HasOne(x => x.Sucursal)
                .WithMany()
                .HasForeignKey(x => x.IdSucursal);
        });

        // USUARIO
        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("USUARIOS");

            entity.HasKey(u => u.ID_USUARIO);

            entity.Property(u => u.ID_USUARIO)
                .HasColumnName("ID_USUARIO");

            entity.Property(u => u.NOMBRE_USUARIO)
                .HasColumnName("NOMBRE_USUARIO")
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(u => u.PASSWORD_HASH)
                .HasColumnName("PASSWORD_HASH")
                .IsRequired();

            entity.Property(u => u.PIN_HASH)
                .HasColumnName("PIN_HASH");

            entity.Property(u => u.MAIL)
                .HasColumnName("MAIL")
                .HasMaxLength(150);

            entity.Property(u => u.ROL)
                .HasColumnName("ROL")
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(u => u.ACTIVO)
                .HasColumnName("ACTIVO");

            entity.Property(u => u.ID_SUCURSAL_DEFAULT)
                .HasColumnName("ID_SUCURSAL_DEFAULT");

            entity.Property(u => u.ID_USUARIO_RESPONSABLE)
                .HasColumnName("ID_USUARIO_RESPONSABLE");

            entity.Property(u => u.EMPRESA_REPRESENTA)
                .HasColumnName("EMPRESA_REPRESENTA")
                .HasMaxLength(120);

            entity.HasIndex(u => u.NOMBRE_USUARIO).IsUnique();

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(u => u.ID_USUARIO_RESPONSABLE)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // MEDIO PAGO
        modelBuilder.Entity<MedioPago>(entity =>
        {
            entity.ToTable("MEDIOS_PAGO");

            entity.HasKey(m => m.ID_MEDIO_PAGO);

            entity.Property(m => m.ID_MEDIO_PAGO)
                .HasColumnName("ID_MEDIO_PAGO");

            entity.Property(m => m.NOMBRE)
                .HasColumnName("NOMBRE")
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(m => m.PAGA_VUELTO)
                .HasColumnName("PAGA_VUELTO");

            entity.Property(m => m.ACTIVO)
                .HasColumnName("ACTIVO");
        });

        // PAGO VENTA
        modelBuilder.Entity<PagoVenta>(entity =>
        {
            entity.ToTable("PAGOS_VENTA");

            entity.HasKey(p => p.ID_PAGO_VENTA);

            entity.Property(p => p.ID_PAGO_VENTA)
                .HasColumnName("ID_PAGO_VENTA");

            entity.Property(p => p.ID_VENTA)
                .HasColumnName("ID_VENTA");

            entity.Property(p => p.ID_MEDIO_PAGO)
                .HasColumnName("ID_MEDIO_PAGO");

            entity.Property(p => p.MONTO)
                .HasColumnName("MONTO")
                .HasColumnType("decimal(18,2)");

            entity.Property(p => p.CON_CAMBIO)
                .HasColumnName("CON_CAMBIO")
                .HasColumnType("decimal(18,2)");

            entity.Property(p => p.CAMBIO)
                .HasColumnName("CAMBIO")
                .HasColumnType("decimal(18,2)");

            entity.Property(p => p.ID_USUARIO_REGISTRA)
                .HasColumnName("ID_USUARIO_REGISTRA");

            entity.HasOne<Venta>()
                .WithMany()
                .HasForeignKey(p => p.ID_VENTA);

            entity.HasOne<MedioPago>()
                .WithMany()
                .HasForeignKey(p => p.ID_MEDIO_PAGO);

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(p => p.ID_USUARIO_REGISTRA)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // CAJA
        modelBuilder.Entity<Caja>(entity =>
        {
            entity.ToTable("CAJAS");

            entity.HasKey(c => c.ID_CAJA);

            entity.Property(c => c.ID_CAJA)
                .HasColumnName("ID_CAJA");

            entity.Property(c => c.ID_SUCURSAL)
                .HasColumnName("ID_SUCURSAL");

            entity.Property(c => c.ESTADO)
                .HasColumnName("ESTADO")
                .IsRequired()
                .HasMaxLength(20);

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

            entity.Property(c => c.DIFERENCIA)
                .HasColumnName("DIFERENCIA")
                .HasColumnType("decimal(18,2)");

            entity.Property(c => c.ID_USUARIO_APERTURA)
                .HasColumnName("ID_USUARIO_APERTURA");

            entity.Property(c => c.ID_USUARIO_CIERRE)
                .HasColumnName("ID_USUARIO_CIERRE");

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(c => c.ID_USUARIO_APERTURA)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne<Usuario>()
                .WithMany()
                .HasForeignKey(c => c.ID_USUARIO_CIERRE)
                .OnDelete(DeleteBehavior.NoAction);
        });

        // CLIENTE
        modelBuilder.Entity<Cliente>(entity =>
        {
            entity.ToTable("CLIENTES");

            entity.HasKey(c => c.ID_CLIENTE);

            entity.Property(c => c.ID_CLIENTE)
                .HasColumnName("ID_CLIENTE");

            entity.Property(c => c.NOMBRE)
                .HasColumnName("NOMBRE")
                .IsRequired()
                .HasMaxLength(200);

            entity.Property(c => c.TIPO_DOCUMENTO)
                .HasColumnName("TIPO_DOCUMENTO")
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(c => c.NUMERO_DOCUMENTO)
                .HasColumnName("NUMERO_DOCUMENTO")
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(c => c.IVA_CONDICION)
                .HasColumnName("IVA_CONDICION")
                .IsRequired()
                .HasMaxLength(30);

            entity.Property(c => c.TELEFONO)
                .HasColumnName("TELEFONO")
                .HasMaxLength(50);

            entity.Property(c => c.DOMICILIO)
                .HasColumnName("DOMICILIO")
                .HasMaxLength(200);

            entity.Property(c => c.ACTIVO)
                .HasColumnName("ACTIVO");

            entity.HasIndex(c => new { c.TIPO_DOCUMENTO, c.NUMERO_DOCUMENTO }).IsUnique();
        });

        // Seed data for MediosPago
        modelBuilder.Entity<MedioPago>().HasData(
            new MedioPago(1, "Efectivo", true),
            new MedioPago(2, "Tarjeta Débito", false),
            new MedioPago(3, "Tarjeta Crédito", false),
            new MedioPago(4, "Transferencia", false),
            new MedioPago(5, "Cuenta Corriente", false)
        );

        // Seed admin user (password: 123)
        modelBuilder.Entity<Usuario>().HasData(
            new Usuario(1, "admin", "$2a$11$K4YfGqJ1e4YHIpQqJ1e4Y.ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", "Admin")
        );
    }
}
