using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations.Local
{
    /// <inheritdoc />
    public partial class AddEmailConfirmadoAndProposito : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "EMAIL_CONFIRMADO",
                table: "USUARIO",
                type: "INTEGER",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<string>(
                name: "PROPOSITO",
                table: "PASSWORD_RESET_TOKEN",
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "reset");

            migrationBuilder.UpdateData(
                table: "USUARIO",
                keyColumn: "ID_USUARIO",
                keyValue: 1,
                column: "EMAIL_CONFIRMADO",
                value: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EMAIL_CONFIRMADO",
                table: "USUARIO");

            migrationBuilder.DropColumn(
                name: "PROPOSITO",
                table: "PASSWORD_RESET_TOKEN");
        }
    }
}
