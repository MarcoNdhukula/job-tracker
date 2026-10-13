using System.Text.Json.Serialization;
using JobTracker.Api.Data;
using JobTracker.Api.Models;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default")));

// Send enums as text ("Applied") instead of numbers (0)
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()));

var app = builder.Build();

app.UseCors();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

// Create the database and apply migrations on startup
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

var applications = app.MapGroup("/api/applications");

applications.MapGet("/", async (AppDbContext db) =>
    await db.Applications.OrderByDescending(a => a.DateApplied).ToListAsync());

applications.MapGet("/{id:int}", async (int id, AppDbContext db) =>
    await db.Applications.FindAsync(id) is JobApplication item
        ? Results.Ok(item)
        : Results.NotFound());

applications.MapPost("/", async (JobApplication input, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(input.Company) || string.IsNullOrWhiteSpace(input.Role))
        return Results.BadRequest("Company and Role are required.");

    input.Id = 0; // let the database assign the Id
    db.Applications.Add(input);
    await db.SaveChangesAsync();
    return Results.Created($"/api/applications/{input.Id}", input);
});

applications.MapPut("/{id:int}", async (int id, JobApplication input, AppDbContext db) =>
{
    var existing = await db.Applications.FindAsync(id);
    if (existing is null)
        return Results.NotFound();

    if (string.IsNullOrWhiteSpace(input.Company) || string.IsNullOrWhiteSpace(input.Role))
        return Results.BadRequest("Company and Role are required.");

    existing.Company = input.Company;
    existing.Role = input.Role;
    existing.Status = input.Status;
    existing.DateApplied = input.DateApplied;
    existing.Notes = input.Notes;
    await db.SaveChangesAsync();
    return Results.Ok(existing);
});

applications.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
{
    var existing = await db.Applications.FindAsync(id);
    if (existing is null)
        return Results.NotFound();

    db.Applications.Remove(existing);
    await db.SaveChangesAsync();
    return Results.NoContent();
});

applications.MapGet("/summary", async (AppDbContext db) =>
{
    // Count applications per status. Statuses with no rows are filled in as 0.
    var counts = await db.Applications
        .GroupBy(a => a.Status)
        .Select(g => new { Status = g.Key, Count = g.Count() })
        .ToListAsync();

    var summary = Enum.GetValues<ApplicationStatus>()
        .ToDictionary(
            status => status.ToString(),
            status => counts.FirstOrDefault(c => c.Status == status)?.Count ?? 0);

    return Results.Ok(summary);
});

app.Run();

public partial class Program { }