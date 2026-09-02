using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PosWeb.Data;

#nullable disable

namespace PosWeb.Migrations.Local
{
    [DbContext(typeof(PosDbContextLocal))]
    [Migration("20260901000000_AddActivoToUnidadMedida")]
    public partial class AddActivoToUnidadMedida : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ACTIVO",
                table: "UNIDAD_MEDIDA",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ACTIVO",
                table: "UNIDAD_MEDIDA");
        }
    }
}