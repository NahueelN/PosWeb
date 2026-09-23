using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    public partial class AddProductExpiryDates : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(name: "FECHA_VENCIMIENTO_1", table: "PRODUCTO", type: "datetime(6)", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "FECHA_VENCIMIENTO_2", table: "PRODUCTO", type: "datetime(6)", nullable: true);
            migrationBuilder.AddColumn<DateTime>(name: "FECHA_VENCIMIENTO_3", table: "PRODUCTO", type: "datetime(6)", nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "FECHA_VENCIMIENTO_1", table: "PRODUCTO");
            migrationBuilder.DropColumn(name: "FECHA_VENCIMIENTO_2", table: "PRODUCTO");
            migrationBuilder.DropColumn(name: "FECHA_VENCIMIENTO_3", table: "PRODUCTO");
        }
    }
}
