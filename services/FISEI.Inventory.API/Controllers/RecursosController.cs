using Inventory.API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Inventory.API.Controllers;

[ApiController]
[Route("api/inventario/recursos")]
public class RecursosController : ControllerBase
{
    private readonly InventoryDbContext _context;

    public RecursosController(InventoryDbContext context)
    {
        _context = context;
    }

    [HttpGet("subcategorias/{tipoPrincipal}")]
    public async Task<IActionResult> ObtenerSubcategorias(string tipoPrincipal)
    {
        var subcategorias = await _context.RecursoSubcategorias
            .Where(r => r.TipoPrincipal == tipoPrincipal)
            .Select(r => new { r.Id, r.TipoPrincipal, r.NombreSubcategoria })
            .ToListAsync();
            
        return Ok(subcategorias);
    }
}
