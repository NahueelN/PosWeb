using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class DesactivarCuentaCorriente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE MEDIOS_PAGO SET ACTIVO = 0 WHERE ID_MEDIO_PAGO = 5;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE MEDIOS_PAGO SET ACTIVO = 1 WHERE ID_MEDIO_PAGO = 5;");
        }
    }
}
