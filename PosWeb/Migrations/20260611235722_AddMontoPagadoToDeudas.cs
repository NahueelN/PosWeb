using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class AddMontoPagadoToDeudas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "MONTO_PAGADO",
                table: "DEUDA",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "UNIDAD_MEDIDA",
                keyColumn: "ID_UNIDAD_MEDIDA",
                keyValue: 1,
                column: "DESC_UNIDAD_MEDIDA",
                value: "Unidades");

            migrationBuilder.UpdateData(
                table: "UNIDAD_MEDIDA",
                keyColumn: "ID_UNIDAD_MEDIDA",
                keyValue: 2,
                column: "DESC_UNIDAD_MEDIDA",
                value: "Kilogramos");

            migrationBuilder.UpdateData(
                table: "UNIDAD_MEDIDA",
                keyColumn: "ID_UNIDAD_MEDIDA",
                keyValue: 3,
                columns: new[] { "COD_UNIDAD_MEDIDA", "DESC_UNIDAD_MEDIDA" },
                values: new object[] { "L", "Litros" });

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MONTO_PAGADO",
                table: "DEUDA");

            migrationBuilder.UpdateData(
                table: "UNIDAD_MEDIDA",
                keyColumn: "ID_UNIDAD_MEDIDA",
                keyValue: 1,
                column: "DESC_UNIDAD_MEDIDA",
                value: "Unidad");

            migrationBuilder.UpdateData(
                table: "UNIDAD_MEDIDA",
                keyColumn: "ID_UNIDAD_MEDIDA",
                keyValue: 2,
                column: "DESC_UNIDAD_MEDIDA",
                value: "Kilogramo");

            migrationBuilder.UpdateData(
                table: "UNIDAD_MEDIDA",
                keyColumn: "ID_UNIDAD_MEDIDA",
                keyValue: 3,
                columns: new[] { "COD_UNIDAD_MEDIDA", "DESC_UNIDAD_MEDIDA" },
                values: new object[] { "LITRO", "Litro" });
        }
    }
}
