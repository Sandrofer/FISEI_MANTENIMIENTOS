namespace FISEI.Mantenimientos.API.DTOs
{
    // ── Grafico 1: Mantenimientos por mes agrupados por tipo ──────────────────
    public class MantenimientosPorMesDto
    {
        public string Mes { get; set; } = string.Empty;
        public int Anio { get; set; }
        public int NumeroMes { get; set; }
        public int Preventivo { get; set; }
        public int Correctivo { get; set; }
        public int Adaptativo { get; set; }
    }

    // ── Grafico 2: Distribución porcentual de causas de falla ─────────────────
    public class CausaFallaDto
    {
        public string Causa { get; set; } = string.Empty;
        public int Cantidad { get; set; }
        public double Porcentaje { get; set; }
    }

    // ── Grafico 3: Top 5 equipos con más mantenimientos ───────────────────────
    public class TopEquipoDto
    {
        public string EquipoId { get; set; } = string.Empty;
        public int TotalMantenimientos { get; set; }
    }

    // ── Tarjetas de resumen ───────────────────────────────────────────────────
    public class TarjetasResumenDto
    {
        public int TotalMantenimientos { get; set; }
        public int TotalCompletados { get; set; }
        public int TotalPendientes { get; set; }
        public double PromedioDuracion { get; set; }
    }

    // ── Respuesta completa ────────────────────────────────────────────────────
    public class EstadisticasResponseDto
    {
        public List<MantenimientosPorMesDto> Grafico1 { get; set; } = new();
        public List<CausaFallaDto> Grafico2 { get; set; } = new();
        public List<TopEquipoDto> Grafico3 { get; set; } = new();
        public TarjetasResumenDto Tarjetas { get; set; } = new();
    }
}
