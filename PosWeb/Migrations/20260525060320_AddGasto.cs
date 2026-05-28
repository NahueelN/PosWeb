using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class AddGasto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GASTOS",
                columns: table => new
                {
                    ID_GASTO = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ID_CAJA = table.Column<int>(type: "INTEGER", nullable: false),
                    MONTO = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    FECHA = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DETALLE = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GASTOS", x => x.ID_GASTO);
                    table.ForeignKey(
                        name: "FK_GASTOS_CAJAS_ID_CAJA",
                        column: x => x.ID_CAJA,
                        principalTable: "CAJAS",
                        principalColumn: "ID_CAJA",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GASTOS_ID_CAJA",
                table: "GASTOS",
                column: "ID_CAJA");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GASTOS");
        }
    }
}
