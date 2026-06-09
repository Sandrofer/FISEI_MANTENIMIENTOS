namespace Inventory.API.Models;

public class RepuestoAlmacen
{
    public int Id { get; set; }
    public int RecursoSubcategoriaId { get; set; }
    public string NombreEspecifico { get; set; } = string.Empty;
    public int StockActual { get; set; }
    public int StockMinimo { get; set; }
    public RecursoSubcategoria RecursoSubcategoria { get; set; } = null!;
}
