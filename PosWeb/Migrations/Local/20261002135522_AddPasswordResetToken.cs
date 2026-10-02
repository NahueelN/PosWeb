using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations.Local
{
    /// <inheritdoc />
    public partial class AddPasswordResetToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PASSWORD_RESET_TOKEN",
                columns: table => new
                {
                    ID_TOKEN = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_USUARIO = table.Column<int>(type: "INTEGER", nullable: false),
                    TOKEN_HASH = table.Column<string>(type: "TEXT", nullable: false),
                    EXPIRA_UTC = table.Column<DateTime>(type: "TEXT", nullable: false),
                    USADO = table.Column<bool>(type: "INTEGER", nullable: false),
                    INTENTOS = table.Column<int>(type: "INTEGER", nullable: false),
                    CREATED_UTC = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PASSWORD_RESET_TOKEN", x => x.ID_TOKEN);
                    table.ForeignKey(
                        name: "FK_PASSWORD_RESET_TOKEN_USUARIO_ID_USUARIO",
                        column: x => x.ID_USUARIO,
                        principalTable: "USUARIO",
                        principalColumn: "ID_USUARIO",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PASSWORD_RESET_TOKEN_ID_USUARIO",
                table: "PASSWORD_RESET_TOKEN",
                column: "ID_USUARIO");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PASSWORD_RESET_TOKEN");
        }
    }
}
