using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class MakeCodClienteNullable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "COD_CLIENTE",
                table: "CLIENTE",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldMaxLength: 50)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "CLIENTE",
                keyColumn: "COD_CLIENTE",
                keyValue: null,
                column: "COD_CLIENTE",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "COD_CLIENTE",
                table: "CLIENTE",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldMaxLength: 50,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }
    }
}
