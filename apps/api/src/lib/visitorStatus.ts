import { prisma } from "./prisma.js";

export type VisitorStatusAction = "APPROVE" | "DENY";

export type VisitorStatusResult =
    | {
        success: true;
        status: "APPROVED" | "DENIED";
        visitorLogId: string;
        passExpiresAt: Date | null;
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
            passExpiresAt: true,
        },
    });

    if (!visitorLog) {
        return {
            success: false,
            reason: "VISITOR_NOT_FOUND",
        };
    }

    /*
     * A visitor request can only be processed once.
     */
    if (visitorLog.status !== "PENDING") {
        return {
            success: false,
            reason: "ALREADY_PROCESSED",
        };
    }

    /*
     * The resident cannot approve/deny an already-expired request.
     */
    if (
        visitorLog.expiresAt &&
        visitorLog.expiresAt <= new Date()
    ) {
        await prisma.visitorLog.updateMany({
            where: {
                id: visitorLog.id,
                status: "PENDING",
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

    const now = new Date();

    const newStatus =
        action === "APPROVE" ? "APPROVED" : "DENIED";

    /*
     * The visitor pass is valid for 10 minutes from approval.
     */
    const passExpiresAt =
        action === "APPROVE"
            ? new Date(now.getTime() + 10 * 60 * 1000)
            : null;

    /*
     * Atomic state transition.
     *
     * This guarantees that only one webhook can change
     * PENDING → APPROVED/DENIED.
     */
    const result = await prisma.visitorLog.updateMany({
        where: {
            id: visitorLog.id,
            status: "PENDING",
        },
        data:
            action === "APPROVE"
                ? {
                    status: "APPROVED",
                    approvedAt: now,
                    passExpiresAt,
                }
                : {
                    status: "DENIED",
                },
    });

    /*
     * Another webhook may have processed this visitor
     * between our initial read and the update.
     */
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
        passExpiresAt,
    };
}