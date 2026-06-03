using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FISEI.Auth.API.Models;
using Microsoft.IdentityModel.Tokens;

namespace FISEI.Auth.API.Services;

public class JwtService
{
    private readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(Usuario user)
    {
        var jwtKey = _configuration["Jwt:Key"]!;
        var jwtIssuer = _configuration["Jwt:Issuer"]!;
        var jwtAudience = _configuration["Jwt:Audience"]!;

        var key = Encoding.UTF8.GetBytes(jwtKey);
        var handler = new JwtSecurityTokenHandler();
        var roleValue = user.Rol switch
        {
            "ADMIN" => "Administrador",
            "LABORATORISTA" => "Laboratorista",
            _ => user.Rol
        };

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Correo),
            new Claim(ClaimTypes.Role, roleValue),
            new Claim("fullName", $"{user.Nombre} {user.Apellido}")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(int.Parse(_configuration["Jwt:ExpiresInMinutes"] ?? "480")),
            Issuer = jwtIssuer,
            Audience = jwtAudience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = handler.CreateToken(tokenDescriptor);
        return handler.WriteToken(token);
    }
}
