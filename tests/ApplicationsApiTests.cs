using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using JobTracker.Api.Models;
using Microsoft.AspNetCore.Mvc.Testing;

namespace JobTracker.Api.Tests;

public class ApplicationsApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    // Read enums as text ("Interviewing"), matching the API's JSON settings
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly HttpClient _client;

    public ApplicationsApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            // Use a separate database file for tests so they don't touch jobtracker.db
            builder.UseSetting("ConnectionStrings:Default", $"Data Source=test-{Guid.NewGuid()}.db");
        }).CreateClient();
    }

    private static object NewApplication(string company = "Test Company", string role = "Tester") => new
    {
        company,
        role,
        status = "Applied",
        dateApplied = "2026-10-12",
        notes = "Created by a test"
    };

    [Fact]
    public async Task Create_ReturnsCreated_WithAssignedId()
    {
        var response = await _client.PostAsJsonAsync("/api/applications", NewApplication());

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<JobApplication>(JsonOptions);
        Assert.NotNull(created);
        Assert.True(created.Id > 0);
        Assert.Equal("Test Company", created.Company);
    }

    [Fact]
    public async Task Create_WithEmptyCompany_ReturnsBadRequest()
    {
        var response = await _client.PostAsJsonAsync("/api/applications",
            NewApplication(company: "   "));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_ForMissingId()
    {
        var response = await _client.GetAsync("/api/applications/999999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Update_ChangesStatus()
    {
        var created = await CreateAsync("Update Co");

        var update = new
        {
            company = "Update Co",
            role = "Tester",
            status = "Interviewing",
            dateApplied = "2026-10-12",
            notes = (string?)null
        };
        var response = await _client.PutAsJsonAsync($"/api/applications/{created.Id}", update);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var updated = await response.Content.ReadFromJsonAsync<JobApplication>(JsonOptions);
        Assert.Equal(ApplicationStatus.Interviewing, updated!.Status);
    }

    [Fact]
    public async Task Delete_RemovesRecord()
    {
        var created = await CreateAsync("Delete Co");

        var deleteResponse = await _client.DeleteAsync($"/api/applications/{created.Id}");
        var getResponse = await _client.GetAsync($"/api/applications/{created.Id}");

        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task Summary_ReturnsAllStatuses()
    {
        var summary = await _client.GetFromJsonAsync<Dictionary<string, int>>("/api/applications/summary");

        Assert.NotNull(summary);
        Assert.Equal(4, summary.Count);
        Assert.Contains("Applied", summary.Keys);
        Assert.Contains("Interviewing", summary.Keys);
        Assert.Contains("Offer", summary.Keys);
        Assert.Contains("Rejected", summary.Keys);
    }

    private async Task<JobApplication> CreateAsync(string company)
    {
        var response = await _client.PostAsJsonAsync("/api/applications", NewApplication(company));
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<JobApplication>(JsonOptions))!;
    }
}