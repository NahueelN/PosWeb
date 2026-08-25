using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PosWeb.Data;

#nullable disable

namespace PosWeb.Migrations
{
    [DbContext(typeof(PosDbContext))]
    [Migration("20260825080000_AddAnuladoToPagoDeuda")]
    public partial class AddAnuladoToPagoDeuda : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ANULADO",
                table: "PAGO_DEUDA",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ANULADO",
                table: "PAGO_DEUDA");
        }
    }
}
