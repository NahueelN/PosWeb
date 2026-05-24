using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class AddStockPorSucursal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "STOCK_POR_SUCURSAL",
                columns: table => new
                {
                    ID_STOCK_SUCURSAL = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_PRODUCTO = table.Column<int>(type: "INTEGER", nullable: false),
                    ID_SUCURSAL = table.Column<int>(type: "INTEGER", nullable: false),
                    STOCK = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_STOCK_POR_SUCURSAL", x => x.ID_STOCK_SUCURSAL);
                    table.ForeignKey(
                        name: "FK_STOCK_POR_SUCURSAL_PRODUCTOS_ID_PRODUCTO",
                        column: x => x.ID_PRODUCTO,
                        principalTable: "PRODUCTOS",
                        principalColumn: "ID_PRODUCTO",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_STOCK_POR_SUCURSAL_SUCURSALES_ID_SUCURSAL",
                        column: x => x.ID_SUCURSAL,
                        principalTable: "SUCURSALES",
                        principalColumn: "ID_SUCURSAL",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_STOCK_POR_SUCURSAL_ID_PRODUCTO_ID_SUCURSAL",
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_PRODUCTO", "ID_SUCURSAL" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_STOCK_POR_SUCURSAL_ID_SUCURSAL",
                table: "STOCK_POR_SUCURSAL",
                column: "ID_SUCURSAL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "STOCK_POR_SUCURSAL");
        }
    }
}
