using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FISEI.Maintenance.API.Migrations
{
    /// <inheritdoc />
    public partial class CompletarModeloMantenimiento : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CatActividades",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Descripcion = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatActividades", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CatFallas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Categoria = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Detalle = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatFallas", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MantenimientoActividades",
                columns: table => new
                {
                    MantenimientoId = table.Column<int>(type: "int", nullable: false),
                    ActividadId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MantenimientoActividades", x => new { x.MantenimientoId, x.ActividadId });
                    table.ForeignKey(
                        name: "FK_MantenimientoActividades_CatActividades_ActividadId",
                        column: x => x.ActividadId,
                        principalTable: "CatActividades",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MantenimientoActividades_Mantenimientos_MantenimientoId",
                        column: x => x.MantenimientoId,
                        principalTable: "Mantenimientos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MantenimientoActividades_ActividadId",
                table: "MantenimientoActividades",
                column: "ActividadId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CatFallas");

            migrationBuilder.DropTable(
                name: "MantenimientoActividades");

            migrationBuilder.DropTable(
                name: "CatActividades");
        }
    }
}
