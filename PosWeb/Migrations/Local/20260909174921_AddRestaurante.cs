using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations.Local
{
    /// <inheritdoc />
    public partial class AddRestaurante : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ID_SESION_MESA",
                table: "VENTA",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EMPRESA_CONFIGURACION",
                columns: table => new
                {
                    ID_EMPRESA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    MODULO_RESTAURANTE = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EMPRESA_CONFIGURACION", x => x.ID_EMPRESA);
                });

            migrationBuilder.CreateTable(
                name: "MESA",
                columns: table => new
                {
                    ID_MESA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_SUCURSAL = table.Column<int>(type: "INTEGER", nullable: false),
                    NUMERO_MESA = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    DESCRIPCION = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    POS_X = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    POS_Y = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    ACTIVA = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MESA", x => x.ID_MESA);
                    table.ForeignKey(
                        name: "FK_MESA_SUCURSAL_ID_SUCURSAL",
                        column: x => x.ID_SUCURSAL,
                        principalTable: "SUCURSAL",
                        principalColumn: "ID_SUCURSAL",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SESION_MESA",
                columns: table => new
                {
                    ID_SESION_MESA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_MESA = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_SUCURSAL = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_USUARIO = table.Column<int>(type: "INTEGER", nullable: false),
                    FECHA_APERTURA = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FECHA_CIERRE = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ESTADO = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ID_VENTA = table.Column<int>(type: "INTEGER", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SESION_MESA", x => x.ID_SESION_MESA);
                    table.ForeignKey(
                        name: "FK_SESION_MESA_MESA_ID_MESA",
                        column: x => x.ID_MESA,
                        principalTable: "MESA",
                        principalColumn: "ID_MESA",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ITEM_COMANDA",
                columns: table => new
                {
                    ID_ITEM_COMANDA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_SESION_MESA = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_PRODUCTO = table.Column<int>(type: "INTEGER", nullable: true),
                    ID_COMBO = table.Column<int>(type: "INTEGER", nullable: true),
                    DESCRIPCION = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    CANTIDAD = table.Column<decimal>(type: "decimal(12,3)", nullable: false),
                    PRECIO_UNITARIO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NOTA = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    ESTADO = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    FECHA_ALTA = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FECHA_ESTADO = table.Column<DateTime>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ITEM_COMANDA", x => x.ID_ITEM_COMANDA);
                    table.ForeignKey(
                        name: "FK_ITEM_COMANDA_SESION_MESA_ID_SESION_MESA",
                        column: x => x.ID_SESION_MESA,
                        principalTable: "SESION_MESA",
                        principalColumn: "ID_SESION_MESA",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VENTA_ID_SESION_MESA",
                table: "VENTA",
                column: "ID_SESION_MESA");

            migrationBuilder.CreateIndex(
                name: "IX_ITEM_COMANDA_ID_SESION_MESA",
                table: "ITEM_COMANDA",
                column: "ID_SESION_MESA");

            migrationBuilder.CreateIndex(
                name: "IX_MESA_ID_SUCURSAL_NUMERO_MESA",
                table: "MESA",
                columns: new[] { "ID_SUCURSAL", "NUMERO_MESA" },
                unique: true,
                filter: "ACTIVA = 1");

            migrationBuilder.CreateIndex(
                name: "IX_SESION_MESA_ID_MESA_ESTADO",
                table: "SESION_MESA",
                columns: new[] { "ID_MESA", "ESTADO" });

            migrationBuilder.AddForeignKey(
                name: "FK_VENTA_SESION_MESA_ID_SESION_MESA",
                table: "VENTA",
                column: "ID_SESION_MESA",
                principalTable: "SESION_MESA",
                principalColumn: "ID_SESION_MESA",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VENTA_SESION_MESA_ID_SESION_MESA",
                table: "VENTA");

            migrationBuilder.DropTable(
                name: "EMPRESA_CONFIGURACION");

            migrationBuilder.DropTable(
                name: "ITEM_COMANDA");

            migrationBuilder.DropTable(
                name: "SESION_MESA");

            migrationBuilder.DropTable(
                name: "MESA");

            migrationBuilder.DropIndex(
                name: "IX_VENTA_ID_SESION_MESA",
                table: "VENTA");

            migrationBuilder.DropColumn(
                name: "ID_SESION_MESA",
                table: "VENTA");
        }
    }
}
