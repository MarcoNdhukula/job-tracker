import { useEffect, useState } from "react";
import { getHistory, type StatusChange } from "./api";

interface Props {
  applicationId: number;
  onClose: () => void;
}

// The API stores times in UTC. Show them in South African time (UTC+2).
function formatTime(utc: string): string {
  const date = new Date(utc.endsWith("Z") ? utc : `${utc}Z`);
  return date.toLocaleString("en-ZA", {
    timeZone: "Africa/Johannesburg",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function History({ applicationId, onClose }: Props) {
  const [entries, setEntries] = useState<StatusChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getHistory(applicationId)
      .then((data) => {
        if (!cancelled) {
          setEntries(data);
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
  }, [applicationId]);

  return (
    <section>
      <div>
        <h2>Status history</h2>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      {loading && <p>Loading history...</p>}
      {error && <p>Could not load history: {error}</p>}
      {!loading && !error && entries.length === 0 && (
        <p>No status changes recorded yet.</p>
      )}

      {!loading && !error && entries.length > 0 && (
        <ol>
          {entries.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.status}</strong> , {formatTime(entry.changedAt)}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}