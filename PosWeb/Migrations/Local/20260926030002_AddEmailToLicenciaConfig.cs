using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations.Local
{
    /// <inheritdoc />
    public partial class AddEmailToLicenciaConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "LicenciaConfig",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Email",
                table: "LicenciaConfig");
        }
    }
}
