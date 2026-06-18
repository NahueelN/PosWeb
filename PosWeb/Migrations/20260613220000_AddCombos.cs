using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    public partial class AddCombos : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS COMBO_ITEM;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS COMBO;");

            migrationBuilder.Sql(@"
                CREATE TABLE COMBO (
                    ID_COMBO INT NOT NULL AUTO_INCREMENT,
                    COD_COMBO VARCHAR(50) NOT NULL,
                    DESC_COMBO VARCHAR(200) NOT NULL,
                    PRECIO DECIMAL(18,2) NOT NULL,
                    ACTIVO TINYINT(1) NOT NULL,
                    PRIMARY KEY (ID_COMBO)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
            ");

            migrationBuilder.Sql(@"
                CREATE UNIQUE INDEX IX_COMBO_COD_COMBO ON COMBO (COD_COMBO);
            ");

            migrationBuilder.Sql(@"
                CREATE TABLE COMBO_ITEM (
                    ID_COMBO_ITEM INT NOT NULL AUTO_INCREMENT,
                    ID_COMBO INT NOT NULL,
                    ID_PRODUCTO INT NOT NULL,
                    CANTIDAD DECIMAL(18,2) NOT NULL,
                    PRIMARY KEY (ID_COMBO_ITEM),
                    CONSTRAINT FK_COMBO_ITEM_COMBO_ID_COMBO FOREIGN KEY (ID_COMBO) REFERENCES COMBO (ID_COMBO) ON DELETE CASCADE,
                    CONSTRAINT FK_COMBO_ITEM_PRODUCTO_ID_PRODUCTO FOREIGN KEY (ID_PRODUCTO) REFERENCES PRODUCTO (ID_PRODUCTO) ON DELETE RESTRICT
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
            ");

            migrationBuilder.Sql(@"
                CREATE INDEX IX_COMBO_ITEM_ID_COMBO ON COMBO_ITEM (ID_COMBO);
            ");

            migrationBuilder.Sql(@"
                CREATE INDEX IX_COMBO_ITEM_ID_PRODUCTO ON COMBO_ITEM (ID_PRODUCTO);
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE RENGLON_VENTA MODIFY COLUMN ID_PRODUCTO INT NULL;
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE RENGLON_VENTA ADD COLUMN ID_COMBO INT NULL;
            ");

            migrationBuilder.Sql(@"
                CREATE INDEX IX_RENGLON_VENTA_ID_COMBO ON RENGLON_VENTA (ID_COMBO);
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE RENGLON_VENTA ADD CONSTRAINT FK_RENGLON_VENTA_COMBO_ID_COMBO FOREIGN KEY (ID_COMBO) REFERENCES COMBO (ID_COMBO) ON DELETE RESTRICT;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE RENGLON_VENTA DROP FOREIGN KEY FK_RENGLON_VENTA_COMBO_ID_COMBO;");
            migrationBuilder.Sql("DROP INDEX IX_RENGLON_VENTA_ID_COMBO ON RENGLON_VENTA;");
            migrationBuilder.Sql("ALTER TABLE RENGLON_VENTA DROP COLUMN ID_COMBO;");
            migrationBuilder.Sql("ALTER TABLE RENGLON_VENTA MODIFY COLUMN ID_PRODUCTO INT NOT NULL;");
            migrationBuilder.Sql("DROP TABLE COMBO_ITEM;");
            migrationBuilder.Sql("DROP TABLE COMBO;");
        }
    }
}
