using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class SeedMoreProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Productos 4-23
            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 4, true, "7798012345708", 14.0, "Sprite 500ml", 28.0, 90 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 5, true, "7798012345715", 14.0, "Fanta 500ml", 28.0, 85 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 6, true, "7798012345722", 13.0, "Seven Up 500ml", 25.0, 80 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 7, true, "7798012345739", 11.0, "Agua Saborizada Manzana 500ml", 22.0, 60 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 8, true, "7798012345746", 11.0, "Agua Saborizada Pomelo 500ml", 22.0, 60 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 9, true, "7798012345753", 22.0, "Gatorade Azul 500ml", 40.0, 45 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 10, true, "7798012345760", 22.0, "Gatorade Naranja 500ml", 40.0, 45 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 11, true, "7798012345777", 24.0, "Speed 250ml", 42.0, 50 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 12, true, "7798012345784", 14.0, "Papas Lay's 70g", 25.0, 100 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 13, true, "7798012345791", 26.0, "Papas Pringles Original 100g", 45.0, 40 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 14, true, "7798012345807", 11.0, "Maní salado 100g", 20.0, 80 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 15, true, "7798012345814", 20.0, "Mix frutos secos 100g", 35.0, 50 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 16, true, "7798012345821", 13.0, "Alfajor Milka 50g", 22.0, 70 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 17, true, "7798012345838", 6.0, "Alfajor Guaymallén", 12.0, 150 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 18, true, "7798012345845", 8.0, "Barrita cereal Granola", 15.0, 90 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 19, true, "7798012345852", 5.0, "Caramelos Masticables x6", 10.0, 200 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 20, true, "7798012345869", 4.0, "Chicle Beldent x4", 8.0, 120 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 21, true, "7798012345876", 18.0, "Cerveza Quilmes 473ml", 32.0, 60 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 22, true, "7798012345883", 9.0, "Agua Colorado", 18.0, 100 });

            migrationBuilder.InsertData(
                table: "PRODUCTOS",
                columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
                values: new object[] { 23, true, "7798012345890", 14.0, "Gaseosa Tónica 500ml", 27.0, 40 });

            // Stock en sucursal 1 para productos 4-23
            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 4, 4, 1, 90 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 5, 5, 1, 85 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 6, 6, 1, 80 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 7, 7, 1, 60 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 8, 8, 1, 60 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 9, 9, 1, 45 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 10, 10, 1, 45 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 11, 11, 1, 50 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 12, 12, 1, 100 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 13, 13, 1, 40 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 14, 14, 1, 80 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 15, 15, 1, 50 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 16, 16, 1, 70 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 17, 17, 1, 150 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 18, 18, 1, 90 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 19, 19, 1, 200 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 20, 20, 1, 120 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 21, 21, 1, 60 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 22, 22, 1, 100 });

            migrationBuilder.InsertData(
                table: "STOCK_POR_SUCURSAL",
                columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
                values: new object[] { 23, 23, 1, 40 });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Deshacer stock (IDs 4-23)
            for (int i = 4; i <= 23; i++)
            {
                migrationBuilder.DeleteData(
                    table: "STOCK_POR_SUCURSAL",
                    keyColumn: "ID_STOCK_SUCURSAL",
                    keyValue: i);
            }

            // Deshacer productos (IDs 4-23)
            for (int i = 4; i <= 23; i++)
            {
                migrationBuilder.DeleteData(
                    table: "PRODUCTOS",
                    keyColumn: "ID_PRODUCTO",
                    keyValue: i);
            }
        }
    }
}
