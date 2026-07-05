using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class AddEmpresaAndUsuarioResponsableToUsuario : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ID_EMPRESA",
                table: "USUARIO",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ID_USUARIO_RESPONSABLE",
                table: "USUARIO",
                type: "int",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "USUARIO",
                keyColumn: "ID_USUARIO",
                keyValue: 1,
                columns: new[] { "ID_EMPRESA", "ID_USUARIO_RESPONSABLE" },
                values: new object[] { null, null });

            migrationBuilder.CreateIndex(
                name: "IX_USUARIO_ID_EMPRESA",
                table: "USUARIO",
                column: "ID_EMPRESA");

            migrationBuilder.AddForeignKey(
                name: "FK_USUARIO_EMPRESA_ID_EMPRESA",
                table: "USUARIO",
                column: "ID_EMPRESA",
                principalTable: "EMPRESA",
                principalColumn: "ID_EMPRESA",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_USUARIO_EMPRESA_ID_EMPRESA",
                table: "USUARIO");

            migrationBuilder.DropIndex(
                name: "IX_USUARIO_ID_EMPRESA",
                table: "USUARIO");

            migrationBuilder.DropColumn(
                name: "ID_EMPRESA",
                table: "USUARIO");

            migrationBuilder.DropColumn(
                name: "ID_USUARIO_RESPONSABLE",
                table: "USUARIO");

        }
    }
}
