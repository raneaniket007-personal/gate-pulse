import type {
    WhatsAppWebhookMessage,
    WhatsAppWebhookPayload,
} from "../types/whatsapp.js";

export type ParsedWhatsAppMessage = {
    messageId: string;
    from: string;
    timestamp: string;

    type: "text" | "button_reply" | "unknown";

    text?: string;

    button?: {
        id: string;
        title: string;
    };
};

export type VisitorAction = "APPROVE" | "DENY";

export type ParsedVisitorAction = {
    action: VisitorAction;
    visitorLogId: string;
};

export function parseVisitorAction(
    message: ParsedWhatsAppMessage,
): ParsedVisitorAction | null {
    if (message.type !== "button_reply" || !message.button?.id) {
        return null;
    }

    const [action, visitorLogId] = message.button.id.split(":");

    if (!action || !visitorLogId) {
        return null;
    }

    if (action !== "approve" && action !== "deny") {
        return null;
    }

    return {
        action: action === "approve" ? "APPROVE" : "DENY",
        visitorLogId,
    };
}

export function parseWhatsAppWebhook(
    payload: WhatsAppWebhookPayload,
): ParsedWhatsAppMessage[] {
    const messages: ParsedWhatsAppMessage[] = [];

    for (const entry of payload.entry ?? []) {
        for (const change of entry.changes ?? []) {
            if (change.field !== "messages") {
                continue;
            }

            for (const message of change.value?.messages ?? []) {
                messages.push(parseMessage(message));
            }
        }
    }

    return messages;
}

function parseMessage(
    message: WhatsAppWebhookMessage,
): ParsedWhatsAppMessage {
    if (message.type === "text" && message.text?.body) {
        return {
            messageId: message.id,
            from: message.from,
            timestamp: message.timestamp,
            type: "text",
            text: message.text.body,
        };
    }

    if (message.type === "button" && message.button) {
        return {
            messageId: message.id,
            from: message.from,
            timestamp: message.timestamp,
            type: "button_reply",
            button: {
                id: message.button.payload,
                title: message.button.text,
            },
        };
    }

    if (
        message.type === "interactive" &&
        message.interactive?.button_reply
    ) {
        return {
            messageId: message.id,
            from: message.from,
            timestamp: message.timestamp,
            type: "button_reply",
            button: {
                id: message.interactive.button_reply.id,
                title: message.interactive.button_reply.title,
            },
        };
    }

    return {
        messageId: message.id,
        from: message.from,
        timestamp: message.timestamp,
        type: "unknown",
    };
}