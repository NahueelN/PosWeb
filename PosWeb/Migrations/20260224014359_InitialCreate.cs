using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PRODUCTOS",
                columns: table => new
                {
                    ID_PRODUCTO = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CODIGO_BARRA = table.Column<string>(type: "TEXT", nullable: false),
                    NOMBRE = table.Column<string>(type: "TEXT", nullable: false),
                    PRECIO = table.Column<decimal>(type: "TEXT", nullable: false),
                    COSTO = table.Column<decimal>(type: "TEXT", nullable: false),
                    STOCK = table.Column<int>(type: "INTEGER", nullable: false),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PRODUCTOS", x => x.ID_PRODUCTO);
                });

            migrationBuilder.CreateTable(
                name: "SUCURSALES",
                columns: table => new
                {
                    ID_SUCURSAL = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    NUMERO = table.Column<int>(type: "INTEGER", nullable: false),
                    CODIGO = table.Column<string>(type: "TEXT", nullable: false),
                    NOMBRE = table.Column<string>(type: "TEXT", nullable: false),
                    ACTIVO = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SUCURSALES", x => x.ID_SUCURSAL);
                });

            migrationBuilder.CreateTable(
                name: "VENTAS",
                columns: table => new
                {
                    ID_VENTA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_SUCURSAL = table.Column<int>(type: "INTEGER", nullable: false),
                    FECHA = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TOTAL = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VENTAS", x => x.ID_VENTA);
                    table.ForeignKey(
                        name: "FK_VENTAS_SUCURSALES_ID_SUCURSAL",
                        column: x => x.ID_SUCURSAL,
                        principalTable: "SUCURSALES",
                        principalColumn: "ID_SUCURSAL",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RENGLONES_VENTA",
                columns: table => new
                {
                    ID_RENGLON_VENTA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_PRODUCTO = table.Column<int>(type: "INTEGER", nullable: false),
                    CANTIDAD = table.Column<int>(type: "INTEGER", nullable: false),
                    PRECIO_UNITARIO = table.Column<decimal>(type: "TEXT", nullable: false),
                    SUBTOTAL = table.Column<decimal>(type: "TEXT", nullable: false),
                    ID_VENTA = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RENGLONES_VENTA", x => x.ID_RENGLON_VENTA);
                    table.ForeignKey(
                        name: "FK_RENGLONES_VENTA_VENTAS_ID_VENTA",
                        column: x => x.ID_VENTA,
                        principalTable: "VENTAS",
                        principalColumn: "ID_VENTA");
                });

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCTOS_CODIGO_BARRA",
                table: "PRODUCTOS",
                column: "CODIGO_BARRA");

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCTOS_NOMBRE",
                table: "PRODUCTOS",
                column: "NOMBRE");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLONES_VENTA_ID_VENTA",
                table: "RENGLONES_VENTA",
                column: "ID_VENTA");

            migrationBuilder.CreateIndex(
                name: "IX_VENTAS_ID_SUCURSAL",
                table: "VENTAS",
                column: "ID_SUCURSAL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PRODUCTOS");

            migrationBuilder.DropTable(
                name: "RENGLONES_VENTA");

            migrationBuilder.DropTable(
                name: "VENTAS");

            migrationBuilder.DropTable(
                name: "SUCURSALES");
        }
    }
}
