import { useEffect, useState } from "react";
import { deleteApplication, getApplications, type JobApplication } from "./api";

interface Props {
  refreshKey: number;
  onEdit: (app: JobApplication) => void;
  onDeleted: (id: number) => void;
}

export default function ApplicationList({ refreshKey, onEdit, onDeleted }: Props) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getApplications()
      .then((data) => {
        if (!cancelled) {
          setApplications(data);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function handleDelete(app: JobApplication) {
    if (!window.confirm(`Delete ${app.role} at ${app.company}?`)) return;

    setActionError(null);
    try {
      await deleteApplication(app.id);
      onDeleted(app.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete the application.");
    }
  }

  if (loading) return <p>Loading applications...</p>;
  if (error) return <p>Could not load applications: {error}</p>;
  if (applications.length === 0) return <p>No applications yet.</p>;

  return (
    <>
      {actionError && <p>Action failed: {actionError}</p>}
      <table>
        <thead>
          <tr>
            <th>Company</th>
            <th>Role</th>
            <th>Status</th>
            <th>Date applied</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td>{app.company}</td>
              <td>{app.role}</td>
              <td>{app.status}</td>
              <td>{app.dateApplied}</td>
              <td>
                <button type="button" onClick={() => onEdit(app)}>
                  Edit
                </button>{" "}
                <button type="button" onClick={() => handleDelete(app)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}