using FISEI.Notificaciones.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FISEI.Notificaciones.API.Data;

public class NotificacionesDbContext : DbContext
{
    public NotificacionesDbContext(DbContextOptions<NotificacionesDbContext> options)
        : base(options)
    {
    }

    public DbSet<Notificacion> Notificaciones => Set<Notificacion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Notificacion>(entity =>
        {
            entity.ToTable("notificaciones");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id)
                .HasColumnName("id")
                .HasDefaultValueSql("NEWID()")
                .ValueGeneratedOnAdd();

            entity.Property(e => e.UsuarioId).HasColumnName("usuario_id");
            entity.Property(e => e.CodigoCaso)
                .HasColumnName("codigo_caso")
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.EquipoId).HasColumnName("equipo_id");
            entity.Property(e => e.Mensaje).HasColumnName("mensaje");
            entity.Property(e => e.Tipo)
                .HasColumnName("tipo")
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.Leido)
                .HasColumnName("leido")
                .HasDefaultValue(false);
            entity.Property(e => e.FechaCreacion)
                .HasColumnName("fecha_creacion")
                .HasColumnType("datetime")
                .HasDefaultValueSql("GETDATE()");
            entity.Property(e => e.FechaLectura)
                .HasColumnName("fecha_lectura")
                .HasColumnType("datetime");
        });
    }
}
