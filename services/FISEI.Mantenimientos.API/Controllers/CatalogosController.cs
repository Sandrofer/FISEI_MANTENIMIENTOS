using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FISEI.Mantenimientos.API.Models;
using System.Linq;
using System.Threading.Tasks;

namespace FISEI.Mantenimientos.API.Controllers;

[ApiController]
[Route("api/mantenimientos/catalogos")]
public class CatalogosController : ControllerBase
{
    private readonly MantenimientosDbContext _context;

    public CatalogosController(MantenimientosDbContext context)
    {
        _context = context;
    }

    [HttpGet("diagnosticos/{categoriaEquipo}")]
    public async Task<IActionResult> ObtenerDiagnosticos(string categoriaEquipo)
    {
        var diagnosticos = await _context.DiagnosticosPredefinidos
            .Where(d => d.CategoriaEquipo == categoriaEquipo)
            .Select(d => new { d.Id, d.Codigo, d.Descripcion, d.CategoriaEquipo })
            .ToListAsync();
        return Ok(diagnosticos);
    }

    [HttpGet("acciones/{categoriaEquipo}")]
    public async Task<IActionResult> ObtenerAcciones(string categoriaEquipo)
    {
        var acciones = await _context.AccionesPredefinidas
            .Where(a => a.CategoriaEquipo == categoriaEquipo)
            .Select(a => new { a.Id, a.Nombre, a.CategoriaEquipo })
            .ToListAsync();
        return Ok(acciones);
    }
}
