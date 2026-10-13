export interface JobApplication {
  id: number;
  company: string;
  role: string;
  status: "Applied" | "Interviewing" | "Offer" | "Rejected";
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