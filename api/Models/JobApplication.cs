using System.Text.Json.Serialization;

namespace JobTracker.Api.Models;

public enum ApplicationStatus
{
    Applied,
    Interviewing,
    Offer,
    Rejected
}

public class JobApplication
{
    public int Id { get; set; }
    public string Company { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Applied;
    public DateOnly DateApplied { get; set; }
    public string? Notes { get; set; }

    // Not sent in API responses. Use GET /api/applications/{id}/history to read it.
    [JsonIgnore]
    public List<StatusChange> StatusHistory { get; set; } = new();
}