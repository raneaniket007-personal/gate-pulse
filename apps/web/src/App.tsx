import ResidentApp from "./ResidentApp";
import { useEffect, useState } from "react";
import SelfieCapture from "./components/SelfieCapture";
import VisitorReview from "./components/VisitorReview";
import WaitingForApproval from "./components/WaitingForApproval";
import { createVisitor, getSocietyById, getVisitorStatus } from "./lib/api";
import { connectToVisitorSocket } from "./lib/socket";
import VisitorApproved from "./components/VisitorApproved";
import VisitorDenied from "./components/VisitorDenied";
import VisitorExpired from "./components/VisitorExpired";

type Step =
  | "welcome"
  | "flat"
  | "details"
  | "selfie"
  | "review"
  | "waiting"
  | "approved"
  | "denied"
  | "expired";

type Flat = {
  id: string;
  unitNumber: string;
  residentName: string;
};

type Society = {
  id: string;
  name: string;
  address?: string;
  flats: Flat[];
};

function App() {
  if (window.location.pathname.startsWith("/resident")) {
    return <ResidentApp />;
  }
  const [step, setStep] = useState<Step>("welcome");
  const [selectedFlat, setSelectedFlat] = useState("");
  const [selectedFlatId, setSelectedFlatId] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [societyName, setSocietyName] = useState("");
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loadingSociety, setLoadingSociety] = useState(true);
  const [societyError, setSocietyError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [visitorLogId, setVisitorLogId] = useState<string | null>(null);
  const [passExpiresAt, setPassExpiresAt] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadSocietyData() {
      try {
        setLoadingSociety(true);
        setSocietyError(null);

        const params = new URLSearchParams(window.location.search);
        const societyId = params.get("society");

        if (!societyId) {
          setSocietyError("Invalid URL: Missing society parameter. Please scan a valid Gate QR code.");
          return;
        }

        const targetSociety: Society = await getSocietyById(societyId);

        setSocietyName(targetSociety.name);
        setFlats(targetSociety.flats || []);
      } catch (error) {
        console.error("Failed to load society:", error);
        setSocietyError("Unable to load society details. Please scan a valid Gate QR code.");
      } finally {
        setLoadingSociety(false);
      }
    }

    loadSocietyData();
  }, []);

  useEffect(() => {
    if (
      step !== "waiting" ||
      !visitorLogId
    ) {
      return;
    }

    const handleStatusUpdate = (update: { status: string; passExpiresAt?: string | null }) => {
      console.log("Visitor status updated:", update);

      if (update.status === "APPROVED") {
        setPassExpiresAt(update.passExpiresAt || null);
        setStep("approved");
      } else if (update.status === "DENIED") {
        setStep("denied");
      } else if (update.status === "EXPIRED") {
        setStep("expired");
      }
    };

    const socket = connectToVisitorSocket(visitorLogId, handleStatusUpdate);

    const pollInterval = setInterval(async () => {
      try {
        const data = await getVisitorStatus(visitorLogId);
        if (data.status && data.status !== "PENDING") {
          handleStatusUpdate(data);
        }
      } catch (err) {
        console.warn("Polling visitor status error:", err);
      }
    }, 3000);

    return () => {
      socket.disconnect();
      clearInterval(pollInterval);
    };
  }, [step, visitorLogId]);

  if (step === "details") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-500">
              {societyName}
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Your details
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Enter your name before taking a selfie.
            </p>
          </div>

          <div className="mb-6 rounded-xl bg-white border border-slate-200 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Visiting
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-900">
              Flat {selectedFlat}
            </p>
          </div>

          <div className="mb-6">
            <label
              htmlFor="visitor-name"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Your name
            </label>

            <input
              id="visitor-name"
              type="text"
              value={visitorName}
              onChange={(event) => setVisitorName(event.target.value)}
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
            />
          </div>

          <button
            type="button"
            disabled={!visitorName.trim()}
            onClick={() => setStep("selfie")}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
          </button>

          <button
            type="button"
            onClick={() => setStep("flat")}
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600"
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  if (step === "flat") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-500">
              {societyName}
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Who are you visiting?
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Select the flat you are visiting.
            </p>
          </div>

          <div className="space-y-3">
            {loadingSociety && (
              <div className="rounded-xl bg-white p-4 text-center text-sm text-slate-500">
                Loading flats...
              </div>
            )}

            {societyError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {societyError}
              </div>
            )}

            {!loadingSociety &&
              !societyError &&
              flats.map((flat) => (
                <button
                  key={flat.id}
                  type="button"
                  onClick={() => {
                    setSelectedFlat(flat.unitNumber);
                    setSelectedFlatId(flat.id);
                    setStep("details");
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <span className="font-semibold text-slate-900">
                    Flat {flat.unitNumber}
                  </span>

                  <span className="text-slate-400">→</span>
                </button>
              ))}
          </div>

          <button
            type="button"
            onClick={() => setStep("welcome")}
            className="mt-6 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600"
          >
            Back
          </button>
        </div>
      </main>
    );
  }

  if (step === "selfie") {
    return (
      <SelfieCapture
        onCapture={(blob) => {
          const url = URL.createObjectURL(blob);

          setSelfieBlob(blob);
          setSelfieUrl(url);
          setStep("review");
        }}
        onBack={() => setStep("flat")}
      />
    );
  }

  if (step === "review") {
    return (
      <VisitorReview
        flatNumber={selectedFlat}
        visitorName={visitorName}
        selfieUrl={selfieUrl}
        onBack={() => setStep("selfie")}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onSubmit={async () => {
          try {
            setIsSubmitting(true);
            setSubmitError(null);

            if (!selfieBlob) {
              setSubmitError("Selfie is missing. Please take a selfie again.");
              return;
            }

            const result = await createVisitor(
              visitorName,
              selectedFlatId,
              selfieBlob,
            );
            setVisitorLogId(result.id);
            setStep("waiting");
            console.log("Visitor request created:", result);
          } catch (error) {
            console.error("Failed to submit visitor request:", error);

            setSubmitError(
              error instanceof Error
                ? error.message
                : "Failed to submit request",
            );
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
    )
  }

  if (step === "waiting") {
    return (
      <WaitingForApproval
        flatNumber={selectedFlat}
        visitorName={visitorName}
      />
    );
  }

  if (
    step === "approved" &&
    passExpiresAt
  ) {
    return (
      <VisitorApproved
        flatNumber={selectedFlat}
        visitorName={visitorName}
        passExpiresAt={passExpiresAt}
        onExpired={() => {
          setStep("expired");
        }}
      />
    );
  }

  if (step === "expired") {
    return (
      <VisitorExpired
        flatNumber={selectedFlat}
        visitorName={visitorName}
      />
    );
  }

  if (step === "denied") {
    return (
      <VisitorDenied
        flatNumber={selectedFlat}
        visitorName={visitorName}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white text-xl font-bold">
              GP
            </div>

            <h1 className="text-2xl font-bold text-slate-900">
              GatePulse
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Visitor Entry
            </p>
          </div>

          {societyError ? (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {societyError}
            </div>
          ) : (
            <div className="mb-6 rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Society
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-900">
                {loadingSociety ? "Loading..." : societyName}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Please provide your details to request entry.
              </p>
            </div>
          )}

          <button
            type="button"
            disabled={loadingSociety || Boolean(societyError)}
            onClick={() => setStep("flat")}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Request Entry
          </button>

          <p className="mt-4 text-center text-xs text-slate-400">
            Your entry request will be sent to the resident for approval.
          </p>
        </div>
      </div>
    </main>
  );
}

export default App;

