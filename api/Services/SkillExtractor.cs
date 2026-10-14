using System.Net.Http.Json;
using System.Text.Json;

namespace JobTracker.Api.Services;

public record ExtractSkillsRequest(string JobDescription);

public record SkillExtractionResult(List<string> RequiredSkills, List<string> NiceToHaveSkills);

public class SkillExtractionException : Exception
{
    public SkillExtractionException(string message) : base(message) { }
}

public class SkillExtractor
{
    private const int MaxSkillsPerList = 20;
    private const int MaxSkillLength = 50;

    private readonly HttpClient _http;
    private readonly string _model;

    public SkillExtractor(HttpClient http, IConfiguration config)
    {
        _http = http;
        _model = config["Ollama:Model"] ?? "llama3.2:1b";
    }

    public async Task<SkillExtractionResult> ExtractAsync(string jobDescription, CancellationToken ct)
    {
        var request = new
        {
            model = _model,
            prompt = BuildPrompt(jobDescription),
            stream = false,
            format = "json"
        };

        using var response = await _http.PostAsJsonAsync("/api/generate", request, ct);
        response.EnsureSuccessStatusCode();

        var envelope = await response.Content.ReadFromJsonAsync<OllamaResponse>(ct);
        var raw = envelope?.Response;
        if (string.IsNullOrWhiteSpace(raw))
            throw new SkillExtractionException("The AI service returned an empty reply.");

        return Validate(raw, jobDescription);
    }

        private static string BuildPrompt(string jobDescription)
    {
        return "Extract the skills from the job description below.\n" +
               "Return only a JSON object with two keys:\n" +
               "\"requiredSkills\": an array of skills the job requires.\n" +
               "\"niceToHaveSkills\": an array of skills the job describes as optional or a plus.\n" +
               "Use short names exactly as written in the description, such as \"C#\" or \"SQL\".\n" +
               "Do not add skills that the description does not mention.\n" +
               "If there are none for a key, use an empty array.\n\n" +
               "Job description:\n" +
               jobDescription;
    }

    private static SkillExtractionResult Validate(string raw, string jobDescription)
    {
        SkillsPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<SkillsPayload>(
                raw, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (JsonException)
        {
            throw new SkillExtractionException("The AI reply was not valid JSON.");
        }

        if (payload is null)
            throw new SkillExtractionException("The AI reply was empty.");

        var required = Clean(payload.RequiredSkills, jobDescription);

        // A skill shouldn't appear in both lists
        var niceToHave = Clean(payload.NiceToHaveSkills, jobDescription)
            .Where(s => !required.Contains(s, StringComparer.OrdinalIgnoreCase))
            .ToList();

        return new SkillExtractionResult(required, niceToHave);
    }

    private static List<string> Clean(List<string>? skills, string jobDescription)
    {
        if (skills is null)
            return new List<string>();

        return skills
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Where(s => s.Length <= MaxSkillLength)
            // Keep only skills the description actually mentions
            .Where(s => jobDescription.Contains(s, StringComparison.OrdinalIgnoreCase))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(MaxSkillsPerList)
            .ToList();
    }
}

internal record OllamaResponse(string? Response);

internal record SkillsPayload(List<string>? RequiredSkills, List<string>? NiceToHaveSkills);