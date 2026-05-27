using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    public partial class AddUsuarioResponsableYEmpresa : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EMPRESA_REPRESENTA",
                table: "USUARIOS",
                type: "TEXT",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ID_USUARIO_RESPONSABLE",
                table: "USUARIOS",
                type: "INTEGER",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EMPRESA_REPRESENTA",
                table: "USUARIOS");

            migrationBuilder.DropColumn(
                name: "ID_USUARIO_RESPONSABLE",
                table: "USUARIOS");
        }
    }
}
