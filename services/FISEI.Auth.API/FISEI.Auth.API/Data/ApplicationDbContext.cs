using FISEI.Auth.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FISEI.Auth.API.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Usuario> Usuarios { get; set; } = null!;
}
