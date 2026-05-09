using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace FISEI.Auth.API.Data;

public class AuthDbContextFactory : IDesignTimeDbContextFactory<AuthDbContext>
{
    public AuthDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AuthDbContext>();
        optionsBuilder.UseSqlServer("Server=FERDEX1\\SQLEXPRESS;Database=Usuarios;Trusted_Connection=True;TrustServerCertificate=True;");

        return new AuthDbContext(optionsBuilder.Options);
    }
}