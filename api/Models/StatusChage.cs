namespace JobTracker.Api.Models;

public class StatusChange
{
    public int Id { get; set; }
    public int ApplicationId { get; set; }
    public ApplicationStatus Status { get; set; }
    public DateTime ChangedAt { get; set; }
}