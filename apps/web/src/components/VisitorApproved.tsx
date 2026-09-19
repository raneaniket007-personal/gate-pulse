type VisitorApprovedProps = {
  flatNumber: string;
  visitorName: string;
};

function VisitorApproved({
  flatNumber,
  visitorName,
}: VisitorApprovedProps) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center">
        <div className="w-full rounded-2xl border border-green-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <span className="text-3xl">✓</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            Entry Approved
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            The resident has approved your entry.
          </p>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Visiting
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              Flat {flatNumber}
            </p>

            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
              Visitor
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {visitorName}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default VisitorApproved;