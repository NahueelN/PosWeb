using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations.Local
{
    /// <inheritdoc />
    public partial class AddEsTitularToUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ES_TITULAR",
                table: "USUARIO",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "USUARIO",
                keyColumn: "ID_USUARIO",
                keyValue: 1,
                column: "ES_TITULAR",
                value: false);

            // Backfill para instalaciones existentes: el admin más antiguo pasa a ser el
            // titular de la suscripción/licencia (mismo criterio que la heurística que reemplaza
            // en LicenciaService). No afecta nada si todavía no hay ningún usuario ROL='Admin'.
            migrationBuilder.Sql(@"
                UPDATE USUARIO SET ES_TITULAR = 1
                WHERE ID_USUARIO = (SELECT MIN(ID_USUARIO) FROM USUARIO WHERE ROL = 'Admin');
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ES_TITULAR",
                table: "USUARIO");
        }
    }
}
