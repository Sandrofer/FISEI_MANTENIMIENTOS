using System.Security.Claims;
using FISEI.Auth.API.Data;
using FISEI.Auth.API.DTOs;
using FISEI.Auth.API.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FISEI.Auth.API.Controllers;

[ApiController]
[Route("api/usuarios")]
public class UsuariosController : ControllerBase
{
    private const string DominioInstitucional = "@uta.edu.ec";
    private readonly AuthDbContext _context;

    public UsuariosController(AuthDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Administrador,Laboratorista")]
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
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> CrearUsuario([FromBody] CrearUsuarioDto dto)
    {
        var correoNormalizado = dto.Correo.Trim().ToLowerInvariant();

        if (!correoNormalizado.EndsWith(DominioInstitucional))
            return BadRequest(new { mensaje = "El correo debe ser institucional (@uta.edu.ec)" });

        if (await _context.Usuarios.AnyAsync(u => u.Correo.ToLower() == correoNormalizado))
            return BadRequest(new { mensaje = "El correo ya esta registrado" });

        var usuario = new Usuario
        {
            Nombre = dto.Nombre.Trim(),
            Apellido = dto.Apellido.Trim(),
            Correo = correoNormalizado,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Rol = dto.Rol
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUsuarios), new { id = usuario.Id },
            new { mensaje = "Usuario creado exitosamente", id = usuario.Id });
    }

    [HttpPut("{id}/rol")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ActualizarRol(int id, [FromBody] ActualizarRolDto dto)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null) return NotFound(new { mensaje = "Usuario no encontrado" });

        usuario.Rol = dto.Rol;
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Rol actualizado correctamente" });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrador")]
    public async Task<IActionResult> ActualizarUsuario(int id, [FromBody] ActualizarUsuarioDto dto)
    {
        var usuario = await _context.Usuarios.FindAsync(id);
        if (usuario == null) return NotFound(new { mensaje = "Usuario no encontrado" });

        var adminId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(adminId, out var adminIdNumerico))
            return Unauthorized(new { mensaje = "Sesion invalida" });

        var admin = await _context.Usuarios.FindAsync(adminIdNumerico);
        if (admin == null || !admin.Activo)
            return Unauthorized(new { mensaje = "Administrador no encontrado o inactivo" });

        if (string.IsNullOrWhiteSpace(dto.PasswordConfirmacion) ||
            !BCrypt.Net.BCrypt.Verify(dto.PasswordConfirmacion, admin.PasswordHash))
            return Unauthorized(new { mensaje = "La contrasena de confirmacion es incorrecta" });

        var correoNormalizado = dto.Correo.Trim().ToLowerInvariant();

        if (!correoNormalizado.EndsWith(DominioInstitucional))
            return BadRequest(new { mensaje = "El correo debe ser institucional (@uta.edu.ec)" });

        if (await _context.Usuarios.AnyAsync(u => u.Id != id && u.Correo.ToLower() == correoNormalizado))
            return BadRequest(new { mensaje = "El correo ya esta registrado" });

        usuario.Nombre = dto.Nombre.Trim();
        usuario.Apellido = dto.Apellido.Trim();
        usuario.Correo = correoNormalizado;
        usuario.Rol = dto.Rol;
        usuario.Activo = dto.Activo;

        _context.Usuarios.Update(usuario);
        await _context.SaveChangesAsync();

        return Ok(new { mensaje = "Usuario actualizado correctamente" });
    }
}
