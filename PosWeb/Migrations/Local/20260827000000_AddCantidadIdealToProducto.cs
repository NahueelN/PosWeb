using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PosWeb.Data;

#nullable disable

namespace PosWeb.Migrations.Local
{
    [DbContext(typeof(PosDbContextLocal))]
    [Migration("20260827000000_AddCantidadIdealToProducto")]
    public partial class AddCantidadIdealToProducto : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CANTIDAD_IDEAL",
                table: "PRODUCTO",
                type: "decimal(18,2)",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CANTIDAD_IDEAL",
                table: "PRODUCTO");
        }
    }
}
