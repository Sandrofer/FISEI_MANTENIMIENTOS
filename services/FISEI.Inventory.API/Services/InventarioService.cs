using Inventory.API.Data;
using Inventory.API.DTOs;
using Inventory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Inventory.API.Services;

public class InventarioService
{
    private readonly InventoryDbContext _context;
    // private readonly MaintenanceDbContext _maintenanceContext;

    public InventarioService(InventoryDbContext context)//, MaintenanceDbContext maintenanceContext)
    {
        _context = context;
        // _maintenanceContext = maintenanceContext;
    }

    public async Task<EquipoResponseDto> RegistrarEquipoAsync(CrearEquipoDto dto)
    {
        var existe = await _context.Equipos
            .AnyAsync(e => e.CodigoInventario == dto.CodigoInventario || e.NumeroSerie == dto.NumeroSerie);

        if (existe)
        {
            throw new InvalidOperationException("Ya existe un equipo con el codigo de inventario o numero de serie indicado.");
        }

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
            EspecificacionesTecnicas = string.IsNullOrWhiteSpace(dto.EspecificacionesTecnicas) ? "{}" : dto.EspecificacionesTecnicas,
            FechaRegistro = DateTime.UtcNow
        };

        _context.Equipos.Add(equipo);
        await _context.SaveChangesAsync();

        return await MapEquipoAsync(equipo.Id) ?? throw new InvalidOperationException("No se pudo recuperar el equipo registrado.");
    }

    public async Task<List<EquipoResponseDto>> ObtenerEquiposAsync(string? estado = null)
    {
        var query = _context.Equipos
            .AsNoTracking()
            .Include(e => e.Categoria)
            .Include(e => e.Marca)
            .Include(e => e.Ubicacion)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(estado))
        {
            query = query.Where(e => e.Estado == estado);
        }

        return await query
            .OrderByDescending(e => e.FechaRegistro)
            .Select(e => ToDto(e))
            .ToListAsync();
    }

    public async Task<HojaVidaDto?> ObtenerHojaVidaEquipoAsync(Guid id)
    {
        var equipo = await MapEquipoAsync(id);

        if (equipo is null)
        {
            return null;
        }

        return new HojaVidaDto
        {
            Equipo = equipo,
            Mantenimientos = []
        };
    }

    public async Task<EquipoResponseDto?> ActualizarEquipoAsync(Guid id, ActualizarEquipoDto dto)
    {
        var equipo = await _context.Equipos.FirstOrDefaultAsync(e => e.Id == id);

        if (equipo is null)
        {
            return null;
        }

        equipo.CodigoInventario = dto.CodigoInventario;
        equipo.NumeroSerie = dto.NumeroSerie;
        equipo.NombreModelo = dto.NombreModelo;
        equipo.CategoriaId = dto.CategoriaId;
        equipo.MarcaId = dto.MarcaId;
        equipo.UbicacionId = dto.UbicacionId;
        equipo.Estado = dto.Estado;
        equipo.ResponsableId = dto.ResponsableId;
        equipo.EspecificacionesTecnicas = string.IsNullOrWhiteSpace(dto.EspecificacionesTecnicas)
            ? "{}"
            : dto.EspecificacionesTecnicas;

        await _context.SaveChangesAsync();
        return await MapEquipoAsync(id);
    }

    public async Task<bool> EliminarEquipoAsync(Guid id)
    {
        var equipo = await _context.Equipos.FirstOrDefaultAsync(e => e.Id == id);

        if (equipo is null)
        {
            return false;
        }

        _context.Equipos.Remove(equipo);
        await _context.SaveChangesAsync();
        return true;
    }

    private async Task<EquipoResponseDto?> MapEquipoAsync(Guid id)
    {
        return await _context.Equipos
            .AsNoTracking()
            .Include(e => e.Categoria)
            .Include(e => e.Marca)
            .Include(e => e.Ubicacion)
            .Where(e => e.Id == id)
            .Select(e => ToDto(e))
            .FirstOrDefaultAsync();
    }

    private static EquipoResponseDto ToDto(Equipo e)
    {
        return new EquipoResponseDto
        {
            Id = e.Id,
            CodigoInventario = e.CodigoInventario,
            NumeroSerie = e.NumeroSerie,
            NombreModelo = e.NombreModelo,
            CategoriaId = e.CategoriaId,
            Categoria = e.Categoria.Nombre,
            MarcaId = e.MarcaId,
            Marca = e.Marca.Nombre,
            UbicacionId = e.UbicacionId,
            Ubicacion = e.Ubicacion.Nombre,
            Estado = e.Estado,
            ResponsableId = e.ResponsableId,
            EspecificacionesTecnicas = e.EspecificacionesTecnicas,
            FechaRegistro = e.FechaRegistro,
            LoteImportacionId = e.LoteImportacionId
        };
    }
}
