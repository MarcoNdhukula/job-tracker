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

const API_BASE = "http://localhost:5216/api/applications";

async function ensureOk(response: Response): Promise<void> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
}

export async function getApplications(): Promise<JobApplication[]> {
  const response = await fetch(API_BASE);
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
  // The API returns 204 No Content, so there is no body to parse
}