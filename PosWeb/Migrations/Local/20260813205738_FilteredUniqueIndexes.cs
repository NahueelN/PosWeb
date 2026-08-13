using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations.Local
{
    /// <inheritdoc />
    public partial class FilteredUniqueIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_USUARIO_NOMBRE_USUARIO",
                table: "USUARIO");

            migrationBuilder.DropIndex(
                name: "IX_SUCURSAL_COD_SUCURSAL",
                table: "SUCURSAL");

            migrationBuilder.DropIndex(
                name: "IX_PROVEEDOR_COD_PROVEEDOR",
                table: "PROVEEDOR");

            migrationBuilder.DropIndex(
                name: "IX_PRODUCTO_COD_PRODUCTO",
                table: "PRODUCTO");

            migrationBuilder.DropIndex(
                name: "IX_MEDIO_PAGO_COD_MEDIO_PAGO",
                table: "MEDIO_PAGO");

            migrationBuilder.DropIndex(
                name: "IX_COMBO_COD_COMBO",
                table: "COMBO");

            migrationBuilder.DropIndex(
                name: "IX_CLIENTE_COD_CLIENTE",
                table: "CLIENTE");

            migrationBuilder.CreateIndex(
                name: "IX_USUARIO_NOMBRE_USUARIO",
                table: "USUARIO",
                column: "NOMBRE_USUARIO",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_SUCURSAL_COD_SUCURSAL",
                table: "SUCURSAL",
                column: "COD_SUCURSAL",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_PROVEEDOR_COD_PROVEEDOR",
                table: "PROVEEDOR",
                column: "COD_PROVEEDOR",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCTO_COD_PRODUCTO",
                table: "PRODUCTO",
                column: "COD_PRODUCTO",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_MEDIO_PAGO_COD_MEDIO_PAGO",
                table: "MEDIO_PAGO",
                column: "COD_MEDIO_PAGO",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_COMBO_COD_COMBO",
                table: "COMBO",
                column: "COD_COMBO",
                unique: true,
                filter: "ACTIVO = 1");

            migrationBuilder.CreateIndex(
                name: "IX_CLIENTE_COD_CLIENTE",
                table: "CLIENTE",
                column: "COD_CLIENTE",
                unique: true,
                filter: "ACTIVO = 1");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_USUARIO_NOMBRE_USUARIO",
                table: "USUARIO");

            migrationBuilder.DropIndex(
                name: "IX_SUCURSAL_COD_SUCURSAL",
                table: "SUCURSAL");

            migrationBuilder.DropIndex(
                name: "IX_PROVEEDOR_COD_PROVEEDOR",
                table: "PROVEEDOR");

            migrationBuilder.DropIndex(
                name: "IX_PRODUCTO_COD_PRODUCTO",
                table: "PRODUCTO");

            migrationBuilder.DropIndex(
                name: "IX_MEDIO_PAGO_COD_MEDIO_PAGO",
                table: "MEDIO_PAGO");

            migrationBuilder.DropIndex(
                name: "IX_COMBO_COD_COMBO",
                table: "COMBO");

            migrationBuilder.DropIndex(
                name: "IX_CLIENTE_COD_CLIENTE",
                table: "CLIENTE");

            migrationBuilder.CreateIndex(
                name: "IX_USUARIO_NOMBRE_USUARIO",
                table: "USUARIO",
                column: "NOMBRE_USUARIO",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SUCURSAL_COD_SUCURSAL",
                table: "SUCURSAL",
                column: "COD_SUCURSAL",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PROVEEDOR_COD_PROVEEDOR",
                table: "PROVEEDOR",
                column: "COD_PROVEEDOR",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PRODUCTO_COD_PRODUCTO",
                table: "PRODUCTO",
                column: "COD_PRODUCTO",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_MEDIO_PAGO_COD_MEDIO_PAGO",
                table: "MEDIO_PAGO",
                column: "COD_MEDIO_PAGO",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_COMBO_COD_COMBO",
                table: "COMBO",
                column: "COD_COMBO",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CLIENTE_COD_CLIENTE",
                table: "CLIENTE",
                column: "COD_CLIENTE",
                unique: true);
        }
    }
}
