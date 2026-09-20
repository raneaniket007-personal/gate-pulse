import { env } from "../config/env.js";

const WHATSAPP_API_VERSION = "v26.0";

const whatsappUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${env.whatsappPhoneNumberId}/messages`;

type SendVisitorRequestTemplateParams = {
    to: string;
    visitorName: string;
    flatNumber: string;
    visitorLogId: string;
};

export async function sendVisitorRequestTemplate({
    to,
    visitorName,
    flatNumber,
    visitorLogId,
}: SendVisitorRequestTemplateParams) {
    if (!env.whatsappAccessToken || !env.whatsappPhoneNumberId) {
        throw new Error("WhatsApp environment variables are not configured");
    }
    console.log("Sending WhatsApp template to:", to);
    console.log("Template parameters:", {
        visitorName,
        flatNumber,
        visitorLogId,
    });
    const response = await fetch(whatsappUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.whatsappAccessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to,
            type: "template",
            template: {
                name: "gatepulse_visitor_request",
                language: {
                    code: "en",
                },
                components: [
                    {
                        type: "body",
                        parameters: [
                            {
                                type: "text",
                                text: visitorName,
                            },
                            {
                                type: "text",
                                text: flatNumber,
                            },
                        ],
                    },
                    {
                        type: "button",
                        sub_type: "quick_reply",
                        index: "0",
                        parameters: [
                            {
                                type: "payload",
                                payload: `approve:${visitorLogId}`,
                            },
                        ],
                    },
                    {
                        type: "button",
                        sub_type: "quick_reply",
                        index: "1",
                        parameters: [
                            {
                                type: "payload",
                                payload: `deny:${visitorLogId}`,
                            },
                        ],
                    },
                ],
            },
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("WhatsApp template API error:", data);

        throw new Error(
            data?.error?.message || "Failed to send WhatsApp template",
        );
    }

    return data;
}

export async function sendWhatsAppImage({
    to,
    imageUrl,
    caption,
}: {
    to: string;
    imageUrl: string;
    caption?: string;
}) {
    if (
        !env.whatsappAccessToken ||
        !env.whatsappPhoneNumberId
    ) {
        throw new Error(
            "WhatsApp environment variables are not configured",
        );
    }

    const response = await fetch(whatsappUrl, {
        method: "POST",

        headers: {
            Authorization: `Bearer ${env.whatsappAccessToken}`,
            "Content-Type": "application/json",
        },

        body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",

            to,

            type: "image",

            image: {
                link: imageUrl,
                ...(caption
                    ? {
                        caption,
                    }
                    : {}),
            },
        }),
    });

    const data = await response.json();

    if (!response.ok) {
        console.error(
            "WhatsApp image API error:",
            data,
        );

        throw new Error(
            data?.error?.message ||
            "Failed to send WhatsApp image",
        );
    }

    return data;
}