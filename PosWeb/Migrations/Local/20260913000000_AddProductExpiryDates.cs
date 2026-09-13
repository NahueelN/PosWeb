using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PosWeb.Data;

#nullable disable

namespace PosWeb.Migrations.Local
{
    [DbContext(typeof(PosDbContextLocal))]
    [Migration("20260913000000_AddProductExpiryDates")]
    public partial class AddProductExpiryDates : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(name: "FECHA_VENCIMIENTO_1", table: "PRODUCTO", type: "TEXT", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "FECHA_VENCIMIENTO_2", table: "PRODUCTO", type: "TEXT", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "FECHA_VENCIMIENTO_3", table: "PRODUCTO", type: "TEXT", nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "FECHA_VENCIMIENTO_1", table: "PRODUCTO");
            migrationBuilder.DropColumn(name: "FECHA_VENCIMIENTO_2", table: "PRODUCTO");
            migrationBuilder.DropColumn(name: "FECHA_VENCIMIENTO_3", table: "PRODUCTO");
        }
    }
}
