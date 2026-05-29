using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class PopulateProductTamano : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Bebidas - gaseosas y aguas
            foreach (var id in new[] { 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 36, 37, 38, 39, 40, 105, 109 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '500ml' WHERE ID_PRODUCTO = " + id);
            foreach (var id in new[] { 11, 45 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '250ml' WHERE ID_PRODUCTO = " + id);
            foreach (var id in new[] { 21, 46, 47, 48, 49, 50, 51 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '473ml' WHERE ID_PRODUCTO = " + id);
            foreach (var id in new[] { 52, 53, 54 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '355ml' WHERE ID_PRODUCTO = " + id);
            foreach (var id in new[] { 35, 114, 116, 117 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '1L' WHERE ID_PRODUCTO = " + id);
            foreach (var id in new[] { 120, 121, 122 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '2.25L' WHERE ID_PRODUCTO = " + id);
            foreach (var id in new[] { 115 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '200ml' WHERE ID_PRODUCTO = " + id);
            migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '2L' WHERE ID_PRODUCTO = 123");

            // Snacks - papas, maní, etc.
            foreach (var id in new[] { 12, 55, 56, 60, 61, 62, 67 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '70g' WHERE ID_PRODUCTO = " + id);
            foreach (var id in new[] { 13, 14, 15, 57, 58, 59, 64, 66, 80, 81, 82, 83, 84, 86, 87, 110 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '100g' WHERE ID_PRODUCTO = " + id);
            foreach (var id in new[] { 63, 65, 85, 101 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '200g' WHERE ID_PRODUCTO = " + id);
            foreach (var id in new[] { 98, 99, 100, 102, 103, 104 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '500g' WHERE ID_PRODUCTO = " + id);

            // Alfajores y barras
            foreach (var id in new[] { 16, 70, 71, 74, 75, 97 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '50g' WHERE ID_PRODUCTO = " + id);
            foreach (var id in new[] { 76, 77 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '45g' WHERE ID_PRODUCTO = " + id);
            migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '30g' WHERE ID_PRODUCTO = 78");
            foreach (var id in new[] { 79 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '120g' WHERE ID_PRODUCTO = " + id);
            migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '20g' WHERE ID_PRODUCTO = 93");
            migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '20g' WHERE ID_PRODUCTO = 96");
            foreach (var id in new[] { 111 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '50g' WHERE ID_PRODUCTO = " + id);
            migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '25g' WHERE ID_PRODUCTO = 112");
            foreach (var id in new[] { 118, 119 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '20g' WHERE ID_PRODUCTO = " + id);
            foreach (var id in new[] { 106, 107, 108 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = '250g' WHERE ID_PRODUCTO = " + id);

            // Caramelos y chicles (unidades)
            foreach (var id in new[] { 19, 88, 89 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = 'x6' WHERE ID_PRODUCTO = " + id);
            foreach (var id in new[] { 20, 90, 91 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = 'x4' WHERE ID_PRODUCTO = " + id);
            migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = 'x1' WHERE ID_PRODUCTO = 92");
            foreach (var id in new[] { 94, 113 })
                migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = 'x10' WHERE ID_PRODUCTO = " + id);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Setear TAMANO a NULL para todos los productos
            migrationBuilder.Sql("UPDATE PRODUCTOS SET TAMANO = NULL");
        }
    }
}
