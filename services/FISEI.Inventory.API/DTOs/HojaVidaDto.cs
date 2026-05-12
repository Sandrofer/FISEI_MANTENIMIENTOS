namespace Inventory.API.DTOs;

public class HojaVidaDto
{
    public EquipoResponseDto Equipo { get; set; } = new();
    public List<MantenimientoDto> Mantenimientos { get; set; } = new();
}
