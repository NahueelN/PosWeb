using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations.Local
{
    /// <inheritdoc />
    public partial class AddTipoNegocioToEmpresaConfiguracion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TIPO_NEGOCIO",
                table: "EMPRESA_CONFIGURACION",
                type: "TEXT",
                nullable: false,
                defaultValue: "Tienda");

            // Backfill para instalaciones existentes: el tipo se deriva del toggle actual.
            migrationBuilder.Sql(
                "UPDATE EMPRESA_CONFIGURACION SET TIPO_NEGOCIO = 'Restaurante' WHERE MODULO_RESTAURANTE = 1;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TIPO_NEGOCIO",
                table: "EMPRESA_CONFIGURACION");
        }
    }
}