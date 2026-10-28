using Microsoft.AspNetCore.Diagnostics;

namespace BuilderLedger.API.ExceptionHandling;
public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        logger.LogError(exception, "Unhandled exception in {Method} {Path}. TraceId: {TraceId}",
                        context.Request.Method, context.Request.Path, context.TraceIdentifier);

        await Results.Problem(statusCode: StatusCodes.Status500InternalServerError,
            title: "An unexpected error occurred.",
            extensions: new Dictionary<string, object?>
            {
                ["traceId"] = context.TraceIdentifier
            })
            .ExecuteAsync(context);

        return true;
    }
}
