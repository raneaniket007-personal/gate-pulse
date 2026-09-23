import webpush from "web-push";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";

let configured = false;

export type ResidentPushResult = {
    configured: boolean;
    subscriptions: number;
    sent: number;
    failed: number;
    removed: number;
    errors: string[];
};

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
): Promise<ResidentPushResult> {
    if (!configure()) {
        console.warn("Web Push is not configured");
        return {
            configured: false,
            subscriptions: 0,
            sent: 0,
            failed: 0,
            removed: 0,
            errors: ["Missing VAPID subject, public key, or private key"],
        };
    }

    const subscriptions = await prisma.pushSubscription.findMany({
        where: { residentId },
    });

    const result: ResidentPushResult = {
        configured: true,
        subscriptions: subscriptions.length,
        sent: 0,
        failed: 0,
        removed: 0,
        errors: [],
    };

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
                result.sent += 1;
            } catch (error: unknown) {
                const statusCode =
                    typeof error === "object" &&
                    error !== null &&
                    "statusCode" in error
                        ? Number((error as { statusCode?: number }).statusCode)
                        : undefined;

                const message =
                    error instanceof Error ? error.message : String(error);

                if (statusCode === 404 || statusCode === 410) {
                    await prisma.pushSubscription.delete({
                        where: { id: subscription.id },
                    });
                    result.removed += 1;
                } else {
                    result.failed += 1;
                    result.errors.push(
                        `subscription ${subscription.id}: ${statusCode ? `HTTP ${statusCode} - ` : ""}${message}`,
                    );
                    console.error("Failed to send resident push:", error);
                }
            }
        }),
    );

    return result;
}
