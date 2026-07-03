using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    public partial class AddOfertas : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS OFERTA;");

            migrationBuilder.Sql(@"
                CREATE TABLE OFERTA (
                    ID_OFERTA INT NOT NULL AUTO_INCREMENT,
                    FECHA_INICIO DATETIME NOT NULL,
                    FECHA_FIN DATETIME NOT NULL,
                    ID_PRODUCTO INT NOT NULL,
                    DESCUENTO DECIMAL(5,2) NOT NULL,
                    ACTIVO TINYINT(1) NOT NULL,
                    PRIMARY KEY (ID_OFERTA),
                    CONSTRAINT FK_OFERTA_PRODUCTO_ID_PRODUCTO FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTO (ID_PRODUCTO) ON DELETE RESTRICT
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
            ");

            migrationBuilder.Sql(@"
                CREATE INDEX IX_OFERTA_ID_PRODUCTO ON OFERTA (ID_PRODUCTO);
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE OFERTA;");
        }
    }
}
