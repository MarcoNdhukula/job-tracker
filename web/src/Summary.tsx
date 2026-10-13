import { useEffect, useState } from "react";
import { getSummary, type ApplicationSummary } from "./api";

interface Props {
  refreshKey: number;
}

export default function Summary({ refreshKey }: Props) {
  const [counts, setCounts] = useState<ApplicationSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getSummary()
      .then((data) => {
        if (!cancelled) {
          setCounts(data);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (error) return <p>Could not load summary: {error}</p>;
  if (!counts) return <p>Loading summary...</p>;

  return (
    <section>
      <h2>Summary</h2>
      <ul>
        {Object.entries(counts).map(([status, count]) => (
          <li key={status}>
            {status}: {count}
          </li>
        ))}
      </ul>
    </section>
  );
}