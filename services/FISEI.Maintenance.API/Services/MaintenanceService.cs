using FISEI.Maintenance.API.Data;
using FISEI.Maintenance.API.DTOs;
using FISEI.Maintenance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FISEI.Maintenance.API.Services;

public class MaintenanceService
{
    private readonly MaintenanceDbContext _context;

    public MaintenanceService(MaintenanceDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<MantenimientoDto>> ObtenerMantenimientosAsync(
        string? estado = null, string? laboratorio = null, int? equipoId = null, DateOnly? desde = null, DateOnly? hasta = null)
    {
        var query = _context.Mantenimientos
            .Include(m => m.Equipo)
            .AsQueryable();

        if (!string.IsNullOrEmpty(estado))
            query = query.Where(m => m.Estado == estado);

        if (!string.IsNullOrEmpty(laboratorio))
            query = query.Where(m => m.Equipo.Laboratorio == laboratorio);

        if (equipoId.HasValue)
            query = query.Where(m => m.EquipoId == equipoId.Value);

        if (desde.HasValue)
            query = query.Where(m => m.FechaProgramada >= desde.Value);

        if (hasta.HasValue)
            query = query.Where(m => m.FechaProgramada <= hasta.Value);

        var mantenimientos = await query.OrderByDescending(m => m.FechaProgramada).ToListAsync();

        return mantenimientos.Select(MapToDto);
    }

    public async Task<MantenimientoDto?> ObtenerMantenimientoPorIdAsync(int id)
    {
        var m = await _context.Mantenimientos
            .Include(m => m.Equipo)
            .FirstOrDefaultAsync(x => x.Id == id);
        return m == null ? null : MapToDto(m);
    }

    public async Task<MantenimientoDto> CrearMantenimientoAsync(CrearMantenimientoDto dto)
    {
        var equipo = await _context.Equipos.FindAsync(dto.EquipoId);
        if (equipo == null)
            throw new ArgumentException("El equipo especificado no existe.");

        var mantenimiento = new Mantenimiento
        {
            EquipoId = dto.EquipoId,
            Tipo = dto.Tipo,
            Responsable = dto.Responsable,
            Prioridad = dto.Prioridad,
            Observaciones = dto.Observaciones,
            Estado = "Pendiente",
            FechaCreacion = DateTime.UtcNow
        };

        if (dto.FechaProgramada.HasValue)
        {
            mantenimiento.FechaProgramada = dto.FechaProgramada.Value;
        }
        else if (dto.Tipo.Equals("Preventivo", StringComparison.OrdinalIgnoreCase))
        {
            // Lógica automática para fecha programada: si es preventivo, agendar a 6 meses
            mantenimiento.FechaProgramada = DateOnly.FromDateTime(DateTime.Today.AddMonths(6));
        }
        else
        {
            // Para otros, agendar el mismo día o según regla de negocio
            mantenimiento.FechaProgramada = DateOnly.FromDateTime(DateTime.Today);
        }

        _context.Mantenimientos.Add(mantenimiento);
        await _context.SaveChangesAsync();

        // Recargar con equipo para el DTO
        var mCargado = await _context.Mantenimientos.Include(m => m.Equipo).FirstAsync(m => m.Id == mantenimiento.Id);
        return MapToDto(mCargado);
    }

    public async Task<bool> ReprogramarMantenimientoAsync(int id, ReprogramarMantenimientoDto dto)
    {
        var m = await _context.Mantenimientos.FindAsync(id);
        if (m == null) return false;

        m.FechaProgramada = dto.NuevaFecha;
        m.Observaciones = string.IsNullOrEmpty(m.Observaciones) 
            ? $"Reprogramado: {dto.Motivo}" 
            : $"{m.Observaciones} | Reprogramado: {dto.Motivo}";
        m.Estado = "Pendiente";
        m.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> IniciarMantenimientoAsync(int id)
    {
        var m = await _context.Mantenimientos.FindAsync(id);
        if (m == null) return false;

        m.Estado = "EnProceso";
        m.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CompletarMantenimientoAsync(int id, CompletarMantenimientoDto dto)
    {
        var m = await _context.Mantenimientos.FindAsync(id);
        if (m == null) return false;

        m.Estado = "Completado";
        m.FechaRealizada = dto.FechaRealizada;
        m.Diagnostico = dto.Diagnostico;
        m.AccionesRealizadas = dto.AccionesRealizadas;
        if (!string.IsNullOrEmpty(dto.Observaciones))
            m.Observaciones = dto.Observaciones;
        m.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CancelarMantenimientoAsync(int id)
    {
        var m = await _context.Mantenimientos.FindAsync(id);
        if (m == null) return false;

        m.Estado = "Cancelado";
        m.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    private static MantenimientoDto MapToDto(Mantenimiento m)
    {
        return new MantenimientoDto
        {
            Id = m.Id,
            EquipoId = m.EquipoId,
            FechaProgramada = m.FechaProgramada,
            FechaRealizada = m.FechaRealizada,
            Estado = m.Estado,
            Tipo = m.Tipo,
            Responsable = m.Responsable,
            Prioridad = m.Prioridad,
            Observaciones = m.Observaciones,
            Diagnostico = m.Diagnostico,
            AccionesRealizadas = m.AccionesRealizadas,
            FechaCreacion = m.FechaCreacion,
            Equipo = new EquipoResumenDto
            {
                Id = m.Equipo.Id,
                NumeroSerie = m.Equipo.NumeroSerie,
                Laboratorio = m.Equipo.Laboratorio
            }
        };
    }
}
