import { useEffect, useState } from "react";
import SelfieCapture from "./components/SelfieCapture";
import VisitorReview from "./components/VisitorReview";
import WaitingForApproval from "./components/WaitingForApproval";
import { createVisitor, getSocieties } from "./lib/api";
import { connectToVisitorSocket } from "./lib/socket";

type Step =
  | "welcome"
  | "flat"
  | "details"
  | "selfie"
  | "review"
  | "waiting";

type Flat = {
  id: string;
  unitNumber: string;
  residentName: string;
};

function App() {
  const [step, setStep] = useState<Step>("welcome");
  const [selectedFlat, setSelectedFlat] = useState("");
  const [selectedFlatId, setSelectedFlatId] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [loadingFlats, setLoadingFlats] = useState(true);
  const [flatError, setFlatError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [visitorLogId, setVisitorLogId] = useState<string | null>(null);

  useEffect(() => {
    async function loadFlats() {
      try {
        setLoadingFlats(true);

        const societies = await getSocieties();

        if (!societies.length) {
          throw new Error("No society found");
        }
        //TODO: Update this to get society based on QR code
        setFlats(societies[0].flats);
      } catch (error) {
        console.error("Failed to load flats:", error);
        setFlatError("Unable to load flats. Please try again.");
      } finally {
        setLoadingFlats(false);
      }
    }

    loadFlats();
  }, []);

  useEffect(() => {
    if (step !== "waiting" || !visitorLogId) {
      return;
    }

    const socket = connectToVisitorSocket(visitorLogId);

    return () => {
      socket.disconnect();
    };
  }, [step, visitorLogId]);

  if (step === "details") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-medium text-slate-500">
              GatePulse Residency
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
              GatePulse Residency
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Who are you visiting?
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Select the flat you are visiting.
            </p>
          </div>

          <div className="space-y-3">
            {loadingFlats && (
              <div className="rounded-xl bg-white p-4 text-center text-sm text-slate-500">
                Loading flats...
              </div>
            )}

            {flatError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {flatError}
              </div>
            )}

            {!loadingFlats &&
              !flatError &&
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

          <div className="mb-6 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Society
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-900">
              GatePulse Residency
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Please provide your details to request entry.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setStep("flat")}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
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