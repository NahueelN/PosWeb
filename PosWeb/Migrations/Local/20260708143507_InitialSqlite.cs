using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PosWeb.Migrations.Local
{
    /// <inheritdoc />
    public partial class InitialSqlite : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CATEGORIA",
                columns: table => new
                {
                    ID_CATEGORIA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    COD_CATEGORIA = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    DESC_CATEGORIA = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    MARGEN_GANANCIA = table.Column<decimal>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CATEGORIA", x => x.ID_CATEGORIA);
                });

            migrationBuilder.CreateTable(
                name: "CATEGORIA_GASTO",
                columns: table => new
                {
                    ID_CATEGORIA_GASTO = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DESCRIPCION = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CATEGORIA_GASTO", x => x.ID_CATEGORIA_GASTO);
                });

            migrationBuilder.CreateTable(
                name: "CLIENTE",
                columns: table => new
                {
                    ID_CLIENTE = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    NOMBRE = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    TIPO_DOCUMENTO = table.Column<string>(type: "TEXT", nullable: false),
                    NRO_DOCUMENTO = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    COD_CLIENTE = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    TELEFONO = table.Column<string>(type: "TEXT", nullable: true),
                    DOMICILIO = table.Column<string>(type: "TEXT", nullable: true),
                    MAIL = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    IVA_CONDICION = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CLIENTE", x => x.ID_CLIENTE);
                });

            migrationBuilder.CreateTable(
                name: "COMBO",
                columns: table => new
                {
                    ID_COMBO = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    COD_COMBO = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    DESC_COMBO = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    PRECIO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false),
                    FECHA_INICIO = table.Column<DateTime>(type: "TEXT", nullable: true),
                    FECHA_FIN = table.Column<DateTime>(type: "TEXT", nullable: true),
                    DIAS_SEMANA = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_COMBO", x => x.ID_COMBO);
                });

            migrationBuilder.CreateTable(
                name: "MEDIO_PAGO",
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
                    table.PrimaryKey("PK_MEDIO_PAGO", x => x.ID_MEDIO_PAGO);
                });

            migrationBuilder.CreateTable(
                name: "PROVEEDOR",
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
                    IVA_CONDICION = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PROVEEDOR", x => x.ID_PROVEEDOR);
                });

            migrationBuilder.CreateTable(
                name: "UNIDAD_MEDIDA",
                columns: table => new
                {
                    ID_UNIDAD_MEDIDA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    COD_UNIDAD_MEDIDA = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    DESC_UNIDAD_MEDIDA = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UNIDAD_MEDIDA", x => x.ID_UNIDAD_MEDIDA);
                });

            migrationBuilder.CreateTable(
                name: "PRODUCTO",
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
                    MARCA = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    MARGEN_GANANCIA = table.Column<decimal>(type: "TEXT", nullable: true),
                    SEGUIR_STOCK = table.Column<bool>(type: "INTEGER", nullable: false),
                    ES_PESABLE = table.Column<bool>(type: "INTEGER", nullable: false),
                    FECHA_ALTA = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FECHA_ULTIMA_MOD = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FECHA_BAJA = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false)
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
                });

            migrationBuilder.CreateTable(
                name: "COMBO_ITEM",
                columns: table => new
                {
                    ID_COMBO_ITEM = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_COMBO = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_PRODUCTO = table.Column<int>(type: "INTEGER", nullable: false),
                    CANTIDAD = table.Column<decimal>(type: "decimal(18,3)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_COMBO_ITEM", x => x.ID_COMBO_ITEM);
                    table.ForeignKey(
                        name: "FK_COMBO_ITEM_COMBO_ID_COMBO",
                        column: x => x.ID_COMBO,
                        principalTable: "COMBO",
                        principalColumn: "ID_COMBO",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_COMBO_ITEM_PRODUCTO_ID_PRODUCTO",
                        column: x => x.ID_PRODUCTO,
                        principalTable: "PRODUCTO",
                        principalColumn: "ID_PRODUCTO",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "OFERTA",
                columns: table => new
                {
                    ID_OFERTA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    FECHA_INICIO = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FECHA_FIN = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ID_PRODUCTO = table.Column<int>(type: "INTEGER", nullable: false),
                    DESCUENTO = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false),
                    DIAS_SEMANA = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OFERTA", x => x.ID_OFERTA);
                    table.ForeignKey(
                        name: "FK_OFERTA_PRODUCTO_ID_PRODUCTO",
                        column: x => x.ID_PRODUCTO,
                        principalTable: "PRODUCTO",
                        principalColumn: "ID_PRODUCTO",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CAJA",
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
                    table.PrimaryKey("PK_CAJA", x => x.ID_CAJA);
                });

            migrationBuilder.CreateTable(
                name: "GASTO",
                columns: table => new
                {
                    ID_GASTO = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_CAJA = table.Column<int>(type: "INTEGER", nullable: true),
                    MONTO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FECHA_GASTO = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DETALLE = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    ANULADO = table.Column<bool>(type: "INTEGER", nullable: false),
                    ID_USUARIO = table.Column<int>(type: "INTEGER", nullable: true)
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
                });

            migrationBuilder.CreateTable(
                name: "COMPRA",
                columns: table => new
                {
                    ID_COMPRA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    NUMERO_COMPROBANTE = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_SUCURSAL = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_PROVEEDOR = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_USUARIO = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_GASTO = table.Column<int>(type: "INTEGER", nullable: true),
                    ID_PEDIDO = table.Column<int>(type: "INTEGER", nullable: true),
                    FECHA_COMPRA = table.Column<DateTime>(type: "TEXT", nullable: false),
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
                });

            migrationBuilder.CreateTable(
                name: "RENGLON_COMPRA",
                columns: table => new
                {
                    ID_RENGLON_COMPRA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_COMPRA = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_PRODUCTO = table.Column<int>(type: "INTEGER", nullable: false),
                    CANTIDAD = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
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
                });

            migrationBuilder.CreateTable(
                name: "DEUDA",
                columns: table => new
                {
                    ID_DEUDA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_CLIENTE = table.Column<int>(type: "INTEGER", nullable: true),
                    ID_PROVEEDOR = table.Column<int>(type: "INTEGER", nullable: true),
                    MONTO_DEUDA = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FECHA_DEUDA = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FECHA_PAGO = table.Column<DateTime>(type: "TEXT", nullable: true),
                    MONTO_PAGADO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PAGO = table.Column<bool>(type: "INTEGER", nullable: false),
                    ID_VENTA = table.Column<int>(type: "INTEGER", nullable: true),
                    ID_COMPRA = table.Column<int>(type: "INTEGER", nullable: true)
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
                });

            migrationBuilder.CreateTable(
                name: "PAGO_DEUDA",
                columns: table => new
                {
                    ID_PAGO_DEUDA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_DEUDA = table.Column<int>(type: "INTEGER", nullable: false),
                    MONTO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FECHA = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ID_USUARIO = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PAGO_DEUDA", x => x.ID_PAGO_DEUDA);
                    table.ForeignKey(
                        name: "FK_PAGO_DEUDA_DEUDA_ID_DEUDA",
                        column: x => x.ID_DEUDA,
                        principalTable: "DEUDA",
                        principalColumn: "ID_DEUDA",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "EMPRESA",
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
                    table.PrimaryKey("PK_EMPRESA", x => x.ID_EMPRESA);
                });

            migrationBuilder.CreateTable(
                name: "SUCURSAL",
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
                    table.PrimaryKey("PK_SUCURSAL", x => x.ID_SUCURSAL);
                    table.ForeignKey(
                        name: "FK_SUCURSAL_EMPRESA_ID_EMPRESA",
                        column: x => x.ID_EMPRESA,
                        principalTable: "EMPRESA",
                        principalColumn: "ID_EMPRESA",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "USUARIO",
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
                    SUSCRIPCION_ACTIVA = table.Column<bool>(type: "INTEGER", nullable: false),
                    ID_SUCURSAL_DEFAULT = table.Column<int>(type: "INTEGER", nullable: true),
                    ID_USUARIO_RESP = table.Column<int>(type: "INTEGER", nullable: true),
                    ID_EMPRESA = table.Column<int>(type: "INTEGER", nullable: true),
                    ID_USUARIO_RESPONSABLE = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_USUARIO", x => x.ID_USUARIO);
                    table.ForeignKey(
                        name: "FK_USUARIO_EMPRESA_ID_EMPRESA",
                        column: x => x.ID_EMPRESA,
                        principalTable: "EMPRESA",
                        principalColumn: "ID_EMPRESA",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_USUARIO_USUARIO_ID_USUARIO_RESP",
                        column: x => x.ID_USUARIO_RESP,
                        principalTable: "USUARIO",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "STOCK_SUCURSAL",
                columns: table => new
                {
                    ID_PRODUCTO = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_SUCURSAL = table.Column<int>(type: "INTEGER", nullable: false),
                    STOCK = table.Column<decimal>(type: "decimal(18,3)", nullable: false)
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
                });

            migrationBuilder.CreateTable(
                name: "PEDIDO",
                columns: table => new
                {
                    ID_PEDIDO = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_SUCURSAL = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_PROVEEDOR = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_USUARIO = table.Column<int>(type: "INTEGER", nullable: false),
                    FECHA_PEDIDO = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FECHA_ESPERADA = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TOTAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OBSERVACIONES = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    ESTADO = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ID_PEDIDO_ORIGEN = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PEDIDO", x => x.ID_PEDIDO);
                    table.ForeignKey(
                        name: "FK_PEDIDO_PEDIDO_ID_PEDIDO_ORIGEN",
                        column: x => x.ID_PEDIDO_ORIGEN,
                        principalTable: "PEDIDO",
                        principalColumn: "ID_PEDIDO",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PEDIDO_PROVEEDOR_ID_PROVEEDOR",
                        column: x => x.ID_PROVEEDOR,
                        principalTable: "PROVEEDOR",
                        principalColumn: "ID_PROVEEDOR",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PEDIDO_SUCURSAL_ID_SUCURSAL",
                        column: x => x.ID_SUCURSAL,
                        principalTable: "SUCURSAL",
                        principalColumn: "ID_SUCURSAL",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PEDIDO_USUARIO_ID_USUARIO",
                        column: x => x.ID_USUARIO,
                        principalTable: "USUARIO",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SUSCRIPCION",
                columns: table => new
                {
                    ID_SUSCRIPCION = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_USUARIO_TITULAR = table.Column<int>(type: "INTEGER", nullable: false),
                    NIVEL = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ESTADO = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    COSTO_MENSUAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    MAX_SUCURSALES = table.Column<int>(type: "INTEGER", nullable: true),
                    MAX_ADMIN = table.Column<int>(type: "INTEGER", nullable: true),
                    MAX_USUARIOS = table.Column<int>(type: "INTEGER", nullable: true),
                    FECHA_INICIO = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FECHA_FIN = table.Column<DateTime>(type: "TEXT", nullable: true),
                    PROXIMO_COBRO = table.Column<DateTime>(type: "TEXT", nullable: true),
                    MERCADOPAGO_PREAPPROVAL_ID = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true)
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
                });

            migrationBuilder.CreateTable(
                name: "VENTA",
                columns: table => new
                {
                    ID_VENTA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_SUCURSAL = table.Column<int>(type: "INTEGER", nullable: false),
                    FECHA_VENTA = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TOTAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ID_USUARIO = table.Column<int>(type: "INTEGER", nullable: true),
                    ID_CLIENTE = table.Column<int>(type: "INTEGER", nullable: true),
                    ANULADA = table.Column<bool>(type: "INTEGER", nullable: false)
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
                });

            migrationBuilder.CreateTable(
                name: "RENGLON_PEDIDO",
                columns: table => new
                {
                    ID_RENGLON_PEDIDO = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_PEDIDO = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_PRODUCTO = table.Column<int>(type: "INTEGER", nullable: true),
                    CANTIDAD_PEDIDA = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PRECIO_UNITARIO_ESTIMADO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SUBTOTAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ESTADO = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    DESCRIPCION = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RENGLON_PEDIDO", x => x.ID_RENGLON_PEDIDO);
                    table.ForeignKey(
                        name: "FK_RENGLON_PEDIDO_PEDIDO_ID_PEDIDO",
                        column: x => x.ID_PEDIDO,
                        principalTable: "PEDIDO",
                        principalColumn: "ID_PEDIDO",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_RENGLON_PEDIDO_PRODUCTO_ID_PRODUCTO",
                        column: x => x.ID_PRODUCTO,
                        principalTable: "PRODUCTO",
                        principalColumn: "ID_PRODUCTO",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PAGO",
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
                });

            migrationBuilder.CreateTable(
                name: "RENGLON_VENTA",
                columns: table => new
                {
                    ID_RENGLON_VENTA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_VENTA = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_PRODUCTO = table.Column<int>(type: "INTEGER", nullable: true),
                    ID_COMBO = table.Column<int>(type: "INTEGER", nullable: true),
                    ID_OFERTA = table.Column<int>(type: "INTEGER", nullable: true),
                    CANTIDAD = table.Column<decimal>(type: "decimal(18,3)", nullable: false),
                    PRECIO_UNITARIO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SUBTOTAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RENGLON_VENTA", x => x.ID_RENGLON_VENTA);
                    table.ForeignKey(
                        name: "FK_RENGLON_VENTA_COMBO_ID_COMBO",
                        column: x => x.ID_COMBO,
                        principalTable: "COMBO",
                        principalColumn: "ID_COMBO",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_RENGLON_VENTA_OFERTA_ID_OFERTA",
                        column: x => x.ID_OFERTA,
                        principalTable: "OFERTA",
                        principalColumn: "ID_OFERTA",
                        onDelete: ReferentialAction.Restrict);
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
                });

            migrationBuilder.InsertData(
                table: "MEDIO_PAGO",
                columns: new[] { "ID_MEDIO_PAGO", "ACTIVO", "COD_MEDIO_PAGO", "DESC_MEDIO_PAGO", "PAGA_VUELTO" },
                values: new object[,]
                {
                    { 1, true, "EFECTIVO", "Efectivo", true },
                    { 2, true, "DEBITO", "Tarjeta Débito", false },
                    { 3, true, "CREDITO", "Tarjeta Crédito", false },
                    { 4, true, "TRANSFERENCIA", "Transferencia", false },
                    { 5, true, "QR", "QR", false }
                });

            migrationBuilder.InsertData(
                table: "UNIDAD_MEDIDA",
                columns: new[] { "ID_UNIDAD_MEDIDA", "COD_UNIDAD_MEDIDA", "DESC_UNIDAD_MEDIDA" },
                values: new object[,]
                {
                    { 1, "UNIDAD", "Unidades" },
                    { 2, "KILO", "Kilogramos" },
                    { 3, "L", "Litros" },
                    { 4, "ML", "Mililitros" },
                    { 5, "GR", "Gramos" }
                });

            migrationBuilder.InsertData(
                table: "USUARIO",
                columns: new[] { "ID_USUARIO", "ACTIVO", "ID_EMPRESA", "ID_SUCURSAL_DEFAULT", "ID_USUARIO_RESP", "ID_USUARIO_RESPONSABLE", "MAIL", "NOMBRE_USUARIO", "PASSWORD_HASH", "PIN_HASH", "ROL", "SUSCRIPCION_ACTIVA" },
                values: new object[] { 1, true, null, null, null, null, "admin@posweb.com", "admin", "$2a$11$K4YfGqJ1e4YHIpRMTfoxYO0R9i0RDxG.h1X0As95JXQOYGMjs4eIy", null, "SuperAdmin", false });

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
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_COMBO_COD_COMBO",
                table: "COMBO",
                column: "COD_COMBO",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_COMBO_ITEM_ID_COMBO",
                table: "COMBO_ITEM",
                column: "ID_COMBO");

            migrationBuilder.CreateIndex(
                name: "IX_COMBO_ITEM_ID_PRODUCTO",
                table: "COMBO_ITEM",
                column: "ID_PRODUCTO");

            migrationBuilder.CreateIndex(
                name: "IX_COMPRA_ID_GASTO",
                table: "COMPRA",
                column: "ID_GASTO");

            migrationBuilder.CreateIndex(
                name: "IX_COMPRA_ID_PEDIDO",
                table: "COMPRA",
                column: "ID_PEDIDO");

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
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_OFERTA_ID_PRODUCTO",
                table: "OFERTA",
                column: "ID_PRODUCTO");

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
                name: "IX_PAGO_DEUDA_ID_DEUDA",
                table: "PAGO_DEUDA",
                column: "ID_DEUDA");

            migrationBuilder.CreateIndex(
                name: "IX_PEDIDO_ID_PEDIDO_ORIGEN",
                table: "PEDIDO",
                column: "ID_PEDIDO_ORIGEN");

            migrationBuilder.CreateIndex(
                name: "IX_PEDIDO_ID_PROVEEDOR",
                table: "PEDIDO",
                column: "ID_PROVEEDOR");

            migrationBuilder.CreateIndex(
                name: "IX_PEDIDO_ID_SUCURSAL",
                table: "PEDIDO",
                column: "ID_SUCURSAL");

            migrationBuilder.CreateIndex(
                name: "IX_PEDIDO_ID_USUARIO",
                table: "PEDIDO",
                column: "ID_USUARIO");

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCTO_COD_PRODUCTO",
                table: "PRODUCTO",
                column: "COD_PRODUCTO",
                unique: true);

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
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_RENGLON_COMPRA_ID_COMPRA",
                table: "RENGLON_COMPRA",
                column: "ID_COMPRA");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLON_COMPRA_ID_PRODUCTO",
                table: "RENGLON_COMPRA",
                column: "ID_PRODUCTO");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLON_PEDIDO_ID_PEDIDO",
                table: "RENGLON_PEDIDO",
                column: "ID_PEDIDO");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLON_PEDIDO_ID_PRODUCTO",
                table: "RENGLON_PEDIDO",
                column: "ID_PRODUCTO");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLON_VENTA_ID_COMBO",
                table: "RENGLON_VENTA",
                column: "ID_COMBO");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLON_VENTA_ID_OFERTA",
                table: "RENGLON_VENTA",
                column: "ID_OFERTA");

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
                unique: true);

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
                name: "IX_USUARIO_ID_EMPRESA",
                table: "USUARIO",
                column: "ID_EMPRESA");

            migrationBuilder.CreateIndex(
                name: "IX_USUARIO_ID_USUARIO_RESP",
                table: "USUARIO",
                column: "ID_USUARIO_RESP");

            migrationBuilder.CreateIndex(
                name: "IX_USUARIO_NOMBRE_USUARIO",
                table: "USUARIO",
                column: "NOMBRE_USUARIO",
                unique: true);

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

            migrationBuilder.AddForeignKey(
                name: "FK_CAJA_SUCURSAL_ID_SUCURSAL",
                table: "CAJA",
                column: "ID_SUCURSAL",
                principalTable: "SUCURSAL",
                principalColumn: "ID_SUCURSAL",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CAJA_USUARIO_ID_USUARIO_APERTURA",
                table: "CAJA",
                column: "ID_USUARIO_APERTURA",
                principalTable: "USUARIO",
                principalColumn: "ID_USUARIO",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_CAJA_USUARIO_ID_USUARIO_CIERRE",
                table: "CAJA",
                column: "ID_USUARIO_CIERRE",
                principalTable: "USUARIO",
                principalColumn: "ID_USUARIO",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_COMPRA_PEDIDO_ID_PEDIDO",
                table: "COMPRA",
                column: "ID_PEDIDO",
                principalTable: "PEDIDO",
                principalColumn: "ID_PEDIDO",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_COMPRA_SUCURSAL_ID_SUCURSAL",
                table: "COMPRA",
                column: "ID_SUCURSAL",
                principalTable: "SUCURSAL",
                principalColumn: "ID_SUCURSAL",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_COMPRA_USUARIO_ID_USUARIO",
                table: "COMPRA",
                column: "ID_USUARIO",
                principalTable: "USUARIO",
                principalColumn: "ID_USUARIO",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DEUDA_VENTA_ID_VENTA",
                table: "DEUDA",
                column: "ID_VENTA",
                principalTable: "VENTA",
                principalColumn: "ID_VENTA",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_EMPRESA_SUSCRIPCION_ID_SUSCRIPCION",
                table: "EMPRESA",
                column: "ID_SUSCRIPCION",
                principalTable: "SUSCRIPCION",
                principalColumn: "ID_SUSCRIPCION",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SUSCRIPCION_USUARIO_ID_USUARIO_TITULAR",
                table: "SUSCRIPCION");

            migrationBuilder.DropTable(
                name: "CATEGORIA_GASTO");

            migrationBuilder.DropTable(
                name: "COMBO_ITEM");

            migrationBuilder.DropTable(
                name: "PAGO");

            migrationBuilder.DropTable(
                name: "PAGO_DEUDA");

            migrationBuilder.DropTable(
                name: "RENGLON_COMPRA");

            migrationBuilder.DropTable(
                name: "RENGLON_PEDIDO");

            migrationBuilder.DropTable(
                name: "RENGLON_VENTA");

            migrationBuilder.DropTable(
                name: "STOCK_SUCURSAL");

            migrationBuilder.DropTable(
                name: "MEDIO_PAGO");

            migrationBuilder.DropTable(
                name: "DEUDA");

            migrationBuilder.DropTable(
                name: "COMBO");

            migrationBuilder.DropTable(
                name: "OFERTA");

            migrationBuilder.DropTable(
                name: "COMPRA");

            migrationBuilder.DropTable(
                name: "VENTA");

            migrationBuilder.DropTable(
                name: "PRODUCTO");

            migrationBuilder.DropTable(
                name: "GASTO");

            migrationBuilder.DropTable(
                name: "PEDIDO");

            migrationBuilder.DropTable(
                name: "CLIENTE");

            migrationBuilder.DropTable(
                name: "CATEGORIA");

            migrationBuilder.DropTable(
                name: "UNIDAD_MEDIDA");

            migrationBuilder.DropTable(
                name: "CAJA");

            migrationBuilder.DropTable(
                name: "PROVEEDOR");

            migrationBuilder.DropTable(
                name: "SUCURSAL");

            migrationBuilder.DropTable(
                name: "USUARIO");

            migrationBuilder.DropTable(
                name: "EMPRESA");

            migrationBuilder.DropTable(
                name: "SUSCRIPCION");
        }
    }
}
