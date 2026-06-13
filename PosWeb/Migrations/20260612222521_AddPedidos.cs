using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class AddPedidos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ID_PEDIDO",
                table: "COMPRA",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PEDIDO",
                columns: table => new
                {
                    ID_PEDIDO = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ID_SUCURSAL = table.Column<int>(type: "int", nullable: false),
                    ID_PROVEEDOR = table.Column<int>(type: "int", nullable: false),
                    ID_USUARIO = table.Column<int>(type: "int", nullable: false),
                    FECHA_PEDIDO = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    FECHA_ESPERADA = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    TOTAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    OBSERVACIONES = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ESTADO = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ID_PEDIDO_ORIGEN = table.Column<int>(type: "int", nullable: true)
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
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "RENGLON_PEDIDO",
                columns: table => new
                {
                    ID_RENGLON_PEDIDO = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ID_PEDIDO = table.Column<int>(type: "int", nullable: false),
                    ID_PRODUCTO = table.Column<int>(type: "int", nullable: false),
                    CANTIDAD_PEDIDA = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PRECIO_UNITARIO_ESTIMADO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SUBTOTAL = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ESTADO = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
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
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_COMPRA_ID_PEDIDO",
                table: "COMPRA",
                column: "ID_PEDIDO");

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
                name: "IX_RENGLON_PEDIDO_ID_PEDIDO",
                table: "RENGLON_PEDIDO",
                column: "ID_PEDIDO");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLON_PEDIDO_ID_PRODUCTO",
                table: "RENGLON_PEDIDO",
                column: "ID_PRODUCTO");

            migrationBuilder.AddForeignKey(
                name: "FK_COMPRA_PEDIDO_ID_PEDIDO",
                table: "COMPRA",
                column: "ID_PEDIDO",
                principalTable: "PEDIDO",
                principalColumn: "ID_PEDIDO",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_COMPRA_PEDIDO_ID_PEDIDO",
                table: "COMPRA");

            migrationBuilder.DropTable(
                name: "RENGLON_PEDIDO");

            migrationBuilder.DropTable(
                name: "PEDIDO");

            migrationBuilder.DropIndex(
                name: "IX_COMPRA_ID_PEDIDO",
                table: "COMPRA");

            migrationBuilder.DropColumn(
                name: "ID_PEDIDO",
                table: "COMPRA");
        }
    }
}
