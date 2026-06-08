using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using FISEI.Auth.API.Data;
using FISEI.Auth.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FISEI.Auth.API.Controllers;

[ApiController]
[Route("api/auth/microsoft")]
public class AuthMicrosoftController : ControllerBase
{
    private const string BackendLoginUrl = "http://localhost:5260/api/auth/microsoft/login";
    private const string BackendCallbackUrl = "http://localhost:5260/api/auth/microsoft/callback";
    private const string FrontendCallbackUrl = "http://localhost:5173/auth/callback";

    private readonly ApplicationDbContext _context;
    private readonly JwtService _jwtService;
    private readonly IConfiguration _configuration;

    public AuthMicrosoftController(
        ApplicationDbContext context,
        JwtService jwtService,
        IConfiguration configuration)
    {
        _context = context;
        _jwtService = jwtService;
        _configuration = configuration;
    }

    [HttpGet("login")]
    [AllowAnonymous]
    public IActionResult Login([FromQuery] string? prompt = null)
    {
        var config = _configuration.GetSection("AzureAd");
        var clientId = config["ClientId"]!;
        var tenantId = config["TenantId"]!;
        var instance = config["Instance"]!;

        var state = Guid.NewGuid().ToString();
        var nonce = Guid.NewGuid().ToString();

        _ = BackendLoginUrl;

        var authUrl = $"{instance}{tenantId}/oauth2/v2.0/authorize?" +
            $"client_id={Uri.EscapeDataString(clientId)}" +
            $"&redirect_uri={Uri.EscapeDataString(BackendCallbackUrl)}" +
            $"&response_type=id_token" +
            $"&response_mode=form_post" +
            $"&scope=openid%20profile%20email" +
            $"&state={Uri.EscapeDataString(state)}" +
            $"&nonce={Uri.EscapeDataString(nonce)}";

        if (string.Equals(prompt, "login", StringComparison.OrdinalIgnoreCase))
        {
            authUrl += "&prompt=login";
        }

        return Redirect(authUrl);
    }

    [HttpPost("callback")]
    [AllowAnonymous]
    public async Task<IActionResult> Callback()
    {
        var form = await Request.ReadFormAsync();
        var idToken = form["id_token"].FirstOrDefault();

        if (string.IsNullOrEmpty(idToken))
        {
            return RedirectWithError("No se recibio la respuesta de Microsoft. Intenta iniciar sesion nuevamente.");
        }

        try
        {
            var handler = new JwtSecurityTokenHandler();
            var jwtToken = handler.ReadJwtToken(idToken);

            var email = jwtToken.Claims.FirstOrDefault(c => c.Type == "preferred_username")?.Value
                     ?? jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Email)?.Value
                     ?? jwtToken.Claims.FirstOrDefault(c => c.Type == "email")?.Value;

            if (string.IsNullOrWhiteSpace(email))
            {
                return RedirectWithError("No se pudo obtener el correo de tu cuenta Microsoft.");
            }

            var normalizedEmail = email.Trim().ToLowerInvariant();
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.Correo.ToLower() == normalizedEmail);

            if (usuario == null || !usuario.Activo)
            {
                return RedirectWithError("Usuario no autorizado. Comuniquese con el administrador para habilitar su acceso.");
            }

            var token = _jwtService.GenerateToken(usuario);
            var redirectUrl = $"{FrontendCallbackUrl}?token={Uri.EscapeDataString(token)}";

            return Redirect(redirectUrl);
        }
        catch (Exception ex)
        {
            return RedirectWithError($"Error procesando la autenticacion de Microsoft: {ex.Message}");
        }
    }

    private IActionResult RedirectWithError(string message)
    {
        var redirectUrl = $"{FrontendCallbackUrl}?error=unauthorized&message={Uri.EscapeDataString(message)}";
        return Redirect(redirectUrl);
    }
}
