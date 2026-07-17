using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class AddEsBultoToProducto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ES_BULTO",
                table: "PRODUCTO",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ID_PRODUCTO_BULTO",
                table: "PRODUCTO",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ES_BULTO",
                table: "PRODUCTO");

            migrationBuilder.DropColumn(
                name: "ID_PRODUCTO_BULTO",
                table: "PRODUCTO");
        }
    }
}
