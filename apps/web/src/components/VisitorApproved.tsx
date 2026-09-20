import { useEffect, useState } from "react";

type VisitorApprovedProps = {
  flatNumber: string;
  visitorName: string;
  passExpiresAt: string;
  onExpired: () => void;
};

function VisitorApproved({
  flatNumber,
  visitorName,
  passExpiresAt,
  onExpired,
}: VisitorApprovedProps) {
  const calculateRemainingSeconds = () => {
    const expiryTime =
      new Date(passExpiresAt).getTime();

    const remaining =
      Math.ceil(
        (expiryTime - Date.now()) / 1000,
      );

    return Math.max(0, remaining);
  };

  const [remainingSeconds, setRemainingSeconds] =
    useState(calculateRemainingSeconds);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const remaining =
        calculateRemainingSeconds();

      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        window.clearInterval(timer);
        onExpired();
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [passExpiresAt, onExpired]);

  const minutes = Math.floor(
    remainingSeconds / 60,
  );

  const seconds = remainingSeconds % 60;

  const formattedTime =
    `${String(minutes).padStart(2, "0")}:` +
    `${String(seconds).padStart(2, "0")}`;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center">
        <div className="w-full overflow-hidden rounded-2xl border border-green-200 bg-white shadow-sm">

          <div className="bg-green-600 px-6 py-8 text-center text-white">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white">
              <span className="text-4xl text-green-600">
                ✓
              </span>
            </div>

            <h1 className="text-2xl font-bold">
              Entry Approved
            </h1>

            <p className="mt-2 text-sm text-green-50">
              Your visitor pass is active.
            </p>
          </div>

          <div className="p-6">

            <div className="rounded-xl bg-slate-50 p-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Visitor
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {visitorName}
                </p>
              </div>

              <div className="mt-5">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Visiting
                </p>

                <p className="mt-1 text-lg font-semibold text-slate-900">
                  Flat {flatNumber}
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 p-5 text-center">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Pass valid for
              </p>

              <p className="mt-2 text-4xl font-bold tabular-nums text-slate-900">
                {formattedTime}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                This pass expires automatically.
              </p>
            </div>

            <div className="mt-6 rounded-xl bg-green-50 p-4 text-center">
              <p className="text-sm font-medium text-green-800">
                Show this screen to the security guard.
              </p>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

export default VisitorApproved;