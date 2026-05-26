namespace Inventory.API.DTOs;

public class ActualizarEquipoDto
{
    public string NumeroSerie { get; set; } = string.Empty;
    public string Marca { get; set; } = string.Empty;
    public string Modelo { get; set; } = string.Empty;
    public string Procesador { get; set; } = string.Empty;
    public string Laboratorio { get; set; } = string.Empty;
    public DateOnly FechaCompra { get; set; }
    public string Estado { get; set; } = string.Empty;
}