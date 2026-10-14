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

applications.MapGet("/", async (int? page, int? pageSize, AppDbContext db) =>
{
    var currentPage = page ?? 1;
    var size = pageSize ?? 10;

    if (currentPage < 1)
        return Results.BadRequest("Page must be 1 or greater.");
    if (size < 1 || size > 50)
        return Results.BadRequest("Page size must be between 1 and 50.");

    // Id is a tiebreaker so records with the same date keep a stable order across pages
    var query = db.Applications
        .OrderByDescending(a => a.DateApplied)
        .ThenByDescending(a => a.Id);

    var totalCount = await query.CountAsync();

    var items = await query
        .Skip((currentPage - 1) * size)
        .Take(size)
        .ToListAsync();

    return Results.Ok(new PagedResult<JobApplication>(items, totalCount, currentPage, size));
});

applications.MapGet("/{id:int}", async (int id, AppDbContext db) =>
    await db.Applications.FindAsync(id) is JobApplication item
        ? Results.Ok(item)
        : Results.NotFound());

applications.MapPost("/", async (JobApplication input, AppDbContext db) =>
{
    if (string.IsNullOrWhiteSpace(input.Company) || string.IsNullOrWhiteSpace(input.Role))
        return Results.BadRequest("Company and Role are required.");

    input.Id = 0; // let the database assign the Id

    // Record the starting status as the first entry in the history
    input.StatusHistory.Add(new StatusChange
    {
        Status = input.Status,
        ChangedAt = DateTime.UtcNow
    });

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

    // Only record a history entry when the status actually changes
    if (existing.Status != input.Status)
    {
        existing.StatusHistory.Add(new StatusChange
        {
            Status = input.Status,
            ChangedAt = DateTime.UtcNow
        });
    }

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

applications.MapGet("/{id:int}/history", async (int id, AppDbContext db) =>
{
    var exists = await db.Applications.AnyAsync(a => a.Id == id);
    if (!exists)
        return Results.NotFound();

    var history = await db.StatusChanges
        .Where(s => s.ApplicationId == id)
        .OrderBy(s => s.ChangedAt)
        .ThenBy(s => s.Id)
        .ToListAsync();

    return Results.Ok(history);
});

app.Run();