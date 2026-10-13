using JobTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<JobApplication> Applications => Set<JobApplication>();
    public DbSet<StatusChange> StatusChanges => Set<StatusChange>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<JobApplication>(entity =>
        {
            entity.Property(a => a.Company).HasMaxLength(200).IsRequired();
            entity.Property(a => a.Role).HasMaxLength(200).IsRequired();
            entity.Property(a => a.Notes).HasMaxLength(2000);
            entity.Property(a => a.Status).HasConversion<string>();

            // One application has many status changes. Deleting the application deletes its history.
            entity.HasMany(a => a.StatusHistory)
                  .WithOne()
                  .HasForeignKey(s => s.ApplicationId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StatusChange>(entity =>
        {
            entity.Property(s => s.Status).HasConversion<string>();
        });
    }
}