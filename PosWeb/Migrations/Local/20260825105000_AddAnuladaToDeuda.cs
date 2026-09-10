using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PosWeb.Data;

#nullable disable

namespace PosWeb.Migrations.Local
{
    [DbContext(typeof(PosDbContextLocal))]
    [Migration("20260825105000_AddAnuladaToDeuda")]
    public partial class AddAnuladaToDeuda : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ANULADA",
                table: "DEUDA",
                type: "INTEGER",
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
