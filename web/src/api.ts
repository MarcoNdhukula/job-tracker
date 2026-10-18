export interface JobApplication {
  id: number;
  company: string;
  role: string;
  status: ApplicationStatus;
  dateApplied: string;
  notes: string | null;
}

export type ApplicationStatus = "Applied" | "Interviewing" | "Offer" | "Rejected";

export interface ApplicationInput {
  company: string;
  role: string;
  status: ApplicationStatus;
  dateApplied: string;
  notes: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export type ApplicationSummary = Record<ApplicationStatus, number>;

export interface StatusChange {
  id: number;
  applicationId: number;
  status: ApplicationStatus;
  changedAt: string;
}

export interface SkillExtractionResult {
  requiredSkills: string[];
  niceToHaveSkills: string[];
}

// Shape of an ASP.NET Core ProblemDetails response
interface ProblemDetails {
  title?: string;
  detail?: string;
  errors?: Record<string, string[]>;
}

const API_BASE = "http://localhost:5216/api/applications";
const AI_BASE = "http://localhost:5216/api/ai";

// Turns a ProblemDetails body into one readable sentence.
// Field-level validation errors are checked first, then detail, then title.
function readProblemMessage(problem: ProblemDetails): string | null {
  if (problem.errors) {
    const messages = Object.values(problem.errors).flat();
    if (messages.length > 0) return messages.join(" ");
  }
  if (problem.detail) return problem.detail;
  if (problem.title) return problem.title;
  return null;
}

async function ensureOk(response: Response): Promise<void> {
  if (response.ok) return;

  let message = `Request failed with status ${response.status}`;
  try {
    const problem = (await response.json()) as ProblemDetails;
    message = readProblemMessage(problem) ?? message;
  } catch {
    // The body wasn't JSON, so keep the status-based message
  }

  throw new Error(message);
}

export async function getApplications(page = 1, pageSize = 10): Promise<PagedResult<JobApplication>> {
  const response = await fetch(`${API_BASE}?page=${page}&pageSize=${pageSize}`);
  await ensureOk(response);
  return response.json();
}

export async function createApplication(data: ApplicationInput): Promise<JobApplication> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await ensureOk(response);
  return response.json();
}

export async function updateApplication(id: number, data: ApplicationInput): Promise<JobApplication> {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  await ensureOk(response);
  return response.json();
}

export async function deleteApplication(id: number): Promise<void> {
  const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  await ensureOk(response);
}

export async function getSummary(): Promise<ApplicationSummary> {
  const response = await fetch(`${API_BASE}/summary`);
  await ensureOk(response);
  return response.json();
}

export async function getHistory(id: number): Promise<StatusChange[]> {
  const response = await fetch(`${API_BASE}/${id}/history`);
  await ensureOk(response);
  return response.json();
}

export async function extractSkills(jobDescription: string): Promise<SkillExtractionResult> {
  const response = await fetch(`${AI_BASE}/extract-skills`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobDescription }),
  });
  await ensureOk(response);
  return response.json();
}