import { savePushSubscription } from "./residentApi";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export async function enableResidentPush() {
    if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
    ) {
        throw new Error("Push notifications are not supported in this browser.");
    }

    const publicKey = import.meta.env.VITE_WEB_PUSH_VAPID_PUBLIC_KEY as string | undefined;
    if (!publicKey) {
        throw new Error("VITE_WEB_PUSH_VAPID_PUBLIC_KEY is not configured.");
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        throw new Error("Notification permission was not granted.");
    }

    const existing = await registration.pushManager.getSubscription();
    const subscription =
        existing ||
        (await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

    await savePushSubscription(subscription.toJSON());
}
