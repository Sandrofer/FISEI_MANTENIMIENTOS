using FISEI.Auth.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FISEI.Auth.API.Data
{
    public class AuthDbContext : DbContext
    {
        public AuthDbContext(DbContextOptions<AuthDbContext> options) : base(options)
        {
        }

        public DbSet<Usuario> Usuarios { get; set; }
    }
}
