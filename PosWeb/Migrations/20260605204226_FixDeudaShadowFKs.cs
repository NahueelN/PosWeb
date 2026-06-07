using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class FixDeudaShadowFKs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DEUDA_COMPRA_CompraID_COMPRA",
                table: "DEUDA");

            migrationBuilder.DropForeignKey(
                name: "FK_DEUDA_PROVEEDOR_ProveedorID_PROVEEDOR",
                table: "DEUDA");

            migrationBuilder.DropIndex(
                name: "IX_DEUDA_CompraID_COMPRA",
                table: "DEUDA");

            migrationBuilder.DropIndex(
                name: "IX_DEUDA_ProveedorID_PROVEEDOR",
                table: "DEUDA");

            migrationBuilder.DropColumn(
                name: "CompraID_COMPRA",
                table: "DEUDA");

            migrationBuilder.DropColumn(
                name: "ProveedorID_PROVEEDOR",
                table: "DEUDA");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CompraID_COMPRA",
                table: "DEUDA",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ProveedorID_PROVEEDOR",
                table: "DEUDA",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_DEUDA_CompraID_COMPRA",
                table: "DEUDA",
                column: "CompraID_COMPRA");

            migrationBuilder.CreateIndex(
                name: "IX_DEUDA_ProveedorID_PROVEEDOR",
                table: "DEUDA",
                column: "ProveedorID_PROVEEDOR");

            migrationBuilder.AddForeignKey(
                name: "FK_DEUDA_COMPRA_CompraID_COMPRA",
                table: "DEUDA",
                column: "CompraID_COMPRA",
                principalTable: "COMPRA",
                principalColumn: "ID_COMPRA",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_DEUDA_PROVEEDOR_ProveedorID_PROVEEDOR",
                table: "DEUDA",
                column: "ProveedorID_PROVEEDOR",
                principalTable: "PROVEEDOR",
                principalColumn: "ID_PROVEEDOR",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
