using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    public partial class AddRecurrenciaCombosOfertas : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE COMBO
                ADD COLUMN FECHA_INICIO DATETIME NULL,
                ADD COLUMN FECHA_FIN DATETIME NULL,
                ADD COLUMN DIAS_SEMANA VARCHAR(50) NULL;
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE OFERTA
                ADD COLUMN DIAS_SEMANA VARCHAR(50) NULL;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE COMBO DROP COLUMN DIAS_SEMANA;");
            migrationBuilder.Sql("ALTER TABLE COMBO DROP COLUMN FECHA_FIN;");
            migrationBuilder.Sql("ALTER TABLE COMBO DROP COLUMN FECHA_INICIO;");
            migrationBuilder.Sql("ALTER TABLE OFERTA DROP COLUMN DIAS_SEMANA;");
        }
    }
}
