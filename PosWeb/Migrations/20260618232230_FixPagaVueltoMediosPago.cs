using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class FixPagaVueltoMediosPago : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "MEDIO_PAGO",
                keyColumn: "ID_MEDIO_PAGO",
                keyValue: 2,
                column: "PAGA_VUELTO",
                value: false);

            migrationBuilder.UpdateData(
                table: "MEDIO_PAGO",
                keyColumn: "ID_MEDIO_PAGO",
                keyValue: 5,
                column: "PAGA_VUELTO",
                value: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "MEDIO_PAGO",
                keyColumn: "ID_MEDIO_PAGO",
                keyValue: 2,
                column: "PAGA_VUELTO",
                value: true);

            migrationBuilder.UpdateData(
                table: "MEDIO_PAGO",
                keyColumn: "ID_MEDIO_PAGO",
                keyValue: 5,
                column: "PAGA_VUELTO",
                value: true);
        }
    }
}
