import { useState } from "react";
import ApplicationForm from "./ApplicationForm";
import ApplicationList from "./ApplicationList";
import type { JobApplication } from "./api";

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [editing, setEditing] = useState<JobApplication | null>(null);

  function refresh() {
    setRefreshKey((k) => k + 1);
  }

  function handleEdit(app: JobApplication) {
    setEditing(app);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main>
      <h1>Job Applications</h1>
      <ApplicationForm
        key={editing?.id ?? "new"}
        editing={editing}
        onSaved={() => {
          setEditing(null);
          refresh();
        }}
        onCancel={() => setEditing(null)}
      />
      <ApplicationList
        refreshKey={refreshKey}
        onEdit={handleEdit}
        onDeleted={(id) => {
          if (editing?.id === id) setEditing(null);
          refresh();
        }}
      />
    </main>
  );
}