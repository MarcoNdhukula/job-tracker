import { useState } from "react";
import ApplicationForm from "./ApplicationForm";
import ApplicationList from "./ApplicationList";

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <main>
      <h1>Job Applications</h1>
      <ApplicationForm onSaved={() => setRefreshKey((k) => k + 1)} />
      <ApplicationList refreshKey={refreshKey} />
    </main>
  );
}