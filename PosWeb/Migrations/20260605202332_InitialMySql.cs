using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class InitialMySql : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "CATEGORIA",
                columns: table => new
                {
                    ID_CATEGORIA = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    COD_CATEGORIA = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DESC_CATEGORIA = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CATEGORIA", x => x.ID_CATEGORIA);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "CLIENTE",
                columns: table => new
                {
                    ID_CLIENTE = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    NOMBRE = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TIPO_DOCUMENTO = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NRO_DOCUMENTO = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    COD_CLIENTE = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TELEFONO = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DOMICILIO = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MAIL = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ACTIVO = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CLIENTE", x => x.ID_CLIENTE);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "MEDIO_PAGO",
                columns: table => new
                {
                    ID_MEDIO_PAGO = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    COD_MEDIO_PAGO = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DESC_MEDIO_PAGO = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PAGA_VUELTO = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ACTIVO = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MEDIO_PAGO", x => x.ID_MEDIO_PAGO);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PROVEEDOR",
                columns: table => new
                {
                    ID_PROVEEDOR = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    COD_PROVEEDOR = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NOMBRE = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TIPO_DOCUMENTO = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NRO_DOCUMENTO = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TELEFONO = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DOMICILIO = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MAIL = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ACTIVO = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PROVEEDOR", x => x.ID_PROVEEDOR);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "UNIDAD_MEDIDA",
                columns: table => new
                {
                    ID_UNIDAD_MEDIDA = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    COD_UNIDAD_MEDIDA = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DESC_UNIDAD_MEDIDA = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UNIDAD_MEDIDA", x => x.ID_UNIDAD_MEDIDA);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "USUARIO",
                columns: table => new
                {
                    ID_USUARIO = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    NOMBRE_USUARIO = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PASSWORD_HASH = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PIN_HASH = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MAIL = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ROL = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ACTIVO = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ID_SUCURSAL_DEFAULT = table.Column<int>(type: "int", nullable: true),
                    ID_USUARIO_RESP = table.Column<int>(type: "int", nullable: true),
                    SUSCRIPCION_ACTIVA = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_USUARIO", x => x.ID_USUARIO);
                    table.ForeignKey(
                        name: "FK_USUARIO_USUARIO_ID_USUARIO_RESP",
                        column: x => x.ID_USUARIO_RESP,
                        principalTable: "USUARIO",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PRODUCTO",
                columns: table => new
                {
                    ID_PRODUCTO = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    COD_PRODUCTO = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CODIGO_BARRAS = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DESC_PRODUCTO = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PRECIO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    COSTO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ID_CATEGORIA = table.Column<int>(type: "int", nullable: true),
                    DESC_ADICIONAL = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CONTENIDO = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ID_UNIDAD_MEDIDA = table.Column<int>(type: "int", nullable: true),
                    FECHA_ALTA = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    FECHA_ULTIMA_MOD = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    FECHA_BAJA = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    ACTIVO = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PRODUCTO", x => x.ID_PRODUCTO);
                    table.ForeignKey(
                        name: "FK_PRODUCTO_CATEGORIA_ID_CATEGORIA",
                        column: x => x.ID_CATEGORIA,
                        principalTable: "CATEGORIA",
                        principalColumn: "ID_CATEGORIA",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PRODUCTO_UNIDAD_MEDIDA_ID_UNIDAD_MEDIDA",
                        column: x => x.ID_UNIDAD_MEDIDA,
                        principalTable: "UNIDAD_MEDIDA",
                        principalColumn: "ID_UNIDAD_MEDIDA",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "SUSCRIPCION",
                columns: table => new
                {
                    ID_SUSCRIPCION = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ID_USUARIO_TITULAR = table.Column<int>(type: "int", nullable: false),
                    NIVEL = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ESTADO = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    COSTO_MENSUAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MAX_SUCURSALES = table.Column<int>(type: "int", nullable: false),
                    MAX_ADMIN = table.Column<int>(type: "int", nullable: false),
                    MAX_USUARIOS = table.Column<int>(type: "int", nullable: false),
                    FECHA_INICIO = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    FECHA_FIN = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    PROXIMO_COBRO = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    MERCADOPAGO_PREAPPROVAL_ID = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SUSCRIPCION", x => x.ID_SUSCRIPCION);
                    table.ForeignKey(
                        name: "FK_SUSCRIPCION_USUARIO_ID_USUARIO_TITULAR",
                        column: x => x.ID_USUARIO_TITULAR,
                        principalTable: "USUARIO",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "EMPRESA",
                columns: table => new
                {
                    ID_EMPRESA = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    NOMBRE = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DOCUMENTO = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ID_SUSCRIPCION = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EMPRESA", x => x.ID_EMPRESA);
                    table.ForeignKey(
                        name: "FK_EMPRESA_SUSCRIPCION_ID_SUSCRIPCION",
                        column: x => x.ID_SUSCRIPCION,
                        principalTable: "SUSCRIPCION",
                        principalColumn: "ID_SUSCRIPCION",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "SUCURSAL",
                columns: table => new
                {
                    ID_SUCURSAL = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    COD_SUCURSAL = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DESC_SUCURSAL = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ID_EMPRESA = table.Column<int>(type: "int", nullable: false),
                    ACTIVO = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SUCURSAL", x => x.ID_SUCURSAL);
                    table.ForeignKey(
                        name: "FK_SUCURSAL_EMPRESA_ID_EMPRESA",
                        column: x => x.ID_EMPRESA,
                        principalTable: "EMPRESA",
                        principalColumn: "ID_EMPRESA",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "CAJA",
                columns: table => new
                {
                    ID_CAJA = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ID_SUCURSAL = table.Column<int>(type: "int", nullable: false),
                    ESTADO = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FECHA_APERTURA = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    FECHA_CIERRE = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    MONTO_INICIAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MONTO_CONTADO_EFECTIVO = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MONTO_CONTADO_TARJETAS = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    DIFERENCIA = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    MONTO_GASTOS = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ID_USUARIO_APERTURA = table.Column<int>(type: "int", nullable: false),
                    ID_USUARIO_CIERRE = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CAJA", x => x.ID_CAJA);
                    table.ForeignKey(
                        name: "FK_CAJA_SUCURSAL_ID_SUCURSAL",
                        column: x => x.ID_SUCURSAL,
                        principalTable: "SUCURSAL",
                        principalColumn: "ID_SUCURSAL",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CAJA_USUARIO_ID_USUARIO_APERTURA",
                        column: x => x.ID_USUARIO_APERTURA,
                        principalTable: "USUARIO",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_CAJA_USUARIO_ID_USUARIO_CIERRE",
                        column: x => x.ID_USUARIO_CIERRE,
                        principalTable: "USUARIO",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "STOCK_SUCURSAL",
                columns: table => new
                {
                    ID_PRODUCTO = table.Column<int>(type: "int", nullable: false),
                    ID_SUCURSAL = table.Column<int>(type: "int", nullable: false),
                    STOCK = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_STOCK_SUCURSAL", x => new { x.ID_PRODUCTO, x.ID_SUCURSAL });
                    table.ForeignKey(
                        name: "FK_STOCK_SUCURSAL_PRODUCTO_ID_PRODUCTO",
                        column: x => x.ID_PRODUCTO,
                        principalTable: "PRODUCTO",
                        principalColumn: "ID_PRODUCTO",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_STOCK_SUCURSAL_SUCURSAL_ID_SUCURSAL",
                        column: x => x.ID_SUCURSAL,
                        principalTable: "SUCURSAL",
                        principalColumn: "ID_SUCURSAL",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "VENTA",
                columns: table => new
                {
                    ID_VENTA = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ID_SUCURSAL = table.Column<int>(type: "int", nullable: false),
                    FECHA_VENTA = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    TOTAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ID_USUARIO = table.Column<int>(type: "int", nullable: true),
                    ID_CLIENTE = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VENTA", x => x.ID_VENTA);
                    table.ForeignKey(
                        name: "FK_VENTA_CLIENTE_ID_CLIENTE",
                        column: x => x.ID_CLIENTE,
                        principalTable: "CLIENTE",
                        principalColumn: "ID_CLIENTE",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VENTA_SUCURSAL_ID_SUCURSAL",
                        column: x => x.ID_SUCURSAL,
                        principalTable: "SUCURSAL",
                        principalColumn: "ID_SUCURSAL",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VENTA_USUARIO_ID_USUARIO",
                        column: x => x.ID_USUARIO,
                        principalTable: "USUARIO",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "GASTO",
                columns: table => new
                {
                    ID_GASTO = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ID_CAJA = table.Column<int>(type: "int", nullable: false),
                    MONTO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FECHA_GASTO = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DETALLE = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GASTO", x => x.ID_GASTO);
                    table.ForeignKey(
                        name: "FK_GASTO_CAJA_ID_CAJA",
                        column: x => x.ID_CAJA,
                        principalTable: "CAJA",
                        principalColumn: "ID_CAJA",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PAGO",
                columns: table => new
                {
                    ID_PAGO = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ID_VENTA = table.Column<int>(type: "int", nullable: false),
                    ID_MEDIO_PAGO = table.Column<int>(type: "int", nullable: false),
                    MONTO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CAMBIO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ID_USUARIO_REGISTRA = table.Column<int>(type: "int", nullable: false),
                    ID_CAJA = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PAGO", x => x.ID_PAGO);
                    table.ForeignKey(
                        name: "FK_PAGO_CAJA_ID_CAJA",
                        column: x => x.ID_CAJA,
                        principalTable: "CAJA",
                        principalColumn: "ID_CAJA",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PAGO_MEDIO_PAGO_ID_MEDIO_PAGO",
                        column: x => x.ID_MEDIO_PAGO,
                        principalTable: "MEDIO_PAGO",
                        principalColumn: "ID_MEDIO_PAGO",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PAGO_VENTA_ID_VENTA",
                        column: x => x.ID_VENTA,
                        principalTable: "VENTA",
                        principalColumn: "ID_VENTA",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "RENGLON_VENTA",
                columns: table => new
                {
                    ID_RENGLON_VENTA = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ID_VENTA = table.Column<int>(type: "int", nullable: false),
                    ID_PRODUCTO = table.Column<int>(type: "int", nullable: false),
                    CANTIDAD = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PRECIO_UNITARIO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SUBTOTAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RENGLON_VENTA", x => x.ID_RENGLON_VENTA);
                    table.ForeignKey(
                        name: "FK_RENGLON_VENTA_PRODUCTO_ID_PRODUCTO",
                        column: x => x.ID_PRODUCTO,
                        principalTable: "PRODUCTO",
                        principalColumn: "ID_PRODUCTO",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RENGLON_VENTA_VENTA_ID_VENTA",
                        column: x => x.ID_VENTA,
                        principalTable: "VENTA",
                        principalColumn: "ID_VENTA",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "COMPRA",
                columns: table => new
                {
                    ID_COMPRA = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    NUMERO_COMPROBANTE = table.Column<int>(type: "int", nullable: false),
                    ID_SUCURSAL = table.Column<int>(type: "int", nullable: false),
                    ID_PROVEEDOR = table.Column<int>(type: "int", nullable: false),
                    ID_USUARIO = table.Column<int>(type: "int", nullable: false),
                    ID_GASTO = table.Column<int>(type: "int", nullable: true),
                    FECHA_COMPRA = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    TOTAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_COMPRA", x => x.ID_COMPRA);
                    table.ForeignKey(
                        name: "FK_COMPRA_GASTO_ID_GASTO",
                        column: x => x.ID_GASTO,
                        principalTable: "GASTO",
                        principalColumn: "ID_GASTO",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_COMPRA_PROVEEDOR_ID_PROVEEDOR",
                        column: x => x.ID_PROVEEDOR,
                        principalTable: "PROVEEDOR",
                        principalColumn: "ID_PROVEEDOR",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_COMPRA_SUCURSAL_ID_SUCURSAL",
                        column: x => x.ID_SUCURSAL,
                        principalTable: "SUCURSAL",
                        principalColumn: "ID_SUCURSAL",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_COMPRA_USUARIO_ID_USUARIO",
                        column: x => x.ID_USUARIO,
                        principalTable: "USUARIO",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "DEUDA",
                columns: table => new
                {
                    ID_DEUDA = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ID_CLIENTE = table.Column<int>(type: "int", nullable: true),
                    ID_PROVEEDOR = table.Column<int>(type: "int", nullable: true),
                    MONTO_DEUDA = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FECHA_DEUDA = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    FECHA_PAGO = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    PAGO = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    ID_VENTA = table.Column<int>(type: "int", nullable: true),
                    ID_COMPRA = table.Column<int>(type: "int", nullable: true),
                    ProveedorID_PROVEEDOR = table.Column<int>(type: "int", nullable: false),
                    CompraID_COMPRA = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DEUDA", x => x.ID_DEUDA);
                    table.ForeignKey(
                        name: "FK_DEUDA_CLIENTE_ID_CLIENTE",
                        column: x => x.ID_CLIENTE,
                        principalTable: "CLIENTE",
                        principalColumn: "ID_CLIENTE",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DEUDA_COMPRA_CompraID_COMPRA",
                        column: x => x.CompraID_COMPRA,
                        principalTable: "COMPRA",
                        principalColumn: "ID_COMPRA",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DEUDA_COMPRA_ID_COMPRA",
                        column: x => x.ID_COMPRA,
                        principalTable: "COMPRA",
                        principalColumn: "ID_COMPRA",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DEUDA_PROVEEDOR_ID_PROVEEDOR",
                        column: x => x.ID_PROVEEDOR,
                        principalTable: "PROVEEDOR",
                        principalColumn: "ID_PROVEEDOR",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DEUDA_PROVEEDOR_ProveedorID_PROVEEDOR",
                        column: x => x.ProveedorID_PROVEEDOR,
                        principalTable: "PROVEEDOR",
                        principalColumn: "ID_PROVEEDOR",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DEUDA_VENTA_ID_VENTA",
                        column: x => x.ID_VENTA,
                        principalTable: "VENTA",
                        principalColumn: "ID_VENTA",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "RENGLON_COMPRA",
                columns: table => new
                {
                    ID_RENGLON_COMPRA = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ID_COMPRA = table.Column<int>(type: "int", nullable: false),
                    ID_PRODUCTO = table.Column<int>(type: "int", nullable: false),
                    CANTIDAD = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PRECIO_UNITARIO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SUBTOTAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RENGLON_COMPRA", x => x.ID_RENGLON_COMPRA);
                    table.ForeignKey(
                        name: "FK_RENGLON_COMPRA_COMPRA_ID_COMPRA",
                        column: x => x.ID_COMPRA,
                        principalTable: "COMPRA",
                        principalColumn: "ID_COMPRA",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RENGLON_COMPRA_PRODUCTO_ID_PRODUCTO",
                        column: x => x.ID_PRODUCTO,
                        principalTable: "PRODUCTO",
                        principalColumn: "ID_PRODUCTO",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "MEDIO_PAGO",
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
                table: "UNIDAD_MEDIDA",
                columns: new[] { "ID_UNIDAD_MEDIDA", "COD_UNIDAD_MEDIDA", "DESC_UNIDAD_MEDIDA" },
                values: new object[,]
                {
                    { 1, "UNIDAD", "Unidad" },
                    { 2, "KILO", "Kilogramo" },
                    { 3, "LITRO", "Litro" }
                });

            migrationBuilder.InsertData(
                table: "USUARIO",
                columns: new[] { "ID_USUARIO", "ACTIVO", "ID_SUCURSAL_DEFAULT", "ID_USUARIO_RESP", "MAIL", "NOMBRE_USUARIO", "PASSWORD_HASH", "PIN_HASH", "ROL", "SUSCRIPCION_ACTIVA" },
                values: new object[] { 1, true, null, null, "admin@posweb.com", "admin", "$2a$11$K4YfGqJ1e4YHIpRMTfoxYO0R9i0RDxG.h1X0As95JXQOYGMjs4eIy", null, "SuperAdmin", false });

            migrationBuilder.CreateIndex(
                name: "IX_CAJA_ID_SUCURSAL",
                table: "CAJA",
                column: "ID_SUCURSAL");

            migrationBuilder.CreateIndex(
                name: "IX_CAJA_ID_USUARIO_APERTURA",
                table: "CAJA",
                column: "ID_USUARIO_APERTURA");

            migrationBuilder.CreateIndex(
                name: "IX_CAJA_ID_USUARIO_CIERRE",
                table: "CAJA",
                column: "ID_USUARIO_CIERRE");

            migrationBuilder.CreateIndex(
                name: "IX_CATEGORIA_COD_CATEGORIA",
                table: "CATEGORIA",
                column: "COD_CATEGORIA",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CLIENTE_COD_CLIENTE",
                table: "CLIENTE",
                column: "COD_CLIENTE",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_COMPRA_ID_GASTO",
                table: "COMPRA",
                column: "ID_GASTO");

            migrationBuilder.CreateIndex(
                name: "IX_COMPRA_ID_PROVEEDOR",
                table: "COMPRA",
                column: "ID_PROVEEDOR");

            migrationBuilder.CreateIndex(
                name: "IX_COMPRA_ID_SUCURSAL",
                table: "COMPRA",
                column: "ID_SUCURSAL");

            migrationBuilder.CreateIndex(
                name: "IX_COMPRA_ID_USUARIO",
                table: "COMPRA",
                column: "ID_USUARIO");

            migrationBuilder.CreateIndex(
                name: "IX_DEUDA_CompraID_COMPRA",
                table: "DEUDA",
                column: "CompraID_COMPRA");

            migrationBuilder.CreateIndex(
                name: "IX_DEUDA_ID_CLIENTE",
                table: "DEUDA",
                column: "ID_CLIENTE");

            migrationBuilder.CreateIndex(
                name: "IX_DEUDA_ID_COMPRA",
                table: "DEUDA",
                column: "ID_COMPRA");

            migrationBuilder.CreateIndex(
                name: "IX_DEUDA_ID_PROVEEDOR",
                table: "DEUDA",
                column: "ID_PROVEEDOR");

            migrationBuilder.CreateIndex(
                name: "IX_DEUDA_ID_VENTA",
                table: "DEUDA",
                column: "ID_VENTA");

            migrationBuilder.CreateIndex(
                name: "IX_DEUDA_ProveedorID_PROVEEDOR",
                table: "DEUDA",
                column: "ProveedorID_PROVEEDOR");

            migrationBuilder.CreateIndex(
                name: "IX_EMPRESA_ID_SUSCRIPCION",
                table: "EMPRESA",
                column: "ID_SUSCRIPCION");

            migrationBuilder.CreateIndex(
                name: "IX_GASTO_ID_CAJA",
                table: "GASTO",
                column: "ID_CAJA");

            migrationBuilder.CreateIndex(
                name: "IX_MEDIO_PAGO_COD_MEDIO_PAGO",
                table: "MEDIO_PAGO",
                column: "COD_MEDIO_PAGO",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_PAGO_ID_CAJA",
                table: "PAGO",
                column: "ID_CAJA");

            migrationBuilder.CreateIndex(
                name: "IX_PAGO_ID_MEDIO_PAGO",
                table: "PAGO",
                column: "ID_MEDIO_PAGO");

            migrationBuilder.CreateIndex(
                name: "IX_PAGO_ID_VENTA",
                table: "PAGO",
                column: "ID_VENTA");

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCTO_COD_PRODUCTO",
                table: "PRODUCTO",
                column: "COD_PRODUCTO",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCTO_ID_CATEGORIA",
                table: "PRODUCTO",
                column: "ID_CATEGORIA");

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCTO_ID_UNIDAD_MEDIDA",
                table: "PRODUCTO",
                column: "ID_UNIDAD_MEDIDA");

            migrationBuilder.CreateIndex(
                name: "IX_PROVEEDOR_COD_PROVEEDOR",
                table: "PROVEEDOR",
                column: "COD_PROVEEDOR",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLON_COMPRA_ID_COMPRA",
                table: "RENGLON_COMPRA",
                column: "ID_COMPRA");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLON_COMPRA_ID_PRODUCTO",
                table: "RENGLON_COMPRA",
                column: "ID_PRODUCTO");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLON_VENTA_ID_PRODUCTO",
                table: "RENGLON_VENTA",
                column: "ID_PRODUCTO");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLON_VENTA_ID_VENTA",
                table: "RENGLON_VENTA",
                column: "ID_VENTA");

            migrationBuilder.CreateIndex(
                name: "IX_STOCK_SUCURSAL_ID_SUCURSAL",
                table: "STOCK_SUCURSAL",
                column: "ID_SUCURSAL");

            migrationBuilder.CreateIndex(
                name: "IX_SUCURSAL_COD_SUCURSAL",
                table: "SUCURSAL",
                column: "COD_SUCURSAL",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_SUCURSAL_ID_EMPRESA",
                table: "SUCURSAL",
                column: "ID_EMPRESA");

            migrationBuilder.CreateIndex(
                name: "IX_SUSCRIPCION_ID_USUARIO_TITULAR",
                table: "SUSCRIPCION",
                column: "ID_USUARIO_TITULAR");

            migrationBuilder.CreateIndex(
                name: "IX_UNIDAD_MEDIDA_COD_UNIDAD_MEDIDA",
                table: "UNIDAD_MEDIDA",
                column: "COD_UNIDAD_MEDIDA",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_USUARIO_ID_USUARIO_RESP",
                table: "USUARIO",
                column: "ID_USUARIO_RESP");

            migrationBuilder.CreateIndex(
                name: "IX_USUARIO_NOMBRE_USUARIO",
                table: "USUARIO",
                column: "NOMBRE_USUARIO",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_VENTA_ID_CLIENTE",
                table: "VENTA",
                column: "ID_CLIENTE");

            migrationBuilder.CreateIndex(
                name: "IX_VENTA_ID_SUCURSAL",
                table: "VENTA",
                column: "ID_SUCURSAL");

            migrationBuilder.CreateIndex(
                name: "IX_VENTA_ID_USUARIO",
                table: "VENTA",
                column: "ID_USUARIO");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DEUDA");

            migrationBuilder.DropTable(
                name: "PAGO");

            migrationBuilder.DropTable(
                name: "RENGLON_COMPRA");

            migrationBuilder.DropTable(
                name: "RENGLON_VENTA");

            migrationBuilder.DropTable(
                name: "STOCK_SUCURSAL");

            migrationBuilder.DropTable(
                name: "MEDIO_PAGO");

            migrationBuilder.DropTable(
                name: "COMPRA");

            migrationBuilder.DropTable(
                name: "VENTA");

            migrationBuilder.DropTable(
                name: "PRODUCTO");

            migrationBuilder.DropTable(
                name: "GASTO");

            migrationBuilder.DropTable(
                name: "PROVEEDOR");

            migrationBuilder.DropTable(
                name: "CLIENTE");

            migrationBuilder.DropTable(
                name: "CATEGORIA");

            migrationBuilder.DropTable(
                name: "UNIDAD_MEDIDA");

            migrationBuilder.DropTable(
                name: "CAJA");

            migrationBuilder.DropTable(
                name: "SUCURSAL");

            migrationBuilder.DropTable(
                name: "EMPRESA");

            migrationBuilder.DropTable(
                name: "SUSCRIPCION");

            migrationBuilder.DropTable(
                name: "USUARIO");
        }
    }
}
