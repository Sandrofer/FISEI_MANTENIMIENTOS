using FISEI.Auth.API.Data;
using FISEI.Auth.API.DTOs;
using FISEI.Auth.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FISEI.Auth.API.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize(Roles = "Administrador")]
public class UsuariosController : ControllerBase
{
    private readonly AuthDbContext _context;

    public UsuariosController(AuthDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsuarios([FromQuery] int pagina = 1, [FromQuery] int tamano = 10)
    {
        var total = await _context.Usuarios.CountAsync();
        var usuarios = await _context.Usuarios
            .Skip((pagina - 1) * tamano)
            .Take(tamano)
            .Select(u => new UsuarioDto
            {
                Id = u.Id,
                Nombre = u.Nombre,
                Apellido = u.Apellido,
                Correo = u.Correo,
                Rol = u.Rol,
                Activo = u.Activo
            })
            .ToListAsync();

        return Ok(new { total, pagina, tamano, datos = usuarios });
    }

    [HttpPost]
    public async Task<IActionResult> CrearUsuario([FromBody] CrearUsuarioDto dto)
    {
        if (await _context.Usuarios.AnyAsync(u => u.Correo == dto.Correo))
            return BadRequest(new { mensaje = "El correo ya está registrado" });

        var usuario = new Usuario
        {
            Nombre = dto.Nombre,
            Apellido = dto.Apellido,
            Correo = dto.Correo,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Rol = dto.Rol
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUsuarios), new { id = usuario.Id },
            new { mensaje = "Usuario creado exitosamente", id = usuario.Id });
    }

    [HttpPut("{id}/rol")]
    public async Task<IActionResult> ActualizarRol(int id, [FromBody] ActualizarRolDto dto)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null) return NotFound(new { mensaje = "Usuario no encontrado" });

        usuario.Rol = dto.Rol;
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Rol actualizado correctamente" });
    }
}