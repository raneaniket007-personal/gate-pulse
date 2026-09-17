import { useEffect, useState } from "react";
import { getHealth } from "./lib/api";

function App() {
  const [apiStatus, setApiStatus] = useState("Checking API...");
  const [environment, setEnvironment] = useState("");

  useEffect(() => {
    getHealth()
      .then((data) => {
        setApiStatus(
          data.status === "ok"
            ? "API Connected ✓"
            : "API Error",
        );
        setEnvironment(data.environment);
      })
      .catch(() => {
        setApiStatus("API Connection Failed");
      });
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-600">
            GatePulse
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Visitor Entry System
          </h1>

          <p className="mt-2 text-slate-600">
            Serverless-ready visitor management for residential societies.
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-sm text-slate-500">
            Backend Status
          </p>

          <p className="mt-1 font-semibold text-slate-900">
            {apiStatus}
          </p>

          {environment && (
            <p className="mt-1 text-sm text-slate-500">
              Environment: {environment}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;