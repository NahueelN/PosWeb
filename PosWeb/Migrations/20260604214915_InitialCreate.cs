using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CATEGORIAS",
                columns: table => new
                {
                    ID_CATEGORIA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    COD_CATEGORIA = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    DESC_CATEGORIA = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CATEGORIAS", x => x.ID_CATEGORIA);
                });

            migrationBuilder.CreateTable(
                name: "CLIENTES",
                columns: table => new
                {
                    ID_CLIENTE = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    NOMBRE = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    TIPO_DOCUMENTO = table.Column<string>(type: "TEXT", nullable: false),
                    NRO_DOCUMENTO = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    COD_CLIENTE = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    TELEFONO = table.Column<string>(type: "TEXT", nullable: true),
                    DOMICILIO = table.Column<string>(type: "TEXT", nullable: true),
                    MAIL = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CLIENTES", x => x.ID_CLIENTE);
                });

            migrationBuilder.CreateTable(
                name: "MEDIOS_PAGO",
                columns: table => new
                {
                    ID_MEDIO_PAGO = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    COD_MEDIO_PAGO = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    DESC_MEDIO_PAGO = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    PAGA_VUELTO = table.Column<bool>(type: "INTEGER", nullable: false),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MEDIOS_PAGO", x => x.ID_MEDIO_PAGO);
                });

            migrationBuilder.CreateTable(
                name: "PROVEEDORES",
                columns: table => new
                {
                    ID_PROVEEDOR = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    COD_PROVEEDOR = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    NOMBRE = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    TIPO_DOCUMENTO = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    NRO_DOCUMENTO = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    TELEFONO = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    DOMICILIO = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    MAIL = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PROVEEDORES", x => x.ID_PROVEEDOR);
                });

            migrationBuilder.CreateTable(
                name: "UNIDADES_MEDIDA",
                columns: table => new
                {
                    ID_UNIDAD_MEDIDA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    COD_UNIDAD_MEDIDA = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    DESC_UNIDAD_MEDIDA = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UNIDADES_MEDIDA", x => x.ID_UNIDAD_MEDIDA);
                });

            migrationBuilder.CreateTable(
                name: "USUARIOS",
                columns: table => new
                {
                    ID_USUARIO = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    NOMBRE_USUARIO = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    PASSWORD_HASH = table.Column<string>(type: "TEXT", nullable: false),
                    PIN_HASH = table.Column<string>(type: "TEXT", nullable: true),
                    MAIL = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    ROL = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false),
                    ID_SUCURSAL_DEFAULT = table.Column<int>(type: "INTEGER", nullable: true),
                    ID_USUARIO_RESP = table.Column<int>(type: "INTEGER", nullable: true),
                    SUSCRIPCION_ACTIVA = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_USUARIOS", x => x.ID_USUARIO);
                    table.ForeignKey(
                        name: "FK_USUARIOS_USUARIOS_ID_USUARIO_RESP",
                        column: x => x.ID_USUARIO_RESP,
                        principalTable: "USUARIOS",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PRODUCTOS",
                columns: table => new
                {
                    ID_PRODUCTO = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    COD_PRODUCTO = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    CODIGO_BARRAS = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    DESC_PRODUCTO = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    PRECIO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    COSTO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ID_CATEGORIA = table.Column<int>(type: "INTEGER", nullable: true),
                    DESC_ADICIONAL = table.Column<string>(type: "TEXT", nullable: true),
                    CONTENIDO = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ID_UNIDAD_MEDIDA = table.Column<int>(type: "INTEGER", nullable: true),
                    FECHA_ALTA = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FECHA_ULTIMA_MOD = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FECHA_BAJA = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PRODUCTOS", x => x.ID_PRODUCTO);
                    table.ForeignKey(
                        name: "FK_PRODUCTOS_CATEGORIAS_ID_CATEGORIA",
                        column: x => x.ID_CATEGORIA,
                        principalTable: "CATEGORIAS",
                        principalColumn: "ID_CATEGORIA",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PRODUCTOS_UNIDADES_MEDIDA_ID_UNIDAD_MEDIDA",
                        column: x => x.ID_UNIDAD_MEDIDA,
                        principalTable: "UNIDADES_MEDIDA",
                        principalColumn: "ID_UNIDAD_MEDIDA",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SUSCRIPCIONES",
                columns: table => new
                {
                    ID_SUSCRIPCION = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_USUARIO_TITULAR = table.Column<int>(type: "INTEGER", nullable: false),
                    NIVEL = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ESTADO = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    COSTO_MENSUAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MAX_SUCURSALES = table.Column<int>(type: "INTEGER", nullable: false),
                    MAX_ADMIN = table.Column<int>(type: "INTEGER", nullable: false),
                    MAX_USUARIOS = table.Column<int>(type: "INTEGER", nullable: false),
                    FECHA_INICIO = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FECHA_FIN = table.Column<DateTime>(type: "TEXT", nullable: true),
                    PROXIMO_COBRO = table.Column<DateTime>(type: "TEXT", nullable: true),
                    MERCADOPAGO_PREAPPROVAL_ID = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SUSCRIPCIONES", x => x.ID_SUSCRIPCION);
                    table.ForeignKey(
                        name: "FK_SUSCRIPCIONES_USUARIOS_ID_USUARIO_TITULAR",
                        column: x => x.ID_USUARIO_TITULAR,
                        principalTable: "USUARIOS",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EMPRESAS",
                columns: table => new
                {
                    ID_EMPRESA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    NOMBRE = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    DOCUMENTO = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ID_SUSCRIPCION = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EMPRESAS", x => x.ID_EMPRESA);
                    table.ForeignKey(
                        name: "FK_EMPRESAS_SUSCRIPCIONES_ID_SUSCRIPCION",
                        column: x => x.ID_SUSCRIPCION,
                        principalTable: "SUSCRIPCIONES",
                        principalColumn: "ID_SUSCRIPCION",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SUCURSALES",
                columns: table => new
                {
                    ID_SUCURSAL = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    COD_SUCURSAL = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    DESC_SUCURSAL = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    ID_EMPRESA = table.Column<int>(type: "INTEGER", nullable: false),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SUCURSALES", x => x.ID_SUCURSAL);
                    table.ForeignKey(
                        name: "FK_SUCURSALES_EMPRESAS_ID_EMPRESA",
                        column: x => x.ID_EMPRESA,
                        principalTable: "EMPRESAS",
                        principalColumn: "ID_EMPRESA",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CAJAS",
                columns: table => new
                {
                    ID_CAJA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_SUCURSAL = table.Column<int>(type: "INTEGER", nullable: false),
                    ESTADO = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    FECHA_APERTURA = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FECHA_CIERRE = table.Column<DateTime>(type: "TEXT", nullable: true),
                    MONTO_INICIAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MONTO_CONTADO_EFECTIVO = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MONTO_CONTADO_TARJETAS = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    DIFERENCIA = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MONTO_GASTOS = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ID_USUARIO_APERTURA = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_USUARIO_CIERRE = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CAJAS", x => x.ID_CAJA);
                    table.ForeignKey(
                        name: "FK_CAJAS_SUCURSALES_ID_SUCURSAL",
                        column: x => x.ID_SUCURSAL,
                        principalTable: "SUCURSALES",
                        principalColumn: "ID_SUCURSAL",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CAJAS_USUARIOS_ID_USUARIO_APERTURA",
                        column: x => x.ID_USUARIO_APERTURA,
                        principalTable: "USUARIOS",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CAJAS_USUARIOS_ID_USUARIO_CIERRE",
                        column: x => x.ID_USUARIO_CIERRE,
                        principalTable: "USUARIOS",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "STOCK_POR_SUCURSAL",
                columns: table => new
                {
                    ID_PRODUCTO = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_SUCURSAL = table.Column<int>(type: "INTEGER", nullable: false),
                    STOCK = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_STOCK_POR_SUCURSAL", x => new { x.ID_PRODUCTO, x.ID_SUCURSAL });
                    table.ForeignKey(
                        name: "FK_STOCK_POR_SUCURSAL_PRODUCTOS_ID_PRODUCTO",
                        column: x => x.ID_PRODUCTO,
                        principalTable: "PRODUCTOS",
                        principalColumn: "ID_PRODUCTO",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_STOCK_POR_SUCURSAL_SUCURSALES_ID_SUCURSAL",
                        column: x => x.ID_SUCURSAL,
                        principalTable: "SUCURSALES",
                        principalColumn: "ID_SUCURSAL",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VENTAS",
                columns: table => new
                {
                    ID_VENTA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_SUCURSAL = table.Column<int>(type: "INTEGER", nullable: false),
                    FECHA_VENTA = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TOTAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ID_USUARIO = table.Column<int>(type: "INTEGER", nullable: true),
                    ID_CLIENTE = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VENTAS", x => x.ID_VENTA);
                    table.ForeignKey(
                        name: "FK_VENTAS_CLIENTES_ID_CLIENTE",
                        column: x => x.ID_CLIENTE,
                        principalTable: "CLIENTES",
                        principalColumn: "ID_CLIENTE",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VENTAS_SUCURSALES_ID_SUCURSAL",
                        column: x => x.ID_SUCURSAL,
                        principalTable: "SUCURSALES",
                        principalColumn: "ID_SUCURSAL",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VENTAS_USUARIOS_ID_USUARIO",
                        column: x => x.ID_USUARIO,
                        principalTable: "USUARIOS",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "GASTOS",
                columns: table => new
                {
                    ID_GASTO = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_CAJA = table.Column<int>(type: "INTEGER", nullable: false),
                    MONTO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FECHA_GASTO = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DETALLE = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GASTOS", x => x.ID_GASTO);
                    table.ForeignKey(
                        name: "FK_GASTOS_CAJAS_ID_CAJA",
                        column: x => x.ID_CAJA,
                        principalTable: "CAJAS",
                        principalColumn: "ID_CAJA",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PAGOS",
                columns: table => new
                {
                    ID_PAGO = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_VENTA = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_MEDIO_PAGO = table.Column<int>(type: "INTEGER", nullable: false),
                    MONTO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CAMBIO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ID_USUARIO_REGISTRA = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_CAJA = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PAGOS", x => x.ID_PAGO);
                    table.ForeignKey(
                        name: "FK_PAGOS_CAJAS_ID_CAJA",
                        column: x => x.ID_CAJA,
                        principalTable: "CAJAS",
                        principalColumn: "ID_CAJA",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PAGOS_MEDIOS_PAGO_ID_MEDIO_PAGO",
                        column: x => x.ID_MEDIO_PAGO,
                        principalTable: "MEDIOS_PAGO",
                        principalColumn: "ID_MEDIO_PAGO",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PAGOS_VENTAS_ID_VENTA",
                        column: x => x.ID_VENTA,
                        principalTable: "VENTAS",
                        principalColumn: "ID_VENTA",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RENGLONES_VENTA",
                columns: table => new
                {
                    ID_RENGLON_VENTA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_VENTA = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_PRODUCTO = table.Column<int>(type: "INTEGER", nullable: false),
                    CANTIDAD = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PRECIO_UNITARIO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SUBTOTAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RENGLONES_VENTA", x => x.ID_RENGLON_VENTA);
                    table.ForeignKey(
                        name: "FK_RENGLONES_VENTA_PRODUCTOS_ID_PRODUCTO",
                        column: x => x.ID_PRODUCTO,
                        principalTable: "PRODUCTOS",
                        principalColumn: "ID_PRODUCTO",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RENGLONES_VENTA_VENTAS_ID_VENTA",
                        column: x => x.ID_VENTA,
                        principalTable: "VENTAS",
                        principalColumn: "ID_VENTA",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "COMPRAS",
                columns: table => new
                {
                    ID_COMPRA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    NUMERO_COMPROBANTE = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_SUCURSAL = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_PROVEEDOR = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_USUARIO = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_GASTO = table.Column<int>(type: "INTEGER", nullable: true),
                    FECHA_COMPRA = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TOTAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_COMPRAS", x => x.ID_COMPRA);
                    table.ForeignKey(
                        name: "FK_COMPRAS_GASTOS_ID_GASTO",
                        column: x => x.ID_GASTO,
                        principalTable: "GASTOS",
                        principalColumn: "ID_GASTO",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_COMPRAS_PROVEEDORES_ID_PROVEEDOR",
                        column: x => x.ID_PROVEEDOR,
                        principalTable: "PROVEEDORES",
                        principalColumn: "ID_PROVEEDOR",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_COMPRAS_SUCURSALES_ID_SUCURSAL",
                        column: x => x.ID_SUCURSAL,
                        principalTable: "SUCURSALES",
                        principalColumn: "ID_SUCURSAL",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_COMPRAS_USUARIOS_ID_USUARIO",
                        column: x => x.ID_USUARIO,
                        principalTable: "USUARIOS",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DEUDAS",
                columns: table => new
                {
                    ID_DEUDA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_CLIENTE = table.Column<int>(type: "INTEGER", nullable: true),
                    ID_PROVEEDOR = table.Column<int>(type: "INTEGER", nullable: true),
                    MONTO_DEUDA = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FECHA_DEUDA = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FECHA_PAGO = table.Column<DateTime>(type: "TEXT", nullable: true),
                    PAGO = table.Column<bool>(type: "INTEGER", nullable: false),
                    ID_VENTA = table.Column<int>(type: "INTEGER", nullable: true),
                    ID_COMPRA = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DEUDAS", x => x.ID_DEUDA);
                    table.ForeignKey(
                        name: "FK_DEUDAS_CLIENTES_ID_CLIENTE",
                        column: x => x.ID_CLIENTE,
                        principalTable: "CLIENTES",
                        principalColumn: "ID_CLIENTE",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DEUDAS_COMPRAS_ID_COMPRA",
                        column: x => x.ID_COMPRA,
                        principalTable: "COMPRAS",
                        principalColumn: "ID_COMPRA",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DEUDAS_PROVEEDORES_ID_PROVEEDOR",
                        column: x => x.ID_PROVEEDOR,
                        principalTable: "PROVEEDORES",
                        principalColumn: "ID_PROVEEDOR",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DEUDAS_VENTAS_ID_VENTA",
                        column: x => x.ID_VENTA,
                        principalTable: "VENTAS",
                        principalColumn: "ID_VENTA",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "RENGLONES_COMPRA",
                columns: table => new
                {
                    ID_RENGLON_COMPRA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_COMPRA = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_PRODUCTO = table.Column<int>(type: "INTEGER", nullable: false),
                    CANTIDAD = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PRECIO_UNITARIO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SUBTOTAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RENGLONES_COMPRA", x => x.ID_RENGLON_COMPRA);
                    table.ForeignKey(
                        name: "FK_RENGLONES_COMPRA_COMPRAS_ID_COMPRA",
                        column: x => x.ID_COMPRA,
                        principalTable: "COMPRAS",
                        principalColumn: "ID_COMPRA",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RENGLONES_COMPRA_PRODUCTOS_ID_PRODUCTO",
                        column: x => x.ID_PRODUCTO,
                        principalTable: "PRODUCTOS",
                        principalColumn: "ID_PRODUCTO",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "MEDIOS_PAGO",
                columns: new[] { "ID_MEDIO_PAGO", "ACTIVO", "COD_MEDIO_PAGO", "DESC_MEDIO_PAGO", "PAGA_VUELTO" },
                values: new object[,]
                {
                    { 1, true, "EFECTIVO", "Efectivo", true },
                    { 2, true, "DEBITO", "Tarjeta Débito", true },
                    { 3, true, "CREDITO", "Tarjeta Crédito", false },
                    { 4, true, "TRANSFERENCIA", "Transferencia", false },
                    { 5, true, "QR", "QR", true }
                });

            migrationBuilder.InsertData(
                table: "UNIDADES_MEDIDA",
                columns: new[] { "ID_UNIDAD_MEDIDA", "COD_UNIDAD_MEDIDA", "DESC_UNIDAD_MEDIDA" },
                values: new object[,]
                {
                    { 1, "UNIDAD", "Unidad" },
                    { 2, "KILO", "Kilogramo" },
                    { 3, "LITRO", "Litro" }
                });

            migrationBuilder.InsertData(
                table: "USUARIOS",
                columns: new[] { "ID_USUARIO", "ACTIVO", "ID_SUCURSAL_DEFAULT", "ID_USUARIO_RESP", "MAIL", "NOMBRE_USUARIO", "PASSWORD_HASH", "PIN_HASH", "ROL", "SUSCRIPCION_ACTIVA" },
                values: new object[] { 1, true, null, null, "admin@posweb.com", "admin", "$2a$11$K4YfGqJ1e4YHIpRMTfoxYO0R9i0RDxG.h1X0As95JXQOYGMjs4eIy", null, "SuperAdmin", false });

            migrationBuilder.CreateIndex(
                name: "IX_CAJAS_ID_SUCURSAL",
                table: "CAJAS",
                column: "ID_SUCURSAL");

            migrationBuilder.CreateIndex(
                name: "IX_CAJAS_ID_USUARIO_APERTURA",
                table: "CAJAS",
                column: "ID_USUARIO_APERTURA");

            migrationBuilder.CreateIndex(
                name: "IX_CAJAS_ID_USUARIO_CIERRE",
                table: "CAJAS",
                column: "ID_USUARIO_CIERRE");

            migrationBuilder.CreateIndex(
                name: "IX_CATEGORIAS_COD_CATEGORIA",
                table: "CATEGORIAS",
                column: "COD_CATEGORIA",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CLIENTES_COD_CLIENTE",
                table: "CLIENTES",
                column: "COD_CLIENTE",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_COMPRAS_ID_GASTO",
                table: "COMPRAS",
                column: "ID_GASTO");

            migrationBuilder.CreateIndex(
                name: "IX_COMPRAS_ID_PROVEEDOR",
                table: "COMPRAS",
                column: "ID_PROVEEDOR");

            migrationBuilder.CreateIndex(
                name: "IX_COMPRAS_ID_SUCURSAL",
                table: "COMPRAS",
                column: "ID_SUCURSAL");

            migrationBuilder.CreateIndex(
                name: "IX_COMPRAS_ID_USUARIO",
                table: "COMPRAS",
                column: "ID_USUARIO");

            migrationBuilder.CreateIndex(
                name: "IX_DEUDAS_ID_CLIENTE",
                table: "DEUDAS",
                column: "ID_CLIENTE");

            migrationBuilder.CreateIndex(
                name: "IX_DEUDAS_ID_COMPRA",
                table: "DEUDAS",
                column: "ID_COMPRA");

            migrationBuilder.CreateIndex(
                name: "IX_DEUDAS_ID_PROVEEDOR",
                table: "DEUDAS",
                column: "ID_PROVEEDOR");

            migrationBuilder.CreateIndex(
                name: "IX_DEUDAS_ID_VENTA",
                table: "DEUDAS",
                column: "ID_VENTA");

            migrationBuilder.CreateIndex(
                name: "IX_EMPRESAS_ID_SUSCRIPCION",
                table: "EMPRESAS",
                column: "ID_SUSCRIPCION");

            migrationBuilder.CreateIndex(
                name: "IX_GASTOS_ID_CAJA",
                table: "GASTOS",
                column: "ID_CAJA");

            migrationBuilder.CreateIndex(
                name: "IX_MEDIOS_PAGO_COD_MEDIO_PAGO",
                table: "MEDIOS_PAGO",
                column: "COD_MEDIO_PAGO",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_PAGOS_ID_CAJA",
                table: "PAGOS",
                column: "ID_CAJA");

            migrationBuilder.CreateIndex(
                name: "IX_PAGOS_ID_MEDIO_PAGO",
                table: "PAGOS",
                column: "ID_MEDIO_PAGO");

            migrationBuilder.CreateIndex(
                name: "IX_PAGOS_ID_VENTA",
                table: "PAGOS",
                column: "ID_VENTA");

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCTOS_COD_PRODUCTO",
                table: "PRODUCTOS",
                column: "COD_PRODUCTO",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCTOS_ID_CATEGORIA",
                table: "PRODUCTOS",
                column: "ID_CATEGORIA");

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCTOS_ID_UNIDAD_MEDIDA",
                table: "PRODUCTOS",
                column: "ID_UNIDAD_MEDIDA");

            migrationBuilder.CreateIndex(
                name: "IX_PROVEEDORES_COD_PROVEEDOR",
                table: "PROVEEDORES",
                column: "COD_PROVEEDOR",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLONES_COMPRA_ID_COMPRA",
                table: "RENGLONES_COMPRA",
                column: "ID_COMPRA");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLONES_COMPRA_ID_PRODUCTO",
                table: "RENGLONES_COMPRA",
                column: "ID_PRODUCTO");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLONES_VENTA_ID_PRODUCTO",
                table: "RENGLONES_VENTA",
                column: "ID_PRODUCTO");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLONES_VENTA_ID_VENTA",
                table: "RENGLONES_VENTA",
                column: "ID_VENTA");

            migrationBuilder.CreateIndex(
                name: "IX_STOCK_POR_SUCURSAL_ID_SUCURSAL",
                table: "STOCK_POR_SUCURSAL",
                column: "ID_SUCURSAL");

            migrationBuilder.CreateIndex(
                name: "IX_SUCURSALES_COD_SUCURSAL",
                table: "SUCURSALES",
                column: "COD_SUCURSAL",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_SUCURSALES_ID_EMPRESA",
                table: "SUCURSALES",
                column: "ID_EMPRESA");

            migrationBuilder.CreateIndex(
                name: "IX_SUSCRIPCIONES_ID_USUARIO_TITULAR",
                table: "SUSCRIPCIONES",
                column: "ID_USUARIO_TITULAR");

            migrationBuilder.CreateIndex(
                name: "IX_UNIDADES_MEDIDA_COD_UNIDAD_MEDIDA",
                table: "UNIDADES_MEDIDA",
                column: "COD_UNIDAD_MEDIDA",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_USUARIOS_ID_USUARIO_RESP",
                table: "USUARIOS",
                column: "ID_USUARIO_RESP");

            migrationBuilder.CreateIndex(
                name: "IX_USUARIOS_NOMBRE_USUARIO",
                table: "USUARIOS",
                column: "NOMBRE_USUARIO",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_VENTAS_ID_CLIENTE",
                table: "VENTAS",
                column: "ID_CLIENTE");

            migrationBuilder.CreateIndex(
                name: "IX_VENTAS_ID_SUCURSAL",
                table: "VENTAS",
                column: "ID_SUCURSAL");

            migrationBuilder.CreateIndex(
                name: "IX_VENTAS_ID_USUARIO",
                table: "VENTAS",
                column: "ID_USUARIO");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DEUDAS");

            migrationBuilder.DropTable(
                name: "PAGOS");

            migrationBuilder.DropTable(
                name: "RENGLONES_COMPRA");

            migrationBuilder.DropTable(
                name: "RENGLONES_VENTA");

            migrationBuilder.DropTable(
                name: "STOCK_POR_SUCURSAL");

            migrationBuilder.DropTable(
                name: "MEDIOS_PAGO");

            migrationBuilder.DropTable(
                name: "COMPRAS");

            migrationBuilder.DropTable(
                name: "VENTAS");

            migrationBuilder.DropTable(
                name: "PRODUCTOS");

            migrationBuilder.DropTable(
                name: "GASTOS");

            migrationBuilder.DropTable(
                name: "PROVEEDORES");

            migrationBuilder.DropTable(
                name: "CLIENTES");

            migrationBuilder.DropTable(
                name: "CATEGORIAS");

            migrationBuilder.DropTable(
                name: "UNIDADES_MEDIDA");

            migrationBuilder.DropTable(
                name: "CAJAS");

            migrationBuilder.DropTable(
                name: "SUCURSALES");

            migrationBuilder.DropTable(
                name: "EMPRESAS");

            migrationBuilder.DropTable(
                name: "SUSCRIPCIONES");

            migrationBuilder.DropTable(
                name: "USUARIOS");
        }
    }
}
