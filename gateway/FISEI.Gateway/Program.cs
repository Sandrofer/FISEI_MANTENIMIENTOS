using System.Net.Http.Headers;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [])
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddHttpClient("GatewayProxy", client =>
{
    client.Timeout = TimeSpan.FromSeconds(100);
});

var app = builder.Build();

app.UseCors("FrontendPolicy");

var routes = new Dictionary<string, Uri>(StringComparer.OrdinalIgnoreCase)
{
    ["api/auth/microsoft"] = new(builder.Configuration["Services:MicrosoftAuth"] ?? "http://localhost:5260"),
    ["api/auth"] = new(builder.Configuration["Services:Auth"] ?? "http://localhost:5260"),
    ["api/usuarios"] = new(builder.Configuration["Services:Auth"] ?? "http://localhost:5260"),
    ["api/inventario"] = new(builder.Configuration["Services:Inventory"] ?? "http://localhost:5064"),
    ["api/mantenimientos"] = new(builder.Configuration["Services:Maintenance"] ?? "http://localhost:5082")
};

app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "FISEI.Gateway" }));

app.Map("/{**path}", async (HttpContext context, IHttpClientFactory httpClientFactory) =>
{
    var path = context.Request.Path.Value?.TrimStart('/') ?? string.Empty;
    var route = routes
        .OrderByDescending(item => item.Key.Length)
        .FirstOrDefault(item => path.StartsWith(item.Key, StringComparison.OrdinalIgnoreCase));

    if (route.Value is null)
    {
        context.Response.StatusCode = StatusCodes.Status404NotFound;
        await context.Response.WriteAsJsonAsync(new { mensaje = "Ruta no configurada en el gateway" });
        return;
    }

    var targetUri = BuildTargetUri(route.Value, context.Request);
    using var requestMessage = CreateProxyRequest(context, targetUri);

    try
    {
        var httpClient = httpClientFactory.CreateClient("GatewayProxy");
        using var responseMessage = await httpClient.SendAsync(
            requestMessage,
            HttpCompletionOption.ResponseHeadersRead,
            context.RequestAborted);

        await CopyProxyResponse(context, responseMessage);
    }
    catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
    {
    }
    catch (HttpRequestException ex)
    {
        context.Response.StatusCode = StatusCodes.Status502BadGateway;
        await context.Response.WriteAsJsonAsync(new
        {
            mensaje = "No se pudo conectar con el microservicio destino",
            detalle = ex.Message
        });
    }
});

app.Run();

static Uri BuildTargetUri(Uri serviceBaseUri, HttpRequest request)
{
    var pathAndQuery = request.PathBase.Add(request.Path).ToUriComponent() + request.QueryString.ToUriComponent();
    return new Uri(serviceBaseUri, pathAndQuery);
}

static HttpRequestMessage CreateProxyRequest(HttpContext context, Uri targetUri)
{
    var request = context.Request;
    var requestMessage = new HttpRequestMessage
    {
        Method = new HttpMethod(request.Method),
        RequestUri = targetUri
    };

    if (!HttpMethods.IsGet(request.Method) &&
        !HttpMethods.IsHead(request.Method) &&
        !HttpMethods.IsDelete(request.Method) &&
        !HttpMethods.IsTrace(request.Method))
    {
        requestMessage.Content = new StreamContent(request.Body);
    }

    foreach (var header in request.Headers)
    {
        if (string.Equals(header.Key, "Host", StringComparison.OrdinalIgnoreCase))
        {
            continue;
        }

        if (!requestMessage.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray()))
        {
            requestMessage.Content?.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
        }
    }

    requestMessage.Headers.Host = targetUri.Authority;
    requestMessage.Headers.AcceptEncoding.Clear();

    return requestMessage;
}

static async Task CopyProxyResponse(HttpContext context, HttpResponseMessage responseMessage)
{
    context.Response.StatusCode = (int)responseMessage.StatusCode;

    foreach (var header in responseMessage.Headers)
    {
        context.Response.Headers[header.Key] = header.Value.ToArray();
    }

    foreach (var header in responseMessage.Content.Headers)
    {
        context.Response.Headers[header.Key] = header.Value.ToArray();
    }

    context.Response.Headers.Remove("transfer-encoding");

    await responseMessage.Content.CopyToAsync(context.Response.Body);
}
