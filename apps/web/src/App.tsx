import { useEffect, useState } from "react";
import { getHealth } from "./lib/api";

function App() {
  const [apiStatus, setApiStatus] = useState("Checking API...");

  useEffect(() => {
    getHealth()
      .then((data) => {
        setApiStatus(data.status === "ok" ? "API Connected ✓" : "API Error");
      })
      .catch(() => {
        setApiStatus("API Connection Failed");
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="text-3xl font-bold text-slate-900">
          GatePulse
        </h1>

        <p className="mt-2 text-slate-600">
          Visitor entry system
        </p>

        <div className="mt-6 rounded-lg bg-slate-100 p-4">
          <p className="text-sm text-slate-500">
            Backend status
          </p>

          <p className="mt-1 font-medium text-slate-900">
            {apiStatus}
          </p>
        </div>
      </div>
    </main>
  );
}

export default App;