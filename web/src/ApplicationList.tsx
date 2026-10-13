import { useEffect, useState } from "react";
import { getApplications, type JobApplication } from "./api";

interface Props {
  refreshKey: number;
}

export default function ApplicationList({ refreshKey }: Props) {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getApplications()
      .then((data) => {
        setApplications(data);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) return <p>Loading applications...</p>;
  if (error) return <p>Could not load applications: {error}</p>;
  if (applications.length === 0) return <p>No applications yet.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Company</th>
          <th>Role</th>
          <th>Status</th>
          <th>Date applied</th>
        </tr>
      </thead>
      <tbody>
        {applications.map((app) => (
          <tr key={app.id}>
            <td>{app.company}</td>
            <td>{app.role}</td>
            <td>{app.status}</td>
            <td>{app.dateApplied}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}