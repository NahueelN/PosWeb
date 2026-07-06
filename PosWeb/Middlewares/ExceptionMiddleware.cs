using Microsoft.Extensions.Logging;
using PosWeb.Application.Exceptions;
using PosWeb.Domain.Exceptions;
using System.Net;

namespace PosWeb.Middlewares;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AuthException ex)
        {
            _logger.LogWarning("Auth exception occurred during {Phase}: {Message}",
                GetPhase(context), ex.Message);
            context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
            await context.Response.WriteAsJsonAsync(new
            {
                error = ex.Message
            });
        }
        catch (DomainException ex)
        {
            _logger.LogWarning("Domain exception occurred during {Phase}: {Message}", 
                GetPhase(context), ex.Message);
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            await context.Response.WriteAsJsonAsync(new
            {
                error = ex.Message
            });
        }
        catch (ServiceException ex)
        {
            _logger.LogWarning("Service exception occurred during {Phase}: {Message}", 
                GetPhase(context), ex.Message);
            context.Response.StatusCode = (int)HttpStatusCode.Conflict;
            await context.Response.WriteAsJsonAsync(new
            {
                error = ex.Message
            });
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Argument exception occurred during {Phase}: {Message}",
                GetPhase(context), ex.Message);
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            await context.Response.WriteAsJsonAsync(new
            {
                error = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception occurred during {Phase}", 
                GetPhase(context));
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            await context.Response.WriteAsJsonAsync(new
            {
                error = "Error interno del servidor"
            });
        }
    }

    private string GetPhase(HttpContext context)
    {
        // Simple heuristic: if the request path starts with /api/setup or similar, consider it startup
        // Otherwise, consider it runtime
        var path = context.Request.Path.Value ?? "";
        if (path.Contains("/setup") || path.Contains("/migrate") || path.Contains("/init"))
        {
            return "startup";
        }
        return "runtime";
    }
}