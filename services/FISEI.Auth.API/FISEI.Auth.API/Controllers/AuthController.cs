using FISEI.Auth.API.Data;
using FISEI.Auth.API.DTOs;
using FISEI.Auth.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FISEI.Auth.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AuthDbContext _context;
    private readonly TokenService _tokenService;

    public AuthController(AuthDbContext context, TokenService tokenService)
    {
        _context = context;
        _tokenService = tokenService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var usuario = await _context.Usuarios
            .FirstOrDefaultAsync(u => u.Correo == dto.Correo);

        if (usuario == null)
            return Unauthorized(new { mensaje = "Credenciales incorrectas" });

        if (!usuario.Activo)
            return Unauthorized(new { mensaje = "Cuenta suspendida. Contacte al administrador." });

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash))
            return Unauthorized(new { mensaje = "Credenciales incorrectas" });

        var token = _tokenService.GenerarToken(usuario);

        return Ok(new LoginResponseDto
        {
            Token = token,
            Nombre = $"{usuario.Nombre} {usuario.Apellido}",
            Rol = usuario.Rol
        });
    }


}