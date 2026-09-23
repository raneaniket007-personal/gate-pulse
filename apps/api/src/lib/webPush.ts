import webpush from "web-push";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";

let configured = false;

function configure() {
    if (configured) return true;
    if (
        !env.webPushVapidSubject ||
        !env.webPushVapidPublicKey ||
        !env.webPushVapidPrivateKey
    ) {
        return false;
    }

    webpush.setVapidDetails(
        env.webPushVapidSubject,
        env.webPushVapidPublicKey,
        env.webPushVapidPrivateKey,
    );
    configured = true;
    return true;
}

export async function sendResidentPush(
    residentId: string,
    payload: { title: string; body: string; url: string; visitorLogId: string },
) {
    if (!configure()) {
        console.warn("Web Push is not configured; skipping push notification");
        return;
    }

    const subscriptions = await prisma.pushSubscription.findMany({
        where: { residentId },
    });

    await Promise.all(
        subscriptions.map(async (subscription) => {
            try {
                await webpush.sendNotification(
                    {
                        endpoint: subscription.endpoint,
                        keys: {
                            p256dh: subscription.p256dh,
                            auth: subscription.auth,
                        },
                    },
                    JSON.stringify(payload),
                    { TTL: 300, urgency: "high" },
                );
            } catch (error: unknown) {
                const statusCode =
                    typeof error === "object" &&
                    error !== null &&
                    "statusCode" in error
                        ? Number((error as { statusCode?: number }).statusCode)
                        : undefined;

                if (statusCode === 404 || statusCode === 410) {
                    await prisma.pushSubscription.delete({
                        where: { id: subscription.id },
                    });
                } else {
                    console.error("Failed to send resident push:", error);
                }
            }
        }),
    );
}
