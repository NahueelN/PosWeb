using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PosWeb.Data;

#nullable disable

namespace PosWeb.Migrations.Local
{
    [DbContext(typeof(PosDbContextLocal))]
    [Migration("20260831000000_AddDireccionToEmpresa")]
    public partial class AddDireccionToEmpresa : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DIRECCION",
                table: "EMPRESA",
                type: "TEXT",
                maxLength: 250,
                nullable: false,
                defaultValue: "");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DIRECCION",
                table: "EMPRESA");
        }
    }
}
