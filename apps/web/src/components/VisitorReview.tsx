type VisitorReviewProps = {
    flatNumber: string;
    visitorName: string;
    selfieUrl: string | null;
    onSubmit: () => void;
    onBack: () => void;
    isSubmitting?: boolean;
    submitError?: string | null;
};

export default function VisitorReview({
    flatNumber,
    visitorName,
    selfieUrl,
    onSubmit,
    onBack,
    isSubmitting = false,
    submitError = null,
}: VisitorReviewProps) {
    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8">
            <div className="mx-auto max-w-md">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={onBack}
                        className="mb-4 text-sm font-medium text-slate-600 hover:text-slate-900"
                    >
                        ← Back
                    </button>

                    <h1 className="text-2xl font-bold text-slate-900">
                        Review your request
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Please verify your details before sending the entry request.
                    </p>
                </div>

                {/* Visit Details */}
                <div className="space-y-4">
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Visiting
                        </p>

                        <p className="mt-1 text-lg font-semibold text-slate-900">
                            Flat {flatNumber}
                        </p>
                    </div>

                    {/* Visitor */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                            Visitor
                        </p>

                        <p className="mt-1 text-lg font-semibold text-slate-900">
                            {visitorName}
                        </p>
                    </div>

                    {/* Selfie */}
                    <div className="rounded-2xl bg-white p-5 shadow-sm">
                        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                            Selfie
                        </p>

                        {selfieUrl ? (
                            <div className="overflow-hidden rounded-xl">
                                <img
                                    src={selfieUrl}
                                    alt="Visitor selfie"
                                    className="h-64 w-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="flex h-48 items-center justify-center rounded-xl bg-slate-100 text-sm text-slate-400">
                                No selfie captured
                            </div>
                        )}
                    </div>
                </div>

                {/* Submit */}
                {submitError && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                        {submitError}
                    </div>
                )}

                <button
                    onClick={onSubmit}
                    disabled={isSubmitting}
                    className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isSubmitting ? "Submitting..." : "Submit Request"}
                </button>

                <p className="mt-3 text-center text-xs text-slate-400">
                    Your request will be sent to the resident for approval.
                </p>
            </div>
        </div>
    );
}