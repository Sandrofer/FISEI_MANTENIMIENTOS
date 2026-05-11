using Inventory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Inventory.API.Data;

public class InventoryDbContext : DbContext
{
    public InventoryDbContext(DbContextOptions<InventoryDbContext> options) 
        : base(options) { }

    public DbSet<Equipo> Equipos { get; set; }
    public DbSet<Mantenimiento> Mantenimientos { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Equipo>(entity =>
        {
            entity.ToTable("Equipos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Marca).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Modelo).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Procesador).HasMaxLength(150).IsRequired();
            entity.Property(e => e.Laboratorio).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Estado).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<Mantenimiento>(entity =>
        {
            entity.ToTable("Mantenimientos");
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Estado).HasMaxLength(50).IsRequired();
            entity.Property(m => m.Observaciones).HasMaxLength(500);
            entity.HasOne(m => m.Equipo)
                  .WithMany(e => e.Mantenimientos)
                  .HasForeignKey(m => m.EquipoId);
        });
    }
}