using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PosWeb.Data;

#nullable disable

namespace PosWeb.Migrations.Local
{
    [DbContext(typeof(PosDbContextLocal))]
    [Migration("20260901000000_AddTelefonoToEmpresa")]
    public partial class AddTelefonoToEmpresa : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TELEFONO",
                table: "EMPRESA",
                type: "TEXT",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "MOSTRAR_TELEFONO_TICKET",
                table: "EMPRESA",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TELEFONO",
                table: "EMPRESA");

            migrationBuilder.DropColumn(
                name: "MOSTRAR_TELEFONO_TICKET",
                table: "EMPRESA");
        }
    }
}
