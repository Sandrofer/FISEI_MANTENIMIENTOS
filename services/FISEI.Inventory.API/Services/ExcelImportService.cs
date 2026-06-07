using Inventory.API.Data;
using Inventory.API.DTOs;
using Inventory.API.Models;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;

namespace Inventory.API.Services;

public class ExcelImportService
{
    private static readonly string[] Columnas =
    [
        "CodigoInventario",
        "NumeroSerie",
        "NombreModelo",
        "Categoria",
        "Marca",
        "Ubicacion",
        "Estado"
    ];

    private static readonly HashSet<string> EstadosPermitidos = new(StringComparer.OrdinalIgnoreCase)
    {
        "Operativo",
        "Mantenimiento",
        "Dado de baja"
    };

    private readonly InventoryDbContext _context;

    public ExcelImportService(InventoryDbContext context)
    {
        _context = context;
    }

    public byte[] GenerarPlantilla()
    {
        ExcelPackage.License.SetNonCommercialPersonal("FISEI");

        using var package = new ExcelPackage();
        var worksheet = package.Workbook.Worksheets.Add("Equipos");

        for (var index = 0; index < Columnas.Length; index++)
        {
            worksheet.Cells[1, index + 1].Value = Columnas[index];
            worksheet.Cells[1, index + 1].Style.Font.Bold = true;
        }

        var colEstado = Array.IndexOf(Columnas, "Estado") + 1;
        if (colEstado > 0)
        {
            var excelCol = (char)('A' + colEstado - 1);
            var validation = worksheet.DataValidations.AddListValidation($"{excelCol}2:{excelCol}10000");
            validation.ShowErrorMessage = true;
            validation.ErrorTitle = "Estado Invalido";
            validation.Error = "Por favor, seleccione un estado de la lista.";
            foreach (var estado in EstadosPermitidos)
            {
                validation.Formula.Values.Add(estado);
            }
        }

        worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();
        return package.GetAsByteArray();
    }

    public async Task<ImportacionEquiposResponseDto> ImportarAsync(
        IFormFile archivo,
        Guid usuarioId,
        bool importacionParcial,
        bool autoCrear,
        CancellationToken cancellationToken = default)
    {
        ExcelPackage.License.SetNonCommercialPersonal("FISEI");

        var errores = new List<ErrorImportacionDto>();

        if (archivo.Length == 0)
        {
            errores.Add(new ErrorImportacionDto
            {
                Fila = 0,
                Campo = "Archivo",
                Mensaje = "El archivo esta vacio."
            });
            return new ImportacionEquiposResponseDto { Success = false, Errores = errores };
        }

        if (!Path.GetExtension(archivo.FileName).Equals(".xlsx", StringComparison.OrdinalIgnoreCase))
        {
            errores.Add(new ErrorImportacionDto
            {
                Fila = 0,
                Campo = "Archivo",
                Mensaje = "Solo se permiten archivos .xlsx."
            });
            return new ImportacionEquiposResponseDto { Success = false, Errores = errores };
        }

        await using var stream = archivo.OpenReadStream();
        using var package = new ExcelPackage(stream);
        var worksheet = package.Workbook.Worksheets.FirstOrDefault();

        if (worksheet?.Dimension is null)
        {
            errores.Add(new ErrorImportacionDto
            {
                Fila = 0,
                Campo = "Archivo",
                Mensaje = "El archivo no contiene filas para importar."
            });
            return new ImportacionEquiposResponseDto { Success = false, Errores = errores };
        }

        var mapaColumnas = MapearColumnas(worksheet, errores);
        if (errores.Count > 0)
        {
            return new ImportacionEquiposResponseDto { Success = false, Errores = errores };
        }

        var filas = LeerFilas(worksheet, mapaColumnas);
        if (filas.Count == 0)
        {
            errores.Add(new ErrorImportacionDto
            {
                Fila = 0,
                Campo = "Archivo",
                Mensaje = "La plantilla no contiene registros."
            });
            return new ImportacionEquiposResponseDto { Success = false, Errores = errores };
        }

        ValidarCamposObligatoriosYEstados(filas, errores);
        ValidarDuplicadosEnArchivo(filas, errores);

        var codigos = filas.Select(f => f.CodigoInventario).Where(v => !string.IsNullOrWhiteSpace(v)).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var series = filas.Select(f => f.NumeroSerie).Where(v => !string.IsNullOrWhiteSpace(v)).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var categoriasNombres = filas.Select(f => f.Categoria).Where(v => !string.IsNullOrWhiteSpace(v)).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var marcasNombres = filas.Select(f => f.Marca).Where(v => !string.IsNullOrWhiteSpace(v)).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var ubicacionesNombres = filas.Select(f => f.Ubicacion).Where(v => !string.IsNullOrWhiteSpace(v)).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var codigosExistentes = await _context.Equipos
            .AsNoTracking()
            .Where(e => codigos.Contains(e.CodigoInventario))
            .Select(e => e.CodigoInventario)
            .ToListAsync(cancellationToken);

        var seriesExistentes = await _context.Equipos
            .AsNoTracking()
            .Where(e => series.Contains(e.NumeroSerie))
            .Select(e => e.NumeroSerie)
            .ToListAsync(cancellationToken);

        var categorias = await _context.Categorias.AsNoTracking().ToListAsync(cancellationToken);
        var categoriasDict = categorias.ToDictionary(c => NormalizeString(c.Nombre), c => c.Id, StringComparer.OrdinalIgnoreCase);

        var marcas = await _context.Marcas.AsNoTracking().ToListAsync(cancellationToken);
        var marcasDict = marcas.ToDictionary(m => NormalizeString(m.Nombre), m => m.Id, StringComparer.OrdinalIgnoreCase);

        var ubicaciones = await _context.Ubicaciones.AsNoTracking().ToListAsync(cancellationToken);
        var ubicacionesDict = ubicaciones.ToDictionary(u => NormalizeString(u.Nombre), u => u.Id, StringComparer.OrdinalIgnoreCase);

        if (autoCrear)
        {
            await AutoCrearCatalogosFaltantesAsync(categoriasNombres, marcasNombres, ubicacionesNombres, categoriasDict, marcasDict, ubicacionesDict, cancellationToken);
        }

        ValidarContraBase(filas, codigosExistentes, seriesExistentes, categoriasDict, marcasDict, ubicacionesDict, errores);

        if (errores.Count > 0)
        {
            if (importacionParcial)
            {
                var filasInvalidas = errores.Select(e => e.Fila).ToHashSet();
                filas.RemoveAll(f => filasInvalidas.Contains(f.Fila));

                if (filas.Count == 0)
                {
                    return new ImportacionEquiposResponseDto { Success = false, Errores = errores };
                }
            }
            else
            {
                return new ImportacionEquiposResponseDto { Success = false, Errores = errores };
            }
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var lote = new LoteImportacion
            {
                Id = Guid.NewGuid(),
                UsuarioId = usuarioId,
                NombreArchivo = Path.GetFileName(archivo.FileName),
                TotalRegistros = filas.Count,
                FechaImportacion = DateTime.UtcNow
            };

            var equipos = filas.Select(fila => new Equipo
            {
                Id = Guid.NewGuid(),
                CodigoInventario = fila.CodigoInventario,
                NumeroSerie = fila.NumeroSerie,
                NombreModelo = fila.NombreModelo,
                CategoriaId = categoriasDict[NormalizeString(fila.Categoria)],
                MarcaId = marcasDict[NormalizeString(fila.Marca)],
                UbicacionId = ubicacionesDict[NormalizeString(fila.Ubicacion)],
                Estado = NormalizarEstado(fila.Estado),
                ResponsableId = usuarioId,
                EspecificacionesTecnicas = "{}",
                FechaRegistro = DateTime.UtcNow,
                LoteImportacionId = lote.Id
            }).ToList();

            _context.LotesImportacion.Add(lote);
            _context.Equipos.AddRange(equipos);
            await _context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return new ImportacionEquiposResponseDto
            {
                Success = true,
                LoteImportacionId = lote.Id,
                TotalImportados = equipos.Count,
                Errores = errores
            };
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<ResumenValidacionDto> ValidarImportacionAsync(
        IFormFile archivo,
        CancellationToken cancellationToken = default)
    {
        ExcelPackage.License.SetNonCommercialPersonal("FISEI");
        var resumen = new ResumenValidacionDto { Success = true };

        if (archivo is null || archivo.Length == 0)
        {
            resumen.Success = false;
            resumen.Mensaje = "El archivo esta vacio.";
            return resumen;
        }

        if (!Path.GetExtension(archivo.FileName).Equals(".xlsx", StringComparison.OrdinalIgnoreCase))
        {
            resumen.Success = false;
            resumen.Mensaje = "Solo se permiten archivos .xlsx.";
            return resumen;
        }

        await using var stream = archivo.OpenReadStream();
        using var package = new ExcelPackage(stream);
        var worksheet = package.Workbook.Worksheets.FirstOrDefault();

        if (worksheet?.Dimension is null)
        {
            resumen.Success = false;
            resumen.Mensaje = "El archivo no contiene filas.";
            return resumen;
        }

        var errores = new List<ErrorImportacionDto>();
        var mapaColumnas = MapearColumnas(worksheet, errores);
        
        if (errores.Count > 0)
        {
            resumen.Success = false;
            resumen.Errores = errores;
            return resumen;
        }

        var filas = LeerFilas(worksheet, mapaColumnas);
        if (filas.Count == 0)
        {
            resumen.Success = false;
            resumen.Mensaje = "La plantilla no contiene registros.";
            return resumen;
        }

        resumen.Previsualizacion = filas.Select(f => new FilaPreviewDto
        {
            Fila = f.Fila,
            CodigoInventario = f.CodigoInventario,
            NumeroSerie = f.NumeroSerie,
            NombreModelo = f.NombreModelo,
            Categoria = f.Categoria,
            Marca = f.Marca,
            Ubicacion = f.Ubicacion,
            Estado = f.Estado
        }).ToList();

        ValidarCamposObligatoriosYEstados(filas, errores);
        ValidarDuplicadosEnArchivo(filas, errores);

        var codigos = filas.Select(f => f.CodigoInventario).Where(v => !string.IsNullOrWhiteSpace(v)).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var series = filas.Select(f => f.NumeroSerie).Where(v => !string.IsNullOrWhiteSpace(v)).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var categoriasNombres = filas.Select(f => f.Categoria).Where(v => !string.IsNullOrWhiteSpace(v)).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var marcasNombres = filas.Select(f => f.Marca).Where(v => !string.IsNullOrWhiteSpace(v)).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var ubicacionesNombres = filas.Select(f => f.Ubicacion).Where(v => !string.IsNullOrWhiteSpace(v)).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var codigosExistentes = await _context.Equipos.AsNoTracking().Where(e => codigos.Contains(e.CodigoInventario)).Select(e => e.CodigoInventario).ToListAsync(cancellationToken);
        var seriesExistentes = await _context.Equipos.AsNoTracking().Where(e => series.Contains(e.NumeroSerie)).Select(e => e.NumeroSerie).ToListAsync(cancellationToken);
        
        var categoriasDBList = await _context.Categorias.AsNoTracking().ToListAsync(cancellationToken);
        var categoriasDB = categoriasDBList.ToDictionary(c => NormalizeString(c.Nombre), c => c.Id, StringComparer.OrdinalIgnoreCase);

        var marcasDBList = await _context.Marcas.AsNoTracking().ToListAsync(cancellationToken);
        var marcasDB = marcasDBList.ToDictionary(m => NormalizeString(m.Nombre), m => m.Id, StringComparer.OrdinalIgnoreCase);

        var ubicacionesDBList = await _context.Ubicaciones.AsNoTracking().ToListAsync(cancellationToken);
        var ubicacionesDB = ubicacionesDBList.ToDictionary(u => NormalizeString(u.Nombre), u => u.Id, StringComparer.OrdinalIgnoreCase);

        ValidarContraBase(filas, codigosExistentes, seriesExistentes, categoriasDB, marcasDB, ubicacionesDB, errores);

        resumen.CategoriasFaltantes = categoriasNombres.Where(c => !categoriasDB.ContainsKey(NormalizeString(c))).ToList();
        resumen.MarcasFaltantes = marcasNombres.Where(m => !marcasDB.ContainsKey(NormalizeString(m))).ToList();
        resumen.UbicacionesFaltantes = ubicacionesNombres.Where(u => !ubicacionesDB.ContainsKey(NormalizeString(u))).ToList();
        
        var filasInvalidas = errores.Select(e => e.Fila).ToHashSet();
        
        resumen.TotalFilas = filas.Count;
        resumen.TotalFilasConErrores = filasInvalidas.Count;
        resumen.TotalFilasValidas = filas.Count - filasInvalidas.Count;
        resumen.Errores = errores;

        return resumen;
    }

    private async Task AutoCrearCatalogosFaltantesAsync(
        HashSet<string> categoriasNombres,
        HashSet<string> marcasNombres,
        HashSet<string> ubicacionesNombres,
        Dictionary<string, int> categorias,
        Dictionary<string, int> marcas,
        Dictionary<string, int> ubicaciones,
        CancellationToken cancellationToken)
    {
        var nuevasCategorias = categoriasNombres.Where(n => !categorias.ContainsKey(NormalizeString(n))).ToList();
        var nuevasMarcas = marcasNombres.Where(n => !marcas.ContainsKey(NormalizeString(n))).ToList();
        var nuevasUbicaciones = ubicacionesNombres.Where(n => !ubicaciones.ContainsKey(NormalizeString(n))).ToList();

        bool hasChanges = false;

        foreach (var c in nuevasCategorias)
        {
            var entity = new Categoria { Nombre = c };
            _context.Categorias.Add(entity);
            hasChanges = true;
        }

        foreach (var m in nuevasMarcas)
        {
            var entity = new Marca { Nombre = m };
            _context.Marcas.Add(entity);
            hasChanges = true;
        }

        foreach (var u in nuevasUbicaciones)
        {
            var entity = new Ubicacion { Nombre = u };
            _context.Ubicaciones.Add(entity);
            hasChanges = true;
        }

        if (hasChanges)
        {
            await _context.SaveChangesAsync(cancellationToken);

            // Assign the new IDs to the dictionaries
            foreach (var c in nuevasCategorias)
            {
                var id = await _context.Categorias.Where(x => x.Nombre == c).Select(x => x.Id).FirstAsync(cancellationToken);
                categorias[NormalizeString(c)] = id;
            }

            foreach (var m in nuevasMarcas)
            {
                var id = await _context.Marcas.Where(x => x.Nombre == m).Select(x => x.Id).FirstAsync(cancellationToken);
                marcas[NormalizeString(m)] = id;
            }

            foreach (var u in nuevasUbicaciones)
            {
                var id = await _context.Ubicaciones.Where(x => x.Nombre == u).Select(x => x.Id).FirstAsync(cancellationToken);
                ubicaciones[NormalizeString(u)] = id;
            }
        }
    }

    private static string NormalizeString(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;
        
        // Remove extra spaces and make it normalized
        var normalized = System.Text.RegularExpressions.Regex.Replace(input.Trim(), @"\s+", " ");
        
        // Remove diacritics (accents)
        var tempBytes = System.Text.Encoding.GetEncoding("ISO-8859-8").GetBytes(normalized);
        return System.Text.Encoding.UTF8.GetString(tempBytes);
    }

    private static Dictionary<string, int> MapearColumnas(ExcelWorksheet worksheet, List<ErrorImportacionDto> errores)
    {
        var mapa = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var columnasEncontradas = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        int maxCol = worksheet.Dimension.End.Column;

        for (int col = 1; col <= maxCol; col++)
        {
            var header = worksheet.Cells[1, col].Text.Trim();
            if (!string.IsNullOrWhiteSpace(header))
            {
                mapa[header] = col;
                columnasEncontradas.Add(header);
            }
        }

        foreach (var colEsperada in Columnas)
        {
            if (!columnasEncontradas.Contains(colEsperada))
            {
                errores.Add(new ErrorImportacionDto
                {
                    Fila = 1,
                    Campo = "Archivo",
                    Mensaje = $"Falta la columna requerida: {colEsperada}."
                });
            }
        }

        return mapa;
    }

    private static List<FilaEquipoImportacion> LeerFilas(ExcelWorksheet worksheet, Dictionary<string, int> mapa)
    {
        var filas = new List<FilaEquipoImportacion>();
        var ultimaFila = worksheet.Dimension.End.Row;

        for (var row = 2; row <= ultimaFila; row++)
        {
            bool hasData = false;
            foreach (var col in mapa.Values)
            {
                 if (!string.IsNullOrWhiteSpace(worksheet.Cells[row, col].Text)) { hasData = true; break; }
            }
            
            if (!hasData)
            {
                continue;
            }

            filas.Add(new FilaEquipoImportacion
            {
                Fila = row,
                CodigoInventario = mapa.ContainsKey("CodigoInventario") ? worksheet.Cells[row, mapa["CodigoInventario"]].Text.Trim() : string.Empty,
                NumeroSerie = mapa.ContainsKey("NumeroSerie") ? worksheet.Cells[row, mapa["NumeroSerie"]].Text.Trim() : string.Empty,
                NombreModelo = mapa.ContainsKey("NombreModelo") ? worksheet.Cells[row, mapa["NombreModelo"]].Text.Trim() : string.Empty,
                Categoria = mapa.ContainsKey("Categoria") ? worksheet.Cells[row, mapa["Categoria"]].Text.Trim() : string.Empty,
                Marca = mapa.ContainsKey("Marca") ? worksheet.Cells[row, mapa["Marca"]].Text.Trim() : string.Empty,
                Ubicacion = mapa.ContainsKey("Ubicacion") ? worksheet.Cells[row, mapa["Ubicacion"]].Text.Trim() : string.Empty,
                Estado = mapa.ContainsKey("Estado") ? worksheet.Cells[row, mapa["Estado"]].Text.Trim() : string.Empty
            });
        }

        return filas;
    }

    private static void ValidarCamposObligatoriosYEstados(List<FilaEquipoImportacion> filas, List<ErrorImportacionDto> errores)
    {
        foreach (var fila in filas)
        {
            AgregarErrorSiVacio(fila.Fila, "CodigoInventario", fila.CodigoInventario, errores);
            AgregarErrorSiVacio(fila.Fila, "NumeroSerie", fila.NumeroSerie, errores);
            AgregarErrorSiVacio(fila.Fila, "NombreModelo", fila.NombreModelo, errores);
            AgregarErrorSiVacio(fila.Fila, "Categoria", fila.Categoria, errores);
            AgregarErrorSiVacio(fila.Fila, "Marca", fila.Marca, errores);
            AgregarErrorSiVacio(fila.Fila, "Ubicacion", fila.Ubicacion, errores);
            AgregarErrorSiVacio(fila.Fila, "Estado", fila.Estado, errores);

            if (!string.IsNullOrWhiteSpace(fila.Estado) && !EstadosPermitidos.Contains(fila.Estado))
            {
                errores.Add(new ErrorImportacionDto
                {
                    Fila = fila.Fila,
                    Campo = "Estado",
                    Mensaje = "Estado no permitido. Use Operativo, Mantenimiento o Dado de baja."
                });
            }
        }
    }

    private static void ValidarDuplicadosEnArchivo(List<FilaEquipoImportacion> filas, List<ErrorImportacionDto> errores)
    {
        AgregarDuplicados(filas, f => f.CodigoInventario, "CodigoInventario", errores);
        AgregarDuplicados(filas, f => f.NumeroSerie, "NumeroSerie", errores);
    }

    private static void ValidarContraBase(
        List<FilaEquipoImportacion> filas,
        List<string> codigosExistentes,
        List<string> seriesExistentes,
        Dictionary<string, int> categorias,
        Dictionary<string, int> marcas,
        Dictionary<string, int> ubicaciones,
        List<ErrorImportacionDto> errores)
    {
        var codigosSet = codigosExistentes.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var seriesSet = seriesExistentes.ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var fila in filas)
        {
            if (codigosSet.Contains(fila.CodigoInventario))
            {
                errores.Add(new ErrorImportacionDto
                {
                    Fila = fila.Fila,
                    Campo = "CodigoInventario",
                    Mensaje = "Ya existe un equipo con este codigo de inventario."
                });
            }

            if (seriesSet.Contains(fila.NumeroSerie))
            {
                errores.Add(new ErrorImportacionDto
                {
                    Fila = fila.Fila,
                    Campo = "NumeroSerie",
                    Mensaje = "Ya existe un equipo con este numero de serie."
                });
            }

            if (!string.IsNullOrWhiteSpace(fila.Categoria) && !categorias.ContainsKey(NormalizeString(fila.Categoria)))
            {
                errores.Add(new ErrorImportacionDto { Fila = fila.Fila, Campo = "Categoria", Mensaje = "La categoria no existe." });
            }

            if (!string.IsNullOrWhiteSpace(fila.Marca) && !marcas.ContainsKey(NormalizeString(fila.Marca)))
            {
                errores.Add(new ErrorImportacionDto { Fila = fila.Fila, Campo = "Marca", Mensaje = "La marca no existe." });
            }

            if (!string.IsNullOrWhiteSpace(fila.Ubicacion) && !ubicaciones.ContainsKey(NormalizeString(fila.Ubicacion)))
            {
                errores.Add(new ErrorImportacionDto { Fila = fila.Fila, Campo = "Ubicacion", Mensaje = "La ubicacion no existe." });
            }
        }
    }

    private static void AgregarErrorSiVacio(int fila, string campo, string valor, List<ErrorImportacionDto> errores)
    {
        if (!string.IsNullOrWhiteSpace(valor))
        {
            return;
        }

        errores.Add(new ErrorImportacionDto
        {
            Fila = fila,
            Campo = campo,
            Mensaje = "Campo obligatorio."
        });
    }

    private static void AgregarDuplicados(
        List<FilaEquipoImportacion> filas,
        Func<FilaEquipoImportacion, string> selector,
        string campo,
        List<ErrorImportacionDto> errores)
    {
        var duplicados = filas
            .Where(f => !string.IsNullOrWhiteSpace(selector(f)))
            .GroupBy(selector, StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() > 1)
            .SelectMany(g => g)
            .ToList();

        foreach (var duplicado in duplicados)
        {
            errores.Add(new ErrorImportacionDto
            {
                Fila = duplicado.Fila,
                Campo = campo,
                Mensaje = "Valor duplicado dentro del archivo."
            });
        }
    }

    private static string NormalizarEstado(string estado)
    {
        return EstadosPermitidos.First(e => e.Equals(estado, StringComparison.OrdinalIgnoreCase));
    }

    private sealed class FilaEquipoImportacion
    {
        public int Fila { get; init; }
        public string CodigoInventario { get; init; } = string.Empty;
        public string NumeroSerie { get; init; } = string.Empty;
        public string NombreModelo { get; init; } = string.Empty;
        public string Categoria { get; init; } = string.Empty;
        public string Marca { get; init; } = string.Empty;
        public string Ubicacion { get; init; } = string.Empty;
        public string Estado { get; init; } = string.Empty;
    }
}
