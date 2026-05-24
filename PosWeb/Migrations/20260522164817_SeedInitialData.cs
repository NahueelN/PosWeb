using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class SeedInitialData : Migration
    {
        /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DeleteData(
            table: "STOCK_POR_SUCURSAL",
            keyColumn: "ID_STOCK_SUCURSAL",
            keyValue: 1);
        migrationBuilder.DeleteData(
            table: "STOCK_POR_SUCURSAL",
            keyColumn: "ID_STOCK_SUCURSAL",
            keyValue: 2);
        migrationBuilder.DeleteData(
            table: "STOCK_POR_SUCURSAL",
            keyColumn: "ID_STOCK_SUCURSAL",
            keyValue: 3);

        migrationBuilder.DeleteData(
            table: "PRODUCTOS",
            keyColumn: "ID_PRODUCTO",
            keyValue: 1);
        migrationBuilder.DeleteData(
            table: "PRODUCTOS",
            keyColumn: "ID_PRODUCTO",
            keyValue: 2);
        migrationBuilder.DeleteData(
            table: "PRODUCTOS",
            keyColumn: "ID_PRODUCTO",
            keyValue: 3);

        migrationBuilder.DeleteData(
            table: "SUCURSALES",
            keyColumn: "ID_SUCURSAL",
            keyValue: 1);

        migrationBuilder.InsertData(
            table: "SUCURSALES",
            columns: new[] { "ID_SUCURSAL", "ACTIVO", "CODIGO", "NOMBRE", "NUMERO" },
            values: new object[] { 1, true, "001", "Sucursal Central", 1 });

        migrationBuilder.InsertData(
            table: "PRODUCTOS",
            columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
            values: new object[] { 1, true, "7798012345678", 15.0, "Coca-Cola 500ml", 30.0, 100 });

        migrationBuilder.InsertData(
            table: "PRODUCTOS",
            columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
            values: new object[] { 2, true, "7798012345685", 10.0, "Pepsi 500ml", 25.0, 80 });

        migrationBuilder.InsertData(
            table: "PRODUCTOS",
            columns: new[] { "ID_PRODUCTO", "ACTIVO", "CODIGO_BARRA", "COSTO", "NOMBRE", "PRECIO", "STOCK" },
            values: new object[] { 3, true, "7798012345692", 12.0, "Agua Mineral 500ml", 20.0, 150 });

        migrationBuilder.InsertData(
            table: "STOCK_POR_SUCURSAL",
            columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
            values: new object[] { 1, 1, 1, 100 });
        migrationBuilder.InsertData(
            table: "STOCK_POR_SUCURSAL",
            columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
            values: new object[] { 2, 2, 1, 80 });
        migrationBuilder.InsertData(
            table: "STOCK_POR_SUCURSAL",
            columns: new[] { "ID_STOCK_SUCURSAL", "ID_PRODUCTO", "ID_SUCURSAL", "STOCK" },
            values: new object[] { 3, 3, 1, 150 });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DeleteData(
            table: "STOCK_POR_SUCURSAL",
            keyColumn: "ID_STOCK_SUCURSAL",
            keyValue: 1);

        migrationBuilder.DeleteData(
            table: "STOCK_POR_SUCURSAL",
            keyColumn: "ID_STOCK_SUCURSAL",
            keyValue: 2);

        migrationBuilder.DeleteData(
            table: "STOCK_POR_SUCURSAL",
            keyColumn: "ID_STOCK_SUCURSAL",
            keyValue: 3);

        migrationBuilder.DeleteData(
            table: "PRODUCTOS",
            keyColumn: "ID_PRODUCTO",
            keyValue: 3);

        migrationBuilder.DeleteData(
            table: "PRODUCTOS",
            keyColumn: "ID_PRODUCTO",
            keyValue: 2);

        migrationBuilder.DeleteData(
            table: "PRODUCTOS",
            keyColumn: "ID_PRODUCTO",
            keyValue: 1);

        migrationBuilder.DeleteData(
            table: "SUCURSALES",
            keyColumn: "ID_SUCURSAL",
            keyValue: 1);
    }
    }
}
