export type WhatsAppWebhookMessage = {
    id: string;
    from: string;
    timestamp: string;
    type: string;

    text?: {
        body: string;
    };

    button?: {
        payload: string;
        text: string;
    };

    interactive?: {
        type?: string;
        button_reply?: {
            id: string;
            title: string;
        };
    };
};

export type WhatsAppWebhookPayload = {
    object?: string;

    entry?: Array<{
        id?: string;

        changes?: Array<{
            field?: string;

            value?: {
                messaging_product?: string;

                metadata?: {
                    display_phone_number?: string;
                    phone_number_id?: string;
                };

                contacts?: Array<{
                    profile?: {
                        name?: string;
                    };

                    wa_id?: string;
                    user_id?: string;
                }>;

                messages?: WhatsAppWebhookMessage[];
            };
        }>;
    }>;
};