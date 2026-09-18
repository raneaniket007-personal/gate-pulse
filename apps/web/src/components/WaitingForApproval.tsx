type WaitingForApprovalProps = {
    flatNumber: string;
    visitorName: string;
};

function WaitingForApproval({
    flatNumber,
    visitorName,
}: WaitingForApprovalProps) {
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8">
            <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center">
                <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900">
                        Waiting for approval
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                        Your entry request has been sent to the resident. Please wait for
                        them to approve your visit.
                    </p>

                    <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Visiting
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                Flat {flatNumber}
                            </p>
                        </div>

                        <div className="mt-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Visitor
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                {visitorName}
                            </p>
                        </div>
                    </div>

                    <p className="mt-6 text-xs text-slate-400">
                        This page will automatically update once the resident responds.
                    </p>
                </div>
            </div>
        </main>
    );
}

export default WaitingForApproval;