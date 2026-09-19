export function normalizePhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, "");

    // India country code: 91
    // WhatsApp sends: 919920419564
    // Database stores: 9920419564
    if (digits.length === 12 && digits.startsWith("91")) {
        return digits.slice(2);
    }

    return digits;
}