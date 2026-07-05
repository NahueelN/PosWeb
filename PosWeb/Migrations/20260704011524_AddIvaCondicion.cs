using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class AddIvaCondicion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IVA_CONDICION",
                table: "PROVEEDOR",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "ConsumidorFinal")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "IVA_CONDICION",
                table: "CLIENTE",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "ConsumidorFinal")
                .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IVA_CONDICION",
                table: "PROVEEDOR");

            migrationBuilder.DropColumn(
                name: "IVA_CONDICION",
                table: "CLIENTE");
        }
    }
}
