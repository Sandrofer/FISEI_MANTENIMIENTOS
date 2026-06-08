using Inventory.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Inventory.API.Data;

public class InventoryDbContext : DbContext
{
    public InventoryDbContext(DbContextOptions<InventoryDbContext> options)
        : base(options) { }

    public DbSet<Equipo> Equipos => Set<Equipo>();
    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Marca> Marcas => Set<Marca>();
    public DbSet<Ubicacion> Ubicaciones => Set<Ubicacion>();
    public DbSet<LoteImportacion> LotesImportacion => Set<LoteImportacion>();
    public DbSet<RecursoSubcategoria> RecursoSubcategorias => Set<RecursoSubcategoria>();
    public DbSet<RepuestoAlmacen> RepuestosAlmacen => Set<RepuestoAlmacen>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.ToTable("categorias");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id).HasColumnName("id");
            entity.Property(c => c.Nombre).HasColumnName("nombre").HasMaxLength(50).IsRequired();
            entity.HasIndex(c => c.Nombre).IsUnique();
        });

        modelBuilder.Entity<Marca>(entity =>
        {
            entity.ToTable("marcas");
            entity.HasKey(m => m.Id);
            entity.Property(m => m.Id).HasColumnName("id");
            entity.Property(m => m.Nombre).HasColumnName("nombre").HasMaxLength(50).IsRequired();
            entity.HasIndex(m => m.Nombre).IsUnique();
        });

        modelBuilder.Entity<Ubicacion>(entity =>
        {
            entity.ToTable("ubicaciones");
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Id).HasColumnName("id");
            entity.Property(u => u.Nombre).HasColumnName("nombre").HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<LoteImportacion>(entity =>
        {
            entity.ToTable("lotes_importacion");
            entity.HasKey(l => l.Id);
            entity.Property(l => l.Id).HasColumnName("id");
            entity.Property(l => l.UsuarioId).HasColumnName("usuario_id").IsRequired();
            entity.Property(l => l.NombreArchivo).HasColumnName("nombre_archivo").HasMaxLength(255).IsRequired();
            entity.Property(l => l.TotalRegistros).HasColumnName("total_registros").IsRequired();
            entity.Property(l => l.FechaImportacion).HasColumnName("fecha_importacion").IsRequired();
        });

        modelBuilder.Entity<Equipo>(entity =>
        {
            entity.ToTable("equipos");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CodigoInventario).HasColumnName("codigo_inventario").HasMaxLength(50).IsRequired();
            entity.Property(e => e.NumeroSerie).HasColumnName("numero_serie").HasMaxLength(100).IsRequired();
            entity.Property(e => e.NombreModelo).HasColumnName("nombre_modelo").HasMaxLength(100).IsRequired();
            entity.Property(e => e.CategoriaId).HasColumnName("categoria_id").IsRequired();
            entity.Property(e => e.MarcaId).HasColumnName("marca_id").IsRequired();
            entity.Property(e => e.UbicacionId).HasColumnName("ubicacion_id").IsRequired();
            entity.Property(e => e.Estado).HasColumnName("estado").HasMaxLength(30).IsRequired();
            entity.Property(e => e.ResponsableId).HasColumnName("responsable_id");
            entity.Property(e => e.EspecificacionesTecnicas).HasColumnName("especificaciones_tecnicas").IsRequired();
            entity.Property(e => e.FechaRegistro).HasColumnName("fecha_registro").IsRequired();
            entity.Property(e => e.LoteImportacionId).HasColumnName("lote_importacion_id");

            entity.HasIndex(e => e.CodigoInventario).IsUnique();
            entity.HasIndex(e => e.NumeroSerie).IsUnique();

            entity.HasOne(e => e.Categoria)
                .WithMany(c => c.Equipos)
                .HasForeignKey(e => e.CategoriaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Marca)
                .WithMany(m => m.Equipos)
                .HasForeignKey(e => e.MarcaId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Ubicacion)
                .WithMany(u => u.Equipos)
                .HasForeignKey(e => e.UbicacionId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.LoteImportacion)
                .WithMany(l => l.Equipos)
                .HasForeignKey(e => e.LoteImportacionId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<RecursoSubcategoria>(entity =>
        {
            entity.ToTable("recursos_subcategorias");
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Id).HasColumnName("id");
            entity.Property(r => r.TipoPrincipal).HasColumnName("tipo_principal").HasMaxLength(50).IsRequired();
            entity.Property(r => r.NombreSubcategoria).HasColumnName("nombre_subcategoria").HasMaxLength(100).IsRequired();
        });

        modelBuilder.Entity<RepuestoAlmacen>(entity =>
        {
            entity.ToTable("repuestos_almacen");
            entity.HasKey(r => r.Id);
            entity.Property(r => r.Id).HasColumnName("id");
            entity.Property(r => r.RecursoSubcategoriaId).HasColumnName("recurso_subcategoria_id").IsRequired();
            entity.Property(r => r.NombreEspecifico).HasColumnName("nombre_especifico").HasMaxLength(150).IsRequired();
            entity.Property(r => r.StockActual).HasColumnName("stock_actual").IsRequired();
            entity.Property(r => r.StockMinimo).HasColumnName("stock_minimo").IsRequired();

            entity.HasOne(r => r.RecursoSubcategoria)
                .WithMany()
                .HasForeignKey(r => r.RecursoSubcategoriaId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
