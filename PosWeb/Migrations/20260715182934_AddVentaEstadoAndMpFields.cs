using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations
{
    /// <inheritdoc />
    public partial class AddVentaEstadoAndMpFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ESTADO",
                table: "VENTA",
                type: "varchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Completada")
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "MP_ACCESS_TOKEN",
                table: "SUSCRIPCION",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "MP_FECHA_VINC",
                table: "SUSCRIPCION",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MP_USER_ID",
                table: "SUSCRIPCION",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "MP_VINCULADO",
                table: "SUSCRIPCION",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ESTADO",
                table: "VENTA");

            migrationBuilder.DropColumn(
                name: "MP_ACCESS_TOKEN",
                table: "SUSCRIPCION");

            migrationBuilder.DropColumn(
                name: "MP_FECHA_VINC",
                table: "SUSCRIPCION");

            migrationBuilder.DropColumn(
                name: "MP_USER_ID",
                table: "SUSCRIPCION");

            migrationBuilder.DropColumn(
                name: "MP_VINCULADO",
                table: "SUSCRIPCION");
        }
    }
}
