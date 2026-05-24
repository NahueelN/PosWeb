using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class PosCoreCompleto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ID_CAJA",
                table: "VENTAS",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ID_CLIENTE",
                table: "VENTAS",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ID_USUARIO",
                table: "VENTAS",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CLIENTES",
                columns: table => new
                {
                    ID_CLIENTE = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    NOMBRE = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    TIPO_DOCUMENTO = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    NUMERO_DOCUMENTO = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    IVA_CONDICION = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    TELEFONO = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    DOMICILIO = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
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
                    NOMBRE = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    PAGA_VUELTO = table.Column<bool>(type: "INTEGER", nullable: false),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MEDIOS_PAGO", x => x.ID_MEDIO_PAGO);
                });

            migrationBuilder.CreateTable(
                name: "USUARIOS",
                columns: table => new
                {
                    ID_USUARIO = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    NOMBRE_USUARIO = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    PASSWORD_HASH = table.Column<string>(type: "TEXT", nullable: false),
                    PIN_HASH = table.Column<string>(type: "TEXT", nullable: true),
                    ROL = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false),
                    ID_SUCURSAL_DEFAULT = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_USUARIOS", x => x.ID_USUARIO);
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
                    ID_USUARIO_APERTURA = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_USUARIO_CIERRE = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CAJAS", x => x.ID_CAJA);
                    table.ForeignKey(
                        name: "FK_CAJAS_USUARIOS_ID_USUARIO_APERTURA",
                        column: x => x.ID_USUARIO_APERTURA,
                        principalTable: "USUARIOS",
                        principalColumn: "ID_USUARIO");
                    table.ForeignKey(
                        name: "FK_CAJAS_USUARIOS_ID_USUARIO_CIERRE",
                        column: x => x.ID_USUARIO_CIERRE,
                        principalTable: "USUARIOS",
                        principalColumn: "ID_USUARIO");
                });

            migrationBuilder.CreateTable(
                name: "PAGOS_VENTA",
                columns: table => new
                {
                    ID_PAGO_VENTA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_VENTA = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_MEDIO_PAGO = table.Column<int>(type: "INTEGER", nullable: false),
                    MONTO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CON_CAMBIO = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    CAMBIO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ID_USUARIO_REGISTRA = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PAGOS_VENTA", x => x.ID_PAGO_VENTA);
                    table.ForeignKey(
                        name: "FK_PAGOS_VENTA_MEDIOS_PAGO_ID_MEDIO_PAGO",
                        column: x => x.ID_MEDIO_PAGO,
                        principalTable: "MEDIOS_PAGO",
                        principalColumn: "ID_MEDIO_PAGO",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PAGOS_VENTA_USUARIOS_ID_USUARIO_REGISTRA",
                        column: x => x.ID_USUARIO_REGISTRA,
                        principalTable: "USUARIOS",
                        principalColumn: "ID_USUARIO");
                    table.ForeignKey(
                        name: "FK_PAGOS_VENTA_VENTAS_ID_VENTA",
                        column: x => x.ID_VENTA,
                        principalTable: "VENTAS",
                        principalColumn: "ID_VENTA",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "MEDIOS_PAGO",
                columns: new[] { "ID_MEDIO_PAGO", "ACTIVO", "NOMBRE", "PAGA_VUELTO" },
                values: new object[,]
                {
                    { 1, true, "Efectivo", true },
                    { 2, true, "Tarjeta Débito", false },
                    { 3, true, "Tarjeta Crédito", false },
                    { 4, true, "Transferencia", false },
                    { 5, true, "Cuenta Corriente", false }
                });

            migrationBuilder.InsertData(
                table: "USUARIOS",
                columns: new[] { "ID_USUARIO", "ACTIVO", "ID_SUCURSAL_DEFAULT", "NOMBRE_USUARIO", "PASSWORD_HASH", "PIN_HASH", "ROL" },
                values: new object[] { 1, true, null, "admin", "$2a$11$K4YfGqJ1e4YHIpQqJ1e4Y.ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", null, "Admin" });

            migrationBuilder.CreateIndex(
                name: "IX_VENTAS_ID_CLIENTE",
                table: "VENTAS",
                column: "ID_CLIENTE");

            migrationBuilder.CreateIndex(
                name: "IX_VENTAS_ID_USUARIO",
                table: "VENTAS",
                column: "ID_USUARIO");

            migrationBuilder.CreateIndex(
                name: "IX_CAJAS_ID_USUARIO_APERTURA",
                table: "CAJAS",
                column: "ID_USUARIO_APERTURA");

            migrationBuilder.CreateIndex(
                name: "IX_CAJAS_ID_USUARIO_CIERRE",
                table: "CAJAS",
                column: "ID_USUARIO_CIERRE");

            migrationBuilder.CreateIndex(
                name: "IX_CLIENTES_TIPO_DOCUMENTO_NUMERO_DOCUMENTO",
                table: "CLIENTES",
                columns: new[] { "TIPO_DOCUMENTO", "NUMERO_DOCUMENTO" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PAGOS_VENTA_ID_MEDIO_PAGO",
                table: "PAGOS_VENTA",
                column: "ID_MEDIO_PAGO");

            migrationBuilder.CreateIndex(
                name: "IX_PAGOS_VENTA_ID_USUARIO_REGISTRA",
                table: "PAGOS_VENTA",
                column: "ID_USUARIO_REGISTRA");

            migrationBuilder.CreateIndex(
                name: "IX_PAGOS_VENTA_ID_VENTA",
                table: "PAGOS_VENTA",
                column: "ID_VENTA");

            migrationBuilder.CreateIndex(
                name: "IX_USUARIOS_NOMBRE_USUARIO",
                table: "USUARIOS",
                column: "NOMBRE_USUARIO",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_VENTAS_CLIENTES_ID_CLIENTE",
                table: "VENTAS",
                column: "ID_CLIENTE",
                principalTable: "CLIENTES",
                principalColumn: "ID_CLIENTE",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_VENTAS_USUARIOS_ID_USUARIO",
                table: "VENTAS",
                column: "ID_USUARIO",
                principalTable: "USUARIOS",
                principalColumn: "ID_USUARIO",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VENTAS_CLIENTES_ID_CLIENTE",
                table: "VENTAS");

            migrationBuilder.DropForeignKey(
                name: "FK_VENTAS_USUARIOS_ID_USUARIO",
                table: "VENTAS");

            migrationBuilder.DropTable(
                name: "CAJAS");

            migrationBuilder.DropTable(
                name: "CLIENTES");

            migrationBuilder.DropTable(
                name: "PAGOS_VENTA");

            migrationBuilder.DropTable(
                name: "MEDIOS_PAGO");

            migrationBuilder.DropTable(
                name: "USUARIOS");

            migrationBuilder.DropIndex(
                name: "IX_VENTAS_ID_CLIENTE",
                table: "VENTAS");

            migrationBuilder.DropIndex(
                name: "IX_VENTAS_ID_USUARIO",
                table: "VENTAS");

            migrationBuilder.DropColumn(
                name: "ID_CAJA",
                table: "VENTAS");

            migrationBuilder.DropColumn(
                name: "ID_CLIENTE",
                table: "VENTAS");

            migrationBuilder.DropColumn(
                name: "ID_USUARIO",
                table: "VENTAS");
        }
    }
}
