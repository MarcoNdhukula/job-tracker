import { useState, type FormEvent } from "react";
import {
  createApplication,
  updateApplication,
  type ApplicationInput,
  type ApplicationStatus,
  type JobApplication,
} from "./api";

interface Props {
  editing: JobApplication | null;
  onSaved: () => void;
  onCancel: () => void;
}

const STATUSES: ApplicationStatus[] = ["Applied", "Interviewing", "Offer", "Rejected"];

// Uses the local date, not UTC, so the default is correct in South Africa
function today(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

export default function ApplicationForm({ editing, onSaved, onCancel }: Props) {
  const [company, setCompany] = useState(editing?.company ?? "");
  const [role, setRole] = useState(editing?.role ?? "");
  const [status, setStatus] = useState<ApplicationStatus>(editing?.status ?? "Applied");
  const [dateApplied, setDateApplied] = useState(editing?.dateApplied ?? today());
  const [notes, setNotes] = useState(editing?.notes ?? "");
  const [errors, setErrors] = useState<{ company?: string; role?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): boolean {
    const newErrors: { company?: string; role?: string } = {};
    if (!company.trim()) newErrors.company = "Company is required.";
    if (!role.trim()) newErrors.role = "Role is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function resetForm() {
    setCompany("");
    setRole("");
    setStatus("Applied");
    setDateApplied(today());
    setNotes("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    if (!validate()) return;

    const payload: ApplicationInput = {
      company: company.trim(),
      role: role.trim(),
      status,
      dateApplied,
      notes: notes.trim() || null,
    };

    setSubmitting(true);
    try {
      if (editing) {
        await updateApplication(editing.id, payload);
      } else {
        await createApplication(payload);
        resetForm();
      }
      onSaved();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Could not save the application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>{editing ? "Edit application" : "Add application"}</h2>

      <div>
        <label>
          Company
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            maxLength={200}
          />
        </label>
        {errors.company && <p>{errors.company}</p>}
      </div>

      <div>
        <label>
          Role
          <input value={role} onChange={(e) => setRole(e.target.value)} maxLength={200} />
        </label>
        {errors.role && <p>{errors.role}</p>}
      </div>

      <div>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label>
          Date applied
          <input
            type="date"
            value={dateApplied}
            onChange={(e) => setDateApplied(e.target.value)}
            required
          />
        </label>
      </div>

      <div>
        <label>
          Notes
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={2000}
            rows={3}
          />
        </label>
      </div>

      {serverError && <p>Could not save: {serverError}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Saving..." : editing ? "Update application" : "Save application"}
      </button>

      {editing && (
        <button type="button" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      )}
    </form>
  );
}