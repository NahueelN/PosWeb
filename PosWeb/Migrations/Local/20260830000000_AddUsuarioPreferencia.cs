using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PosWeb.Data;

#nullable disable

namespace PosWeb.Migrations.Local
{
    [DbContext(typeof(PosDbContextLocal))]
    [Migration("20260830000000_AddUsuarioPreferencia")]
    public partial class AddUsuarioPreferencia : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "USUARIO_PREFERENCIA",
                columns: table => new
                {
                    ID_USUARIO_PREFERENCIA = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_USUARIO = table.Column<int>(type: "INTEGER", nullable: false),
                    CLAVE = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    VALOR = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_USUARIO_PREFERENCIA", x => x.ID_USUARIO_PREFERENCIA);
                    table.ForeignKey(
                        name: "FK_USUARIO_PREFERENCIA_USUARIO_ID_USUARIO",
                        column: x => x.ID_USUARIO,
                        principalTable: "USUARIO",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_USUARIO_PREFERENCIA_ID_USUARIO_CLAVE",
                table: "USUARIO_PREFERENCIA",
                columns: new[] { "ID_USUARIO", "CLAVE" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "USUARIO_PREFERENCIA");
        }
    }
}
