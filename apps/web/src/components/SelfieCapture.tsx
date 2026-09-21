import { useEffect, useRef, useState } from "react";

interface SelfieCaptureProps {
    onCapture: (image: Blob) => void;
    onBack: () => void;
}

function SelfieCapture({
    onCapture,
    onBack,
}: SelfieCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

    const startCamera = async () => {
        try {
            setError(null);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "user",
                },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch {
            setError(
                "Camera access is required to take a selfie. Please allow camera access and try again.",
            );
        }
    };

    useEffect(() => {
        if (capturedImage) {
            return;
        }

        startCamera();

        return () => {
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };
    }, [capturedImage]);

    function capturePhoto() {
        const video = videoRef.current;

        if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
            return;
        }

        const canvas = document.createElement("canvas");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext("2d");

        if (!context) {
            return;
        }

        // Flip the canvas horizontally so the saved image is NOT mirrored.
        context.translate(canvas.width, 0);
        context.scale(-1, 1);

        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height,
        );

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    return;
                }

                const imageUrl = URL.createObjectURL(blob);

                setCapturedBlob(blob);
                setCapturedImage(imageUrl);

                streamRef.current?.getTracks().forEach((track) => track.stop());
                streamRef.current = null;
            },
            "image/jpeg",
            0.85,
        );
    }

    function retakePhoto() {
        if (capturedImage) {
            URL.revokeObjectURL(capturedImage);
        }

        setCapturedImage(null);
        setCapturedBlob(null);
    }

    function continueWithPhoto() {
        if (!capturedBlob) {
            return;
        }

        onCapture(capturedBlob);
    }

    if (capturedImage) {
        return (
            <main className="min-h-screen bg-slate-50 px-4 py-8">
                <div className="mx-auto w-full max-w-md">
                    <div className="mb-6">
                        <p className="text-sm font-medium text-slate-500">
                            GatePulse Residency
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-slate-900">
                            Check your selfie
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Make sure your face is clearly visible before continuing.
                        </p>
                    </div>

                    <div className="overflow-hidden rounded-2xl bg-black shadow-sm">
                        <img
                            src={capturedImage}
                            alt="Captured selfie"
                            className="aspect-[3/4] w-full object-cover"
                        />
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={retakePhoto}
                            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
                        >
                            Retake
                        </button>

                        <button
                            type="button"
                            onClick={continueWithPhoto}
                            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                        >
                            Continue
                        </button>
                    </div>

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

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8">
            <div className="mx-auto w-full max-w-md">
                <div className="mb-6">
                    <p className="text-sm font-medium text-slate-500">
                        GatePulse Residency
                    </p>

                    <h1 className="mt-1 text-2xl font-bold text-slate-900">
                        Take your selfie
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        This photo will be shared with the resident for verification.
                    </p>
                </div>

                <div className="overflow-hidden rounded-2xl bg-black shadow-sm">
                    {error ? (
                        <div className="flex min-h-[360px] flex-col items-center justify-center p-6 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-amber-400 text-xl font-bold">
                                📷
                            </div>
                            <p className="text-sm font-medium text-white">{error}</p>
                            <p className="mt-2 text-xs text-slate-400">
                                If you blocked permissions, tap your browser's lock icon 🔒 next to the address bar to allow camera access.
                            </p>
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="aspect-[3/4] w-full object-cover"
                            style={{
                                transform: "scaleX(-1)",
                            }}
                        />
                    )}
                </div>

                {error ? (
                    <button
                        type="button"
                        onClick={startCamera}
                        className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        Try Again
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={capturePhoto}
                        disabled={!!error}
                        className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Take Selfie
                    </button>
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

export default SelfieCapture;