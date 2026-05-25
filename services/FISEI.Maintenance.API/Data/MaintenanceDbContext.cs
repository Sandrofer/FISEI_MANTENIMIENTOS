using FISEI.Maintenance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FISEI.Maintenance.API.Data;

public class MaintenanceDbContext : DbContext
{
    public MaintenanceDbContext(DbContextOptions<MaintenanceDbContext> options) : base(options)
    {
    }

    public DbSet<Mantenimiento> Mantenimientos { get; set; }
    public DbSet<Equipo> Equipos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Equipo>(entity =>
        {
            entity.HasKey(e => e.Id);
            // Configurar para no alterar campos existentes de equipo y usar los nombres correctos
            entity.Property(e => e.NumeroSerie).HasMaxLength(100);
            entity.Property(e => e.Marca).HasMaxLength(100);
            entity.Property(e => e.Modelo).HasMaxLength(100);
            entity.Property(e => e.Procesador).HasMaxLength(100);
            entity.Property(e => e.Laboratorio).HasMaxLength(100);
            entity.Property(e => e.Estado).HasMaxLength(50);
        });

        modelBuilder.Entity<Mantenimiento>(entity =>
        {
            entity.HasKey(m => m.Id);
            
            entity.HasOne(m => m.Equipo)
                  .WithMany(e => e.Mantenimientos)
                  .HasForeignKey(m => m.EquipoId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(m => m.Estado).HasMaxLength(50);
            entity.Property(m => m.Tipo).HasMaxLength(50);
            entity.Property(m => m.Prioridad).HasMaxLength(50);
            entity.Property(m => m.Responsable).HasMaxLength(150);
            entity.Property(m => m.Observaciones).HasMaxLength(1000);
            entity.Property(m => m.Diagnostico).HasMaxLength(1000);
            entity.Property(m => m.AccionesRealizadas).HasMaxLength(1000);
        });
    }
}
