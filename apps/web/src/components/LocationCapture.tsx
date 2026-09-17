import { useState } from "react";

interface LocationCaptureProps {
    onLocation: (location: {
        latitude: number;
        longitude: number;
        accuracy: number;
    }) => void;
    onBack: () => void;
}

function LocationCapture({
    onLocation,
    onBack,
}: LocationCaptureProps) {
    const [status, setStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");

    const [error, setError] = useState<string | null>(null);

    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
        accuracy: number;
    } | null>(null);

    function requestLocation() {
        if (!navigator.geolocation) {
            setStatus("error");
            setError(
                "Location services are not supported by this browser.",
            );
            return;
        }

        setStatus("loading");
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const result = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                };

                setLocation(result);
                setStatus("success");

                onLocation(result);
            },
            (error) => {
                setStatus("error");

                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        setError(
                            "Location permission was denied. Please allow location access to continue.",
                        );
                        break;

                    case error.POSITION_UNAVAILABLE:
                        setError(
                            "Your current location could not be determined. Please try again.",
                        );
                        break;

                    case error.TIMEOUT:
                        setError(
                            "Location request timed out. Please try again.",
                        );
                        break;

                    default:
                        setError(
                            "Unable to determine your location. Please try again.",
                        );
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
            },
        );
    }

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8">
            <div className="mx-auto w-full max-w-md">
                <div className="mb-8">
                    <p className="text-sm font-medium text-slate-500">
                        GatePulse Residency
                    </p>

                    <h1 className="mt-1 text-2xl font-bold text-slate-900">
                        Verify your location
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        We need to confirm that you are at the society gate before
                        sending your entry request.
                    </p>
                </div>

                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
                        📍
                    </div>

                    <h2 className="font-semibold text-slate-900">
                        Why do we need your location?
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        GatePulse uses your location only to verify that the request
                        is being made from the society gate.
                    </p>
                </div>

                {status === "success" && location ? (
                    <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
                                ✓
                            </div>

                            <div>
                                <p className="font-semibold text-green-800">
                                    Location captured
                                </p>

                                <p className="text-sm text-green-700">
                                    Accuracy: approximately{" "}
                                    {Math.round(location.accuracy)}m
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={requestLocation}
                            disabled={status === "loading"}
                            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {status === "loading"
                                ? "Getting your location..."
                                : "Allow Location"}
                        </button>
                    </>
                )}

                <button
                    type="button"
                    onClick={onBack}
                    className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600"
                >
                    Back
                </button>
            </div>
        </main>
    );
}

export default LocationCapture;