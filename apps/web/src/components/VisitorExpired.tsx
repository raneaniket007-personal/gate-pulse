type VisitorExpiredProps = {
    flatNumber: string;
    visitorName: string;
};

function VisitorExpired({
    flatNumber,
    visitorName,
}: VisitorExpiredProps) {
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8">
            <div className="mx-auto flex min-h-[80vh] w-full max-w-md items-center">
                <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">

                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
                        <span className="text-3xl text-slate-500">
                            ⏱
                        </span>
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900">
                        Pass Expired
                    </h1>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                        This visitor pass is no longer valid.
                    </p>

                    <div className="mt-6 rounded-xl bg-slate-50 p-4 text-left">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Visitor
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                {visitorName}
                            </p>
                        </div>

                        <div className="mt-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Visiting
                            </p>

                            <p className="mt-1 font-semibold text-slate-900">
                                Flat {flatNumber}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 rounded-xl bg-amber-50 p-4">
                        <p className="text-sm text-amber-800">
                            Please contact the resident if you still
                            need entry.
                        </p>
                    </div>

                </div>
            </div>
        </main>
    );
}

export default VisitorExpired;