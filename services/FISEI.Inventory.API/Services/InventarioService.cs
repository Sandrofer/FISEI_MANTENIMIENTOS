using FISEI.Maintenance.API.Data;
using Inventory.API.Data;
using Inventory.API.DTOs;
using Inventory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Inventory.API.Services;

public class InventarioService
{
    private readonly InventoryDbContext _context;
    private readonly MaintenanceDbContext _maintenanceContext;

    public InventarioService(InventoryDbContext context, MaintenanceDbContext maintenanceContext)
    {
        _context = context;
        _maintenanceContext = maintenanceContext;
    }

    public async Task<EquipoResponseDto> RegistrarEquipoAsync(CrearEquipoDto dto)
    {
        // Verificar número de serie duplicado
        var existe = await _context.Equipos
            .AnyAsync(e => e.NumeroSerie == dto.NumeroSerie);

        if (existe)
            throw new InvalidOperationException($"Ya existe un equipo con el número de serie {dto.NumeroSerie}");

        // Crear el equipo
        var equipo = new Equipo
        {
            NumeroSerie = dto.NumeroSerie,
            Marca = dto.Marca,
            Modelo = dto.Modelo,
            Procesador = dto.Procesador,
            Laboratorio = dto.Laboratorio,
            FechaCompra = dto.FechaCompra,
            Estado = "Activo",
            FechaRegistro = DateTime.Now
        };

        _context.Equipos.Add(equipo);
        await _context.SaveChangesAsync();

        // Generar 3 mantenimientos anuales automáticamente
        var mantenimientos = new List<Mantenimiento>
        {
            new Mantenimiento
            {
                EquipoId = equipo.Id,
                FechaProgramada = DateOnly.FromDateTime(DateTime.Now.AddMonths(4)),
                Estado = "Pendiente"
            },
            new Mantenimiento
            {
                EquipoId = equipo.Id,
                FechaProgramada = DateOnly.FromDateTime(DateTime.Now.AddMonths(8)),
                Estado = "Pendiente"
            },
            new Mantenimiento
            {
                EquipoId = equipo.Id,
                FechaProgramada = DateOnly.FromDateTime(DateTime.Now.AddMonths(12)),
                Estado = "Pendiente"
            }
        };

        _context.Mantenimientos.AddRange(mantenimientos);
        await _context.SaveChangesAsync();

        return new EquipoResponseDto
        {
            Id = equipo.Id,
            NumeroSerie = equipo.NumeroSerie,
            Marca = equipo.Marca,
            Modelo = equipo.Modelo,
            Procesador = equipo.Procesador,
            Laboratorio = equipo.Laboratorio,
            FechaCompra = equipo.FechaCompra,
            Estado = equipo.Estado,
            FechaRegistro = equipo.FechaRegistro,
            Mantenimientos = mantenimientos.Select(m => new MantenimientoResponseDto
            {
                Id = m.Id,
                FechaProgramada = m.FechaProgramada,
                Estado = m.Estado
            }).ToList()
        };
    }

    public async Task<List<EquipoResponseDto>> ObtenerEquiposAsync(
        string? estado = null,
        string? procesador = null,
        DateOnly? fechaDesde = null,
        DateOnly? fechaHasta = null)
    {
        var query = _context.Equipos.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(estado))
        {
            query = query.Where(e => e.Estado == estado);
        }

        if (!string.IsNullOrWhiteSpace(procesador))
        {
            query = query.Where(e => e.Procesador.Contains(procesador));
        }

        if (fechaDesde.HasValue)
        {
            query = query.Where(e => e.FechaCompra >= fechaDesde.Value);
        }

        if (fechaHasta.HasValue)
        {
            query = query.Where(e => e.FechaCompra <= fechaHasta.Value);
        }

        return await query
            .OrderByDescending(e => e.FechaRegistro)
            .Select(e => new EquipoResponseDto
            {
                Id = e.Id,
                NumeroSerie = e.NumeroSerie,
                Marca = e.Marca,
                Modelo = e.Modelo,
                Procesador = e.Procesador,
                Laboratorio = e.Laboratorio,
                FechaCompra = e.FechaCompra,
                Estado = e.Estado,
                FechaRegistro = e.FechaRegistro,
                Mantenimientos = new List<MantenimientoResponseDto>()
            })
            .ToListAsync();
    }

    public async Task<HojaVidaDto?> ObtenerHojaVidaEquipoAsync(int id)
    {
        var equipo = await _context.Equipos
            .AsNoTracking()
            .Where(e => e.Id == id)
            .Select(e => new EquipoResponseDto
            {
                Id = e.Id,
                NumeroSerie = e.NumeroSerie,
                Marca = e.Marca,
                Modelo = e.Modelo,
                Procesador = e.Procesador,
                Laboratorio = e.Laboratorio,
                FechaCompra = e.FechaCompra,
                Estado = e.Estado,
                FechaRegistro = e.FechaRegistro,
                Mantenimientos = new List<MantenimientoResponseDto>()
            })
            .FirstOrDefaultAsync();

        if (equipo is null)
        {
            return null;
        }

        var mantenimientos = await _maintenanceContext.Mantenimientos
            .AsNoTracking()
            .Where(m => m.EquipoId == id)
            .OrderByDescending(m => m.FechaProgramada)
            .Select(m => new MantenimientoDto
            {
                Id = m.Id,
                FechaProgramada = m.FechaProgramada,
                FechaRealizada = m.FechaRealizada,
                Estado = m.Estado,
                Tipo = m.Tipo,
                Responsable = m.Responsable,
                Prioridad = m.Prioridad,
                Observaciones = m.Observaciones,
                Diagnostico = m.Diagnostico,
                AccionesRealizadas = m.AccionesRealizadas
            })
            .ToListAsync();

        return new HojaVidaDto
        {
            Equipo = equipo,
            Mantenimientos = mantenimientos
        };
    }
}
