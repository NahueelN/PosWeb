using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class AddMargenGananciaToCategoria : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "MARGEN_GANANCIA",
                table: "CATEGORIA",
                type: "decimal(65,30)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CATEGORIA_GASTO",
                columns: table => new
                {
                    ID_CATEGORIA_GASTO = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    DESCRIPCION = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ACTIVO = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CATEGORIA_GASTO", x => x.ID_CATEGORIA_GASTO);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_RENGLON_VENTA_ID_COMBO",
                table: "RENGLON_VENTA",
                column: "ID_COMBO");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CATEGORIA_GASTO");

            migrationBuilder.DropIndex(
                name: "IX_RENGLON_VENTA_ID_COMBO",
                table: "RENGLON_VENTA");

            migrationBuilder.DropColumn(
                name: "MARGEN_GANANCIA",
                table: "CATEGORIA");
        }
    }
}
