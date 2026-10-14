import { useEffect, useState } from "react";
import { deleteApplication, getApplications, type JobApplication } from "./api";
import History from "./History";

const PAGE_SIZE = 10;

interface Props {
  refreshKey: number;
  onEdit: (app: JobApplication) => void;
  onDeleted: (id: number) => void;
}

export default function ApplicationList({ refreshKey, onEdit, onDeleted }: Props) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [historyId, setHistoryId] = useState<number | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;

    getApplications(page, PAGE_SIZE)
      .then((result) => {
        if (cancelled) return;

        const lastPage = Math.max(1, Math.ceil(result.totalCount / PAGE_SIZE));
        if (page > lastPage) {
          // The page is now past the end (for example, after deleting its last record).
          // Move back to the last page that has data.
          setPage(lastPage);
          return;
        }

        setApplications(result.items);
        setTotalCount(result.totalCount);
        setError(null);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey, page]);

  async function handleDelete(app: JobApplication) {
    if (!window.confirm(`Delete ${app.role} at ${app.company}?`)) return;

    setActionError(null);
    try {
      await deleteApplication(app.id);
      if (historyId === app.id) setHistoryId(null);
      onDeleted(app.id);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Could not delete the application.");
    }
  }

  if (loading) return <p>Loading applications...</p>;
  if (error) return <p>Could not load applications: {error}</p>;
  if (totalCount === 0) return <p>No applications yet.</p>;

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
                <button
                  type="button"
                  onClick={() => setHistoryId(historyId === app.id ? null : app.id)}
                >
                  {historyId === app.id ? "Hide history" : "History"}
                </button>{" "}
                <button type="button" onClick={() => handleDelete(app)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <button
          type="button"
          onClick={() => setPage((p) => p - 1)}
          disabled={page <= 1}
        >
          Previous
        </button>{" "}
        <span>
          Page {page} of {totalPages}
        </span>{" "}
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          disabled={page >= totalPages}
        >
          Next
        </button>
      </div>

      {historyId !== null && (
        <History applicationId={historyId} onClose={() => setHistoryId(null)} />
      )}
    </>
  );
}