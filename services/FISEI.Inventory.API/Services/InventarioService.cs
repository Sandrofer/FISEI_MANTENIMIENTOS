using Inventory.API.Data;
using Inventory.API.DTOs;
using Inventory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Inventory.API.Services;

public class InventarioService
{
    private readonly InventoryDbContext _context;

    public InventarioService(InventoryDbContext context)
    {
        _context = context;
    }

    public async Task<EquipoResponseDto> RegistrarEquipoAsync(CrearEquipoDto dto)
    {
        var existe = await _context.Equipos
            .AnyAsync(e => e.CodigoInventario == dto.CodigoInventario || e.NumeroSerie == dto.NumeroSerie);
        if (existe)
            throw new InvalidOperationException("Ya existe un equipo con ese código o número de serie.");

        var equipo = new Equipo
        {
            Id = Guid.NewGuid(),
            CodigoInventario = dto.CodigoInventario,
            NumeroSerie = dto.NumeroSerie,
            NombreModelo = dto.NombreModelo,
            CategoriaId = dto.CategoriaId,
            MarcaId = dto.MarcaId,
            UbicacionId = dto.UbicacionId,
            Estado = dto.Estado,
            ResponsableId = dto.ResponsableId,
            EspecificacionesTecnicas = dto.EspecificacionesTecnicas ?? "{}",
            FechaRegistro = DateTime.UtcNow
        };

        _context.Equipos.Add(equipo);
        await _context.SaveChangesAsync();
        return await MapEquipoAsync(equipo.Id) ?? throw new InvalidOperationException("No se pudo recuperar el equipo.");
    }

    public async Task<List<EquipoResponseDto>> ObtenerEquiposAsync(string? estado = null, string? procesador = null)
    {
        var query = _context.Equipos.AsNoTracking().Include(e => e.Categoria).Include(e => e.Marca).Include(e => e.Ubicacion).AsQueryable();
        if (!string.IsNullOrWhiteSpace(estado)) query = query.Where(e => e.Estado == estado);
        if (!string.IsNullOrWhiteSpace(procesador)) query = query.Where(e => e.EspecificacionesTecnicas.Contains(procesador));
        return await query.OrderByDescending(e => e.FechaRegistro).Select(e => ToDto(e)).ToListAsync();
    }

    public async Task<List<Categoria>> ObtenerCategoriasAsync() => await _context.Categorias.AsNoTracking().ToListAsync();
    public async Task<List<Marca>> ObtenerMarcasAsync() => await _context.Marcas.AsNoTracking().ToListAsync();
    public async Task<List<Ubicacion>> ObtenerUbicacionesAsync() => await _context.Ubicaciones.AsNoTracking().ToListAsync();

    public async Task<EquipoResponseDto?> ObtenerHojaVidaEquipoAsync(Guid id) => await MapEquipoAsync(id);

    public async Task<EquipoResponseDto?> ActualizarEquipoAsync(Guid id, ActualizarEquipoDto dto)
    {
        var equipo = await _context.Equipos.FindAsync(id);
        if (equipo == null) return null;
        equipo.CodigoInventario = dto.CodigoInventario ?? equipo.CodigoInventario;
        equipo.Estado = dto.Estado ?? equipo.Estado;
        await _context.SaveChangesAsync();
        return await MapEquipoAsync(id);
    }

    public async Task<bool> EliminarEquipoAsync(Guid id)
    {
        var equipo = await _context.Equipos.FindAsync(id);
        if (equipo == null) return false;
        _context.Equipos.Remove(equipo);
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task<EquipoResponseDto?> MapEquipoAsync(Guid id)
    {
        return await _context.Equipos.AsNoTracking().Include(e => e.Categoria).Include(e => e.Marca).Include(e => e.Ubicacion)
            .Where(e => e.Id == id).Select(e => ToDto(e)).FirstOrDefaultAsync();
    }

    private static EquipoResponseDto ToDto(Equipo e) => new()
    {
        Id = e.Id, CodigoInventario = e.CodigoInventario, NumeroSerie = e.NumeroSerie, NombreModelo = e.NombreModelo,
        CategoriaId = e.CategoriaId, Categoria = e.Categoria.Nombre, MarcaId = e.MarcaId, Marca = e.Marca.Nombre,
        UbicacionId = e.UbicacionId, Ubicacion = e.Ubicacion.Nombre, Estado = e.Estado, ResponsableId = e.ResponsableId,
        EspecificacionesTecnicas = e.EspecificacionesTecnicas, FechaRegistro = e.FechaRegistro, LoteImportacionId = e.LoteImportacionId
    };
}