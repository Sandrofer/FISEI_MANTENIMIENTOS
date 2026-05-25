using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FISEI.Maintenance.API.Migrations
{
    /// <inheritdoc />
    public partial class InitialMaintenance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Alterar Mantenimientos para agregar nuevas columnas
            migrationBuilder.AddColumn<DateOnly>(
                name: "FechaRealizada",
                table: "Mantenimientos",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tipo",
                table: "Mantenimientos",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Responsable",
                table: "Mantenimientos",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Prioridad",
                table: "Mantenimientos",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Diagnostico",
                table: "Mantenimientos",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AccionesRealizadas",
                table: "Mantenimientos",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaCreacion",
                table: "Mantenimientos",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETDATE()");

            migrationBuilder.AddColumn<DateTime>(
                name: "FechaActualizacion",
                table: "Mantenimientos",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "FechaRealizada", table: "Mantenimientos");
            migrationBuilder.DropColumn(name: "Tipo", table: "Mantenimientos");
            migrationBuilder.DropColumn(name: "Responsable", table: "Mantenimientos");
            migrationBuilder.DropColumn(name: "Prioridad", table: "Mantenimientos");
            migrationBuilder.DropColumn(name: "Diagnostico", table: "Mantenimientos");
            migrationBuilder.DropColumn(name: "AccionesRealizadas", table: "Mantenimientos");
            migrationBuilder.DropColumn(name: "FechaCreacion", table: "Mantenimientos");
            migrationBuilder.DropColumn(name: "FechaActualizacion", table: "Mantenimientos");
        }
    }
}
