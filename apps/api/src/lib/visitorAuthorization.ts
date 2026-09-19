import { prisma } from "./prisma.js";
import { normalizePhoneNumber } from "./phone.js";

export type VisitorAuthorizationResult =
    | {
        authorized: true;
        visitorLog: {
            id: string;
            status: string;
            expiresAt: Date | null;
        };
        flat: {
            id: string;
            unitNumber: string;
            residentName: string;
            phone: string;
        };
    }
    | {
        authorized: false;
        reason:
        | "VISITOR_NOT_FOUND"
        | "FLAT_NOT_FOUND"
        | "PHONE_MISMATCH";
    };

export async function authorizeVisitorAction(
    visitorLogId: string,
    whatsappSender: string,
): Promise<VisitorAuthorizationResult> {
    const visitorLog = await prisma.visitorLog.findUnique({
        where: {
            id: visitorLogId,
        },
        include: {
            flat: true,
        },
    });

    if (!visitorLog) {
        return {
            authorized: false,
            reason: "VISITOR_NOT_FOUND",
        };
    }

    if (!visitorLog.flat) {
        return {
            authorized: false,
            reason: "FLAT_NOT_FOUND",
        };
    }

    const senderPhone = normalizePhoneNumber(whatsappSender);
    const residentPhone = normalizePhoneNumber(
        visitorLog.flat.phone,
    );

    console.log("Authorizing visitor action:", {
        visitorLogId,
        senderPhone,
        residentPhone,
    });

    if (senderPhone !== residentPhone) {
        return {
            authorized: false,
            reason: "PHONE_MISMATCH",
        };
    }

    return {
        authorized: true,
        visitorLog: {
            id: visitorLog.id,
            status: visitorLog.status,
            expiresAt: visitorLog.expiresAt,
        },
        flat: {
            id: visitorLog.flat.id,
            unitNumber: visitorLog.flat.unitNumber,
            residentName: visitorLog.flat.residentName,
            phone: visitorLog.flat.phone,
        },
    };
}