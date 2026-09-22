import crypto from "node:crypto";
import { prisma } from "./prisma.js";

const SESSION_DAYS = 7;

function hash(value: string) {
    return crypto.createHash("sha256").update(value).digest("hex");
}

export function hashResidentPin(pin: string) {
    return hash(pin);
}

export async function loginResident(phone: string, pin: string) {
    const normalizedPhone = phone.replace(/\D/g, "");
    const resident = await prisma.resident.findFirst({
        where: { phone: normalizedPhone },
        include: { flat: { include: { society: true } } },
    });

    if (!resident || resident.pinHash !== hashResidentPin(pin)) {
        return null;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.residentSession.create({
        data: {
            residentId: resident.id,
            tokenHash: hash(rawToken),
            expiresAt: new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000),
        },
    });

    return { token: rawToken, resident };
}

export async function getResidentFromToken(token: string) {
    if (!token) return null;
    const session = await prisma.residentSession.findUnique({
        where: { tokenHash: hash(token) },
        include: {
            resident: {
                include: { flat: { include: { society: true } } },
            },
        },
    });

    if (!session || session.expiresAt <= new Date()) {
        return null;
    }

    return session.resident;
}
