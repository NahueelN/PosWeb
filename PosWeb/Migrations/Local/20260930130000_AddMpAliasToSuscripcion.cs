using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations.Local
{
    /// <inheritdoc />
    public partial class AddMpAliasToSuscripcion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MP_NOMBRE_TITULAR",
                table: "SUSCRIPCION",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MP_ALIAS",
                table: "SUSCRIPCION",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MP_ALIAS",
                table: "SUSCRIPCION");

            migrationBuilder.DropColumn(
                name: "MP_NOMBRE_TITULAR",
                table: "SUSCRIPCION");
        }
    }
}