using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using PosWeb.Data;

#nullable disable

namespace PosWeb.Migrations
{
    [DbContext(typeof(PosDbContext))]
    [Migration("20260828000000_NormalizarCodigoBarras")]
    public partial class NormalizarCodigoBarras : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE PRODUCTO SET CODIGO_BARRAS = LPAD(CODIGO_BARRAS, 13, '0') WHERE CODIGO_BARRAS REGEXP '^[0-9]+$';");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Normalización de datos: no reversible (no se puede recuperar el padding original).
        }
    }
}
