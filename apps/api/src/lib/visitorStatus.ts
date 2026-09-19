import { prisma } from "./prisma.js";

export type VisitorStatusAction = "APPROVE" | "DENY";

export type VisitorStatusResult =
    | {
        success: true;
        status: "APPROVED" | "DENIED";
        visitorLogId: string;
    }
    | {
        success: false;
        reason:
        | "VISITOR_NOT_FOUND"
        | "ALREADY_PROCESSED"
        | "EXPIRED";
    };

export async function updateVisitorStatus(
    visitorLogId: string,
    action: VisitorStatusAction,
): Promise<VisitorStatusResult> {
    const visitorLog = await prisma.visitorLog.findUnique({
        where: {
            id: visitorLogId,
        },
        select: {
            id: true,
            status: true,
            expiresAt: true,
        },
    });

    if (!visitorLog) {
        return {
            success: false,
            reason: "VISITOR_NOT_FOUND",
        };
    }

    if (visitorLog.status !== "PENDING") {
        return {
            success: false,
            reason: "ALREADY_PROCESSED",
        };
    }

    if (
        visitorLog.expiresAt &&
        visitorLog.expiresAt <= new Date()
    ) {
        await prisma.visitorLog.update({
            where: {
                id: visitorLog.id,
            },
            data: {
                status: "EXPIRED",
            },
        });

        return {
            success: false,
            reason: "EXPIRED",
        };
    }

    const newStatus =
        action === "APPROVE" ? "APPROVED" : "DENIED";

    const result = await prisma.visitorLog.updateMany({
        where: {
            id: visitorLog.id,
            status: "PENDING",
        },
        data: {
            status: newStatus,
        },
    });

    if (result.count !== 1) {
        return {
            success: false,
            reason: "ALREADY_PROCESSED",
        };
    }

    return {
        success: true,
        status: newStatus,
        visitorLogId: visitorLog.id,
    };
}