import { Router } from "express";
import { env } from "../config/env.js";
import {
    parseVisitorAction,
    parseWhatsAppWebhook,
} from "../lib/whatsappWebhook.js";
import type { WhatsAppWebhookPayload } from "../types/whatsapp.js";
import { authorizeVisitorAction } from "../lib/visitorAuthorization.js";
import { updateVisitorStatus } from "../lib/visitorStatus.js";
import { emitVisitorStatus } from "../lib/socket.js";

const router = Router();

router.get("/whatsapp", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("WhatsApp webhook verification request:", {
        mode,
        tokenProvided: Boolean(token),
        challengeProvided: Boolean(challenge),
    });

    if (
        mode === "subscribe" &&
        token === env.whatsappVerifyToken
    ) {
        console.log("WhatsApp webhook verified successfully");

        return res.status(200).send(challenge);
    }

    console.error("WhatsApp webhook verification failed");

    return res.sendStatus(403);
});

router.post("/whatsapp", async (req, res) => {
    console.log(
        "WhatsApp webhook event:",
        JSON.stringify(req.body, null, 2),
    );

    const messages = parseWhatsAppWebhook(
        req.body as WhatsAppWebhookPayload,
    );

    for (const message of messages) {
        console.log("Parsed WhatsApp message:", message);

        const visitorAction = parseVisitorAction(message);

        if (!visitorAction) {
            continue;
        }

        console.log("Parsed visitor action:", visitorAction);

        const authorization = await authorizeVisitorAction(
            visitorAction.visitorLogId,
            message.from,
        );

        if (!authorization.authorized) {
            console.warn("Unauthorized visitor action:", {
                visitorLogId: visitorAction.visitorLogId,
                whatsappSender: message.from,
                reason: authorization.reason,
            });

            continue;
        }

        console.log("Visitor action authorized:", {
            visitorLogId: visitorAction.visitorLogId,
            action: visitorAction.action,
            flatNumber: authorization.flat.unitNumber,
            residentName: authorization.flat.residentName,
        });

        const statusResult = await updateVisitorStatus(
            visitorAction.visitorLogId,
            visitorAction.action,
        );

        if (!statusResult.success) {
            console.warn("Visitor status update rejected:", {
                visitorLogId: visitorAction.visitorLogId,
                action: visitorAction.action,
                reason: statusResult.reason,
            });

            continue;
        }

        emitVisitorStatus(
            statusResult.visitorLogId,
            statusResult.status,
        );
    }

    return res.sendStatus(200);
});

export default router;