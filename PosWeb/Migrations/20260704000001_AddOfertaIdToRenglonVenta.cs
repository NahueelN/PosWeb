using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    public partial class AddOfertaIdToRenglonVenta : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                ALTER TABLE RENGLON_VENTA
                ADD COLUMN ID_OFERTA INT NULL;
            ");

            migrationBuilder.Sql(@"
                CREATE INDEX IX_RENGLON_VENTA_ID_OFERTA ON RENGLON_VENTA (ID_OFERTA);
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE RENGLON_VENTA
                ADD CONSTRAINT FK_RENGLON_VENTA_OFERTA_ID_OFERTA
                FOREIGN KEY (ID_OFERTA) REFERENCES OFERTA (ID_OFERTA) ON DELETE RESTRICT;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE RENGLON_VENTA DROP FOREIGN KEY FK_RENGLON_VENTA_OFERTA_ID_OFERTA;");
            migrationBuilder.Sql("DROP INDEX IX_RENGLON_VENTA_ID_OFERTA ON RENGLON_VENTA;");
            migrationBuilder.Sql("ALTER TABLE RENGLON_VENTA DROP COLUMN ID_OFERTA;");
        }
    }
}
