using JobTracker.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<JobApplication> Applications => Set<JobApplication>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<JobApplication>(entity =>
        {
            entity.Property(a => a.Company).HasMaxLength(200).IsRequired();
            entity.Property(a => a.Role).HasMaxLength(200).IsRequired();
            entity.Property(a => a.Notes).HasMaxLength(2000);
            entity.Property(a => a.Status).HasConversion<string>();
        });
    }
}