import { useState, type FormEvent } from "react";
import { extractSkills, type SkillExtractionResult } from "./api";

export default function SkillExtractor() {
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<SkillExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    if (!jobDescription.trim()) {
      setError("Paste a job description first.");
      return;
    }

    setLoading(true);
    try {
      setResult(await extractSkills(jobDescription.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not extract skills.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h2>Extract skills from a job description</h2>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Job description
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={6}
              maxLength={8000}
            />
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Extracting... this can take a minute" : "Extract skills"}
        </button>
      </form>

      {error && <p>Could not extract skills: {error}</p>}

      {result && (
        <div>
          <h3>Required</h3>
          {result.requiredSkills.length === 0 ? (
            <p>None found.</p>
          ) : (
            <ul>
              {result.requiredSkills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          )}

          <h3>Nice to have</h3>
          {result.niceToHaveSkills.length === 0 ? (
            <p>None found.</p>
          ) : (
            <ul>
              {result.niceToHaveSkills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}