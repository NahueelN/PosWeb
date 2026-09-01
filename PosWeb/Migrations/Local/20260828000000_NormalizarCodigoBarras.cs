using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PosWeb.Data;

#nullable disable

namespace PosWeb.Migrations.Local
{
    [DbContext(typeof(PosDbContextLocal))]
    [Migration("20260828000000_NormalizarCodigoBarras")]
    public partial class NormalizarCodigoBarras : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE PRODUCTO SET CODIGO_BARRAS = PRINTF('%013d', CAST(CODIGO_BARRAS AS INTEGER)) WHERE CODIGO_BARRAS GLOB '[0-9]*' AND CODIGO_BARRAS <> '';");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Normalización de datos: no reversible (no se puede recuperar el padding original).
        }
    }
}
