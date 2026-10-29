using BuilderLedger.API.ExceptionHandling;
using BuilderLedger.API.Helpers;
using BuilderLedger.API.Services;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Warning)
    .WriteTo.Console(outputTemplate: "{Message:lj}{NewLine}{Exception}")
    .WriteTo.File("Logs/app-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 30,
        outputTemplate: "{Message:lj}{NewLine}{Exception}")
    .CreateLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    // Enable Serilog
    builder.Host.UseSerilog();

    // Get configuration from the existing WebApplicationBuilder configuration.
    string CostConstructDBConnectionString = builder.Configuration.GetConnectionString("CostConstructDBConnection");

    string repositoryType = builder.Configuration["ApplicationSettings:DalTechnology"] ?? "AdoDotNet";

    // Add MVC Controllers + Views and configure JSON serialization.
    builder.Services.AddControllersWithViews()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;

            options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        });

    // Session
    builder.Services.AddDistributedMemoryCache();
    builder.Services.AddSession();

    // PDF service
    builder.Services.AddSingleton<BuilderLedger.API.Services.SiteReportPdfService>();

    builder.Services.AddHostedService(sp => sp.GetRequiredService<BuilderLedger.API.Services.SiteReportPdfService>()
    );

    // Email service
    builder.Services.Configure<EmailSettings>(
        builder.Configuration.GetSection("EmailSettings"));

    builder.Services.AddScoped<IEmailService, EmailService>();

    builder.Services.AddScoped<SiteUpdateEmailService>();

    builder.Services.AddScoped<SiteDeleteEmailService>();

    // CORS
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend",
            policy =>
            {
                policy
                    .WithOrigins(
                        "http://localhost:5173",
                        "https://constructionapp1.azurewebsites.net",
                        "https://thankful-hill-0fc21d61e.5.azurestaticapps.net"
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod();
                //.WithExposedHeaders(
                //    "X-PDF-Total-Ms",
                //    "X-PDF-Playwright-Ms",
                //    "X-PDF-Chromium-Ms",
                //    "X-PDF-NewPage-Ms",
                //    "X-PDF-SetContent-Ms",
                //    "X-PDF-ExtraWait-Ms",
                //    "X-PDF-PdfAsync-Ms"
                //);
            });
    });

    // Register repositories based on repository type.
    var repositoryRegistration = new RepositoryRegistration();

    if (repositoryType == "AdoDotNet")
    {
        //repositoryRegistration.RegisterAdoDotNetRepositories(builder.Services, CostConstructDBConnectionString);
    }
    else if (repositoryType == "AdoDotNetUsingSp")
    {
        //repositoryRegistration.RegisterAdoDotNetUsingSpRepositories(builder.Services, CostConstructDBConnectionString);
    }
    else if (repositoryType == "Dapper")
    {
        repositoryRegistration.RegisterDapperRepositories(builder.Services, CostConstructDBConnectionString);
    }
    else
    {
        //repositoryRegistration.RegisterDapperUsingSpRepositories(builder.Services, CostConstructDBConnectionString);
    }

    // Global exception handling
    builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
    builder.Services.AddProblemDetails();

    WebApplication app = builder.Build();

    // Configure the HTTP request pipeline.
    app.UseExceptionHandler();

    if (!app.Environment.IsDevelopment())
    {
        app.UseHsts();
    }

    app.UseHttpsRedirection();

    app.UseStaticFiles();

    app.UseRouting();

    app.UseSession();

    app.UseCors("AllowFrontend");

    app.UseAuthorization();

    app.MapControllers();

    app.MapControllerRoute(
        name: "default",
        pattern: "{controller=Account}/{action=Login}/{id?}");

    app.Run();
}
catch (Exception ex)
{
    // TEMP: prints the real startup crash reason to console
    // instead of a silent exit code.
    Console.ForegroundColor = ConsoleColor.Red;

    Console.WriteLine("=== STARTUP CRASH ===");
    Console.WriteLine(ex.ToString());

    Console.ResetColor();

    Console.WriteLine("Press Enter to exit...");
    Console.ReadLine();

    throw;
}

//WebApplicationBuilder builder = WebApplication.CreateBuilder(args);

//// Get configuration from the existing WebApplicationBuilder configuration.
//string CostConstructDBConnectionString = builder.Configuration.GetConnectionString("CostConstructDBConnection");

//string repositoryType = builder.Configuration["ApplicationSettings:DalTechnology"] ?? "AdoDotNet";
//// Register repositories based on repository type.
//var repositoryRegistration = new RepositoryRegistration();

//if (repositoryType == "AdoDotNet")
//{
//    //repositoryRegistration.RegisterAdoDotNetRepositories(builder.Services, CostConstructDBConnectionString);
//}
//else if (repositoryType == "AdoDotNetUsingSp")
//{
//    //repositoryRegistration.RegisterAdoDotNetUsingSpRepositories(builder.Services, CostConstructDBConnectionString);
//}
//else if (repositoryType == "Dapper")
//{
//    repositoryRegistration.RegisterDapperRepositories(builder.Services, CostConstructDBConnectionString);
//}
//else
//{
//    //repositoryRegistration.RegisterDapperUsingSpRepositories(builder.Services, CostConstructDBConnectionString);
//}

//// Add services to the container.

//builder.Services.AddControllers();

//builder.Services.AddMemoryCache();
//// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
//builder.Services.AddOpenApi();

//var app = builder.Build();

//// Configure the HTTP request pipeline.
//if (app.Environment.IsDevelopment())
//{
//    app.MapOpenApi();
//}

//app.UseHttpsRedirection();

//app.UseAuthorization();

//app.MapControllers();

//app.Run();
