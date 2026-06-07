using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace FISEI.Mantenimientos.API.Models;

public partial class MantenimientosDbContext : DbContext
{
    public MantenimientosDbContext()
    {
    }

    public MantenimientosDbContext(DbContextOptions<MantenimientosDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AccionesPredefinida> AccionesPredefinidas { get; set; }

    public virtual DbSet<CasosMantenimiento> CasosMantenimientos { get; set; }

    public virtual DbSet<DetallesMantenimiento> DetallesMantenimientos { get; set; }

    public virtual DbSet<DiagnosticosPredefinido> DiagnosticosPredefinidos { get; set; }

    public virtual DbSet<MantenimientoRecurso> MantenimientoRecursos { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AccionesPredefinida>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__acciones__3213E83FC903DD8F");

            entity.ToTable("acciones_predefinidas");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CategoriaEquipo)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("categoria_equipo");
            entity.Property(e => e.Nombre)
                .HasMaxLength(150)
                .IsUnicode(false)
                .HasColumnName("nombre");
        });

        modelBuilder.Entity<CasosMantenimiento>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__casos_ma__3213E83F10D30AB0");

            entity.ToTable("casos_mantenimiento");

            entity.HasIndex(e => e.CodigoCaso, "UQ__casos_ma__7E26BAC7A05542A1").IsUnique();

            entity.Property(e => e.Id)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("id");
            entity.Property(e => e.CodigoCaso)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("codigo_caso");
            entity.Property(e => e.CreadoPorUsuarioId).HasColumnName("creado_por_usuario_id");
            entity.Property(e => e.DescripcionGeneral).HasColumnName("descripcion_general");
            entity.Property(e => e.FechaIngreso)
                .HasColumnType("datetime")
                .HasColumnName("fecha_ingreso");
            entity.Property(e => e.FechaRegistro)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("fecha_registro");
            entity.Property(e => e.TipoMantenimiento)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("Preventivo")
                .HasColumnName("tipo_mantenimiento");
            entity.Property(e => e.EstadoGeneral)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("Abierto")
                .HasColumnName("estado_general");
            entity.Property(e => e.FechaCierre)
                .HasColumnType("datetime")
                .HasColumnName("fecha_cierre");
        });

        modelBuilder.Entity<DetallesMantenimiento>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__detalles__3213E83F91CD99F3");

            entity.ToTable("detalles_mantenimiento");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("id");
            entity.Property(e => e.CasoId).HasColumnName("caso_id");
            entity.Property(e => e.DescripcionDetalladaMantenimiento).HasColumnName("descripcion_detallada_mantenimiento");
            entity.Property(e => e.DiagnosticoPredefinidoId).HasColumnName("diagnostico_predefinido_id");
            entity.Property(e => e.EquipoId).HasColumnName("equipo_id");
            entity.Property(e => e.EstadoIndividual)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasDefaultValue("Pendiente")
                .HasColumnName("estado_individual");
            entity.Property(e => e.FechaFin)
                .HasColumnType("datetime")
                .HasColumnName("fecha_fin");
            entity.Property(e => e.FechaInicio)
                .HasColumnType("datetime")
                .HasColumnName("fecha_inicio");
            entity.Property(e => e.LaboratoristaAsignadoId).HasColumnName("laboratorista_asignado_id");

            entity.HasOne(d => d.Caso).WithMany(p => p.DetallesMantenimientos)
                .HasForeignKey(d => d.CasoId)
                .HasConstraintName("FK_Detalles_Casos");

            entity.HasOne(d => d.DiagnosticoPredefinido).WithMany(p => p.DetallesMantenimientos)
                .HasForeignKey(d => d.DiagnosticoPredefinidoId)
                .HasConstraintName("FK_Detalles_Diagnosticos");

            entity.HasMany(d => d.AccionPredefinida).WithMany(p => p.DetalleMantenimientos)
                .UsingEntity<Dictionary<string, object>>(
                    "MantenimientoAccione",
                    r => r.HasOne<AccionesPredefinida>().WithMany()
                        .HasForeignKey("AccionPredefinidaId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK_MaintAcc_Accion"),
                    l => l.HasOne<DetallesMantenimiento>().WithMany()
                        .HasForeignKey("DetalleMantenimientoId")
                        .HasConstraintName("FK_MaintAcc_Detalle"),
                    j =>
                    {
                        j.HasKey("DetalleMantenimientoId", "AccionPredefinidaId").HasName("PK__mantenim__29DCA70E0B73664F");
                        j.ToTable("mantenimiento_acciones");
                        j.IndexerProperty<Guid>("DetalleMantenimientoId").HasColumnName("detalle_mantenimiento_id");
                        j.IndexerProperty<int>("AccionPredefinidaId").HasColumnName("accion_predefinida_id");
                    });
        });

        modelBuilder.Entity<DiagnosticosPredefinido>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__diagnost__3213E83F3D753028");

            entity.ToTable("diagnosticos_predefinidos");

            entity.HasIndex(e => e.Codigo, "UQ__diagnost__40F9A2060B731EC0").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CategoriaEquipo)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("categoria_equipo");
            entity.Property(e => e.Codigo)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("codigo");
            entity.Property(e => e.Descripcion)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("descripcion");
        });

        modelBuilder.Entity<MantenimientoRecurso>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__mantenim__3213E83FC3191FE2");

            entity.ToTable("mantenimiento_recursos");

            entity.Property(e => e.Id)
                .HasDefaultValueSql("(newid())")
                .HasColumnName("id");
            entity.Property(e => e.CantidadUtilizada)
                .HasDefaultValue(1)
                .HasColumnName("cantidad_utilizada");
            entity.Property(e => e.DetalleMantenimientoId).HasColumnName("detalle_mantenimiento_id");
            entity.Property(e => e.RecursoSubcategoriaId).HasColumnName("recurso_subcategoria_id");
            entity.Property(e => e.RepuestoAlmacenId).HasColumnName("repuesto_almacen_id");
            entity.Property(e => e.TipoRecursoPrincipal)
                .HasMaxLength(30)
                .IsUnicode(false)
                .HasColumnName("tipo_recurso_principal");

            entity.HasOne(d => d.DetalleMantenimiento).WithMany(p => p.MantenimientoRecursos)
                .HasForeignKey(d => d.DetalleMantenimientoId)
                .HasConstraintName("FK_MaintRec_Detalle");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
