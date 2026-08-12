using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PosWeb.Migrations.Local
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
                type: "TEXT",
                maxLength: 20,
                nullable: false,
                defaultValue: "Completada");

            migrationBuilder.AddColumn<string>(
                name: "MP_ACCESS_TOKEN",
                table: "SUSCRIPCION",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "MP_FECHA_VINC",
                table: "SUSCRIPCION",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MP_USER_ID",
                table: "SUSCRIPCION",
                type: "TEXT",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "MP_VINCULADO",
                table: "SUSCRIPCION",
                type: "INTEGER",
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
