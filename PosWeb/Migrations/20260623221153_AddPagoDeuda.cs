using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class AddPagoDeuda : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PAGO_DEUDA",
                columns: table => new
                {
                    ID_PAGO_DEUDA = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ID_DEUDA = table.Column<int>(type: "int", nullable: false),
                    MONTO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FECHA = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ID_USUARIO = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PAGO_DEUDA", x => x.ID_PAGO_DEUDA);
                    table.ForeignKey(
                        name: "FK_PAGO_DEUDA_DEUDA_ID_DEUDA",
                        column: x => x.ID_DEUDA,
                        principalTable: "DEUDA",
                        principalColumn: "ID_DEUDA",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_PAGO_DEUDA_ID_DEUDA",
                table: "PAGO_DEUDA",
                column: "ID_DEUDA");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PAGO_DEUDA");
        }
    }
}
