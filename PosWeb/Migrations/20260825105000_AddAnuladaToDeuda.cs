using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PosWeb.Data;

#nullable disable

namespace PosWeb.Migrations
{
    [DbContext(typeof(PosDbContext))]
    [Migration("20260825105000_AddAnuladaToDeuda")]
    public partial class AddAnuladaToDeuda : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ANULADA",
                table: "DEUDA",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ANULADA",
                table: "DEUDA");
        }
    }
}
