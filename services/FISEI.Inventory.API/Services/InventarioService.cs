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
}