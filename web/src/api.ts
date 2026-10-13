export interface JobApplication {
  id: number;
  company: string;
  role: string;
  status: ApplicationStatus;
  dateApplied: string;
  notes: string | null;
}

export type ApplicationStatus = "Applied" | "Interviewing" | "Offer" | "Rejected";

export interface NewApplication {
  company: string;
  role: string;
  status: ApplicationStatus;
  dateApplied: string;
  notes: string | null;
}

const API_BASE = "http://localhost:5216/api/applications";

export async function getApplications(): Promise<JobApplication[]> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return response.json();
}

export async function createApplication(data: NewApplication): Promise<JobApplication> {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }
  return response.json();
}